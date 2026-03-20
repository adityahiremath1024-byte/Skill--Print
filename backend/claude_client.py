"""
Claude API client with dual-model cost-optimization strategy.

CHEAP_MODEL  → Haiku   — for extraction, classification, structured JSON
SMART_MODEL  → Sonnet  — for diagnostic questions, evaluation, reasoning
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

import anthropic

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")

CHEAP_MODEL = "claude-haiku-4-5-20251001"
SMART_MODEL = "claude-sonnet-4-20250514"

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client


def _call(model: str, system: str, user: str, max_tokens: int = 4096) -> str:
    """Synchronous Claude call — returns the text content."""
    client = _get_client()
    msg = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return msg.content[0].text


def _parse_json(text: str) -> Any:
    """Extract the first JSON object/array from text, tolerating markdown fences."""
    # Strip markdown code fences if present
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = text.strip().rstrip("`")
    # Find first { or [
    for i, ch in enumerate(text):
        if ch in "{[":
            text = text[i:]
            break
    return json.loads(text)


# ─── Public API ──────────────────────────────────────────────────────


def extract_skills(resume_text: str, jd_text: str) -> dict:
    """USE CHEAP_MODEL — extraction is classification, not reasoning."""
    system = (
        "You are a technical recruiter AI. Extract skills from a resume and "
        "job description. Output ONLY valid JSON with the structure:\n"
        '{"skills": [{"name": "...", "category": "...", "raw_confidence": 0.0-1.0, '
        '"years_since_used": 0.0, "source": "resume"|"jd"|"both"}], '
        '"jd_requirements": [{"name": "...", "category": "...", "raw_confidence": 0.0-1.0, '
        '"years_since_used": 0.0, "source": "jd"}], "match_score": 0.0-1.0}\n'
        "Estimate years_since_used from context clues (dates, recency of projects). "
        "raw_confidence = how strongly the evidence supports proficiency (0-1)."
    )
    user = f"RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{jd_text}"
    raw = _call(CHEAP_MODEL, system, user)
    return _parse_json(raw)


def generate_diagnostic_questions(skills: list[dict]) -> list[dict]:
    """USE SMART_MODEL — question quality determines BKT accuracy."""
    system = (
        "You are a senior technical interviewer. Generate 5-8 adversarial diagnostic "
        "questions to test claimed skills. Each question should probe real understanding, "
        "not surface-level recall. Output ONLY valid JSON array:\n"
        '[{"id": "q1", "skill": "...", "question": "...", "difficulty": "easy"|"medium"|"hard", '
        '"claimed_depth": 0.0-1.0}]\n'
        "Cover the most important skills. Mix difficulties. Make questions specific and scenario-based."
    )
    user = f"SKILL PROFILE:\n{json.dumps(skills, indent=2)}"
    raw = _call(SMART_MODEL, system, user)
    return _parse_json(raw)


def evaluate_answer(skill: str, question: str, answer: str) -> dict:
    """USE SMART_MODEL — needs nuanced judgment on answer quality."""
    system = (
        "You are a technical evaluator. Assess whether the candidate's answer demonstrates "
        "genuine mastery of the skill. Output ONLY valid JSON:\n"
        '{"correct": true|false, "assessment": "brief explanation", "confidence": 0.0-1.0}\n'
        "Be strict but fair. Partial credit should lean toward correct=false if the "
        "core concept is misunderstood."
    )
    user = f"SKILL: {skill}\nQUESTION: {question}\nANSWER: {answer}"
    raw = _call(SMART_MODEL, system, user)
    return _parse_json(raw)


def generate_dag(skill_scores: list[dict], jd_requirements: list[dict], bkt_updates: list[dict] = None) -> dict:
    """USE CHEAP_MODEL — structured JSON generation."""
    system = (
        "You are a learning-path architect. Given skill scores and job requirements, "
        "generate a directed acyclic graph (DAG) of learning priorities. Output ONLY valid JSON:\n"
        '{"nodes": [{"id": "n1", "label": "...", "category": "...", "mastery": 0.0-1.0, '
        '"required": 0.0-1.0, "gap": 0.0-1.0, "priority": "low"|"medium"|"high"|"critical", '
        '"hours_to_close": 0.0, "reasoning": "..."}], '
        '"edges": [{"source": "n1", "target": "n2", "label": "prerequisite"}]}\n'
        "Connect skills that are prerequisites. Prioritize by gap size. "
        "Estimate hours_to_close based on gap magnitude. Include reasoning traces."
    )
    payload = {
        "skill_scores": skill_scores,
        "jd_requirements": jd_requirements,
    }
    if bkt_updates:
        payload["bkt_updates"] = bkt_updates
    user = json.dumps(payload, indent=2)
    raw = _call(CHEAP_MODEL, system, user)
    return _parse_json(raw)


def evaluate_sandbox(scenario: str, response: str) -> dict:
    """USE SMART_MODEL — needs deep reasoning for scenario evaluation."""
    system = (
        "You are a senior engineer evaluating a candidate's response to a realistic "
        "work scenario. Provide a thorough evaluation. Output ONLY valid JSON:\n"
        '{"score": 0.0-1.0, "feedback": "...", "strengths": ["..."], "improvements": ["..."]}\n'
        "Be specific and constructive."
    )
    user = f"SCENARIO:\n{scenario}\n\nCANDIDATE RESPONSE:\n{response}"
    raw = _call(SMART_MODEL, system, user)
    return _parse_json(raw)


def generate_sandbox_scenario(skills: list[dict]) -> dict:
    """USE CHEAP_MODEL — generate a realistic work scenario for sandbox testing."""
    system = (
        "You are a senior engineer creating a realistic work scenario to test a candidate. "
        "The scenario should be a real-world problem that requires the listed skills. "
        "Output ONLY valid JSON:\n"
        '{"scenario": "...", "skill": "primary skill being tested", '
        '"expected_approach": "brief description of ideal approach"}'
    )
    user = f"SKILLS TO TEST:\n{json.dumps(skills, indent=2)}"
    raw = _call(CHEAP_MODEL, system, user)
    return _parse_json(raw)
