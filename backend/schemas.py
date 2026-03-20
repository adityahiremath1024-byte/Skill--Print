"""Pydantic v2 schemas for all SkillPrint AI request / response models."""

from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ─── Skill Extraction ────────────────────────────────────────────────

class SkillItem(BaseModel):
    name: str
    category: str = ""
    raw_confidence: float = Field(ge=0, le=1, default=0.5)
    years_since_used: float = Field(ge=0, default=0.0)
    decayed_confidence: float = Field(ge=0, le=1, default=0.5)
    source: str = "resume"  # "resume" | "jd" | "both"


class ParseRequest(BaseModel):
    resume_text: str
    jd_text: str


class ParseResponse(BaseModel):
    skills: list[SkillItem]
    jd_requirements: list[SkillItem]
    match_score: float = Field(ge=0, le=1)


# ─── Diagnostic / BKT ────────────────────────────────────────────────

class DiagnosticGenerateRequest(BaseModel):
    skills: list[SkillItem]


class DiagnosticQuestion(BaseModel):
    id: str
    skill: str
    question: str
    difficulty: str = "medium"  # easy | medium | hard
    claimed_depth: float = 0.5


class DiagnosticGenerateResponse(BaseModel):
    questions: list[DiagnosticQuestion]


class DiagnosticAnswerRequest(BaseModel):
    question_id: str
    skill: str
    question: str
    answer: str
    current_mastery: float = Field(ge=0, le=1, default=0.5)


class BKTUpdate(BaseModel):
    skill: str
    prior: float
    posterior: float
    correct: bool
    assessment: str = ""


class DiagnosticAnswerResponse(BaseModel):
    bkt_update: BKTUpdate


# ─── Learning Path DAG ───────────────────────────────────────────────

class DAGNode(BaseModel):
    id: str
    label: str
    category: str = ""
    mastery: float = Field(ge=0, le=1, default=0.0)
    required: float = Field(ge=0, le=1, default=0.5)
    gap: float = Field(ge=0, le=1, default=0.0)
    priority: str = "medium"  # low | medium | high | critical
    hours_to_close: float = 0.0
    reasoning: str = ""


class DAGEdge(BaseModel):
    source: str
    target: str
    label: str = ""


class LearningPathRequest(BaseModel):
    skill_scores: list[SkillItem]
    jd_requirements: list[SkillItem]
    bkt_updates: list[BKTUpdate] = []


class LearningPathResponse(BaseModel):
    nodes: list[DAGNode]
    edges: list[DAGEdge]


# ─── Sandbox ─────────────────────────────────────────────────────────

class SandboxEvaluateRequest(BaseModel):
    scenario: str
    response: str
    skill: str = ""


class SandboxEvaluateResponse(BaseModel):
    score: float = Field(ge=0, le=1)
    feedback: str
    strengths: list[str] = []
    improvements: list[str] = []
