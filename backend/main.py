"""
SkillPrint AI — FastAPI Backend
"""

from __future__ import annotations

import io
import uuid

import fitz  # PyMuPDF
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import claude_client
from bkt import BayesianKnowledgeTracing
from decay import temporal_decay
from schemas import (
    BKTUpdate,
    DAGEdge,
    DAGNode,
    DiagnosticAnswerRequest,
    DiagnosticAnswerResponse,
    DiagnosticGenerateRequest,
    DiagnosticGenerateResponse,
    DiagnosticQuestion,
    LearningPathRequest,
    LearningPathResponse,
    ParseResponse,
    SandboxEvaluateRequest,
    SandboxEvaluateResponse,
    SkillItem,
)

# ─── App Init ────────────────────────────────────────────────────────

app = FastAPI(title="SkillPrint AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://skillprint-ai.vercel.app",  # Vercel prod
        "http://localhost:5173",               # Local dev
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

bkt_engine = BayesianKnowledgeTracing()

# ─── Health Check ────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "alive"}


# ─── 1. Parse Resume + JD ───────────────────────────────────────────

@app.post("/api/parse", response_model=ParseResponse)
async def parse_resume(
    resume: UploadFile = File(None),
    resume_text: str = Form(""),
    jd_text: str = Form(""),
):
    """Extract skills from resume PDF (or raw text) + job description."""
    # Extract text from PDF if file was uploaded
    text = resume_text
    if resume and resume.filename:
        pdf_bytes = await resume.read()
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = "\n".join(page.get_text() for page in doc)
        doc.close()

    # Call Claude to extract skills
    result = claude_client.extract_skills(text, jd_text)

    # Apply temporal decay to each skill
    skills = []
    for s in result.get("skills", []):
        raw_conf = s.get("raw_confidence", 0.5)
        yrs = s.get("years_since_used", 0.0)
        decayed = temporal_decay(raw_conf, yrs)
        skills.append(
            SkillItem(
                name=s.get("name", ""),
                category=s.get("category", ""),
                raw_confidence=raw_conf,
                years_since_used=yrs,
                decayed_confidence=decayed,
                source=s.get("source", "resume"),
            )
        )

    jd_reqs = []
    for s in result.get("jd_requirements", []):
        jd_reqs.append(
            SkillItem(
                name=s.get("name", ""),
                category=s.get("category", ""),
                raw_confidence=s.get("raw_confidence", 0.5),
                years_since_used=0.0,
                decayed_confidence=s.get("raw_confidence", 0.5),
                source="jd",
            )
        )

    return ParseResponse(
        skills=skills,
        jd_requirements=jd_reqs,
        match_score=result.get("match_score", 0.0),
    )


# ─── 2. Generate Diagnostic Questions ───────────────────────────────

@app.post("/api/diagnostic/generate", response_model=DiagnosticGenerateResponse)
async def diagnostic_generate(req: DiagnosticGenerateRequest):
    """Generate 5-8 adversarial diagnostic questions from skill profile."""
    skill_dicts = [s.model_dump() for s in req.skills]
    questions_raw = claude_client.generate_diagnostic_questions(skill_dicts)

    questions = []
    for i, q in enumerate(questions_raw):
        questions.append(
            DiagnosticQuestion(
                id=q.get("id", f"q{i+1}"),
                skill=q.get("skill", ""),
                question=q.get("question", ""),
                difficulty=q.get("difficulty", "medium"),
                claimed_depth=q.get("claimed_depth", 0.5),
            )
        )

    return DiagnosticGenerateResponse(questions=questions)


# ─── 3. Answer Diagnostic Question + BKT Update ─────────────────────

@app.post("/api/diagnostic/answer", response_model=DiagnosticAnswerResponse)
async def diagnostic_answer(req: DiagnosticAnswerRequest):
    """Evaluate a diagnostic answer and update BKT mastery estimate."""
    eval_result = claude_client.evaluate_answer(req.skill, req.question, req.answer)
    correct = eval_result.get("correct", False)
    prior = req.current_mastery
    posterior = bkt_engine.update(prior, correct)

    return DiagnosticAnswerResponse(
        bkt_update=BKTUpdate(
            skill=req.skill,
            prior=round(prior, 4),
            posterior=round(posterior, 4),
            correct=correct,
            assessment=eval_result.get("assessment", ""),
        )
    )


# ─── 4. Generate Learning Path DAG ──────────────────────────────────

@app.post("/api/learning-path", response_model=LearningPathResponse)
async def learning_path(req: LearningPathRequest):
    """Generate a DAG of learning priorities based on skill gaps."""
    skill_dicts = [s.model_dump() for s in req.skill_scores]
    jd_dicts = [s.model_dump() for s in req.jd_requirements]
    bkt_dicts = [b.model_dump() for b in req.bkt_updates]

    dag_raw = claude_client.generate_dag(skill_dicts, jd_dicts, bkt_dicts)

    nodes = []
    for n in dag_raw.get("nodes", []):
        nodes.append(
            DAGNode(
                id=n.get("id", str(uuid.uuid4())[:8]),
                label=n.get("label", ""),
                category=n.get("category", ""),
                mastery=n.get("mastery", 0.0),
                required=n.get("required", 0.5),
                gap=n.get("gap", 0.0),
                priority=n.get("priority", "medium"),
                hours_to_close=n.get("hours_to_close", 0.0),
                reasoning=n.get("reasoning", ""),
            )
        )

    edges = []
    for e in dag_raw.get("edges", []):
        edges.append(
            DAGEdge(
                source=e.get("source", ""),
                target=e.get("target", ""),
                label=e.get("label", ""),
            )
        )

    return LearningPathResponse(nodes=nodes, edges=edges)


# ─── 5. Sandbox Evaluation ──────────────────────────────────────────

@app.post("/api/sandbox/evaluate", response_model=SandboxEvaluateResponse)
async def sandbox_evaluate(req: SandboxEvaluateRequest):
    """Evaluate a scenario-based sandbox response using Claude."""
    result = claude_client.evaluate_sandbox(req.scenario, req.response)

    return SandboxEvaluateResponse(
        score=result.get("score", 0.0),
        feedback=result.get("feedback", ""),
        strengths=result.get("strengths", []),
        improvements=result.get("improvements", []),
    )
