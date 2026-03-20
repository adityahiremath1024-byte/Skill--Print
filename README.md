# SkillPrint AI 🧬

**AI-powered skill genome mapping** — upload your resume and a job description, and SkillPrint AI extracts your skills with temporal decay modeling, validates your actual mastery through Bayesian Knowledge Tracing (BKT) diagnostics, then generates a personalized learning path DAG to close your skill gaps.

🔗 **Live Demo**: [skillprint-ai.vercel.app](https://skillprint-ai.vercel.app)
---

## Architecture


┌──────────────────────────────────────────────────────┐
│                     GitHub Repo                       │
│                                                      │
│  ┌─────────────┐              ┌─────────────────┐   │
│  │  /frontend   │──── Vercel ──▶  React + Vite   │   │
│  │  React 18    │   (CDN)      │  TailwindCSS    │   │
│  │  D3.js       │              │  Chart.js       │   │
│  │  Framer      │              │  Framer Motion  │   │
│  └──────┬───────┘              └────────┬────────┘   │
│         │                               │            │
│         │         HTTPS API             │            │
│         │◀─────────────────────────────▶│            │
│         │                               │            │
│  ┌──────┴───────┐              ┌────────┴────────┐   │
│  │  /backend    │──── Render ──▶  FastAPI         │   │
│  │  Python 3.11 │   (Web)      │  BKT Engine     │   │
│  │  PyMuPDF     │              │  Decay Model    │   │
│  │  Claude API  │              │  Claude Dual    │   │
│  └──────────────┘              └─────────────────┘   │
└──────────────────────────────────────────────────────┘

LLM Strategy (Cost-Optimized):
  Haiku  → extraction, classification, DAG generation
  Sonnet → diagnostic questions, answer evaluation, sandbox


---

## Features

| Screen | What It Does |
|---|---|
| *Landing* | Upload resume PDF + paste job description, bioluminescent particle UI |
| *Diagnostic* | AI asks 5-8 adaptive questions, BKT updates mastery in real-time |
| *Results* | Dual-polygon radar chart (requirements vs. your skills), sortable gap matrix |
| *Learning Path* | D3 force-directed DAG — click nodes for reasoning traces, filter by priority |
| *Sandbox* | Real-world scenario evaluation with streaming Claude feedback |

---

## Local Development

bash
# 1. Clone and install
git clone <repo-url> && cd skillprint-ai

# 2. Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# 3. Frontend (new terminal)
cd frontend && npm install && npm run dev


Set ANTHROPIC_API_KEY in your environment or a .env file in /backend.

---

## Deployment

### Backend → Render
1. Connect your GitHub repo to [Render](https://render.com)
2. Set *Root Directory* = backend
3. Render auto-detects render.yaml
4. Add env var: ANTHROPIC_API_KEY = your key from [console.anthropic.com](https://console.anthropic.com)

### Frontend → Vercel
1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set *Root Directory* = frontend
3. Add env var: VITE_API_BASE_URL = https://skillprint-backend.onrender.com
4. Deploy — vercel.json handles SPA rewrites automatically

---

## Algorithms

### Temporal Decay

Skill confidence decays exponentially over time without practice:


C_decayed = C_raw × e^(−λ × t)


| Variable | Meaning | Default |
|---|---|---|
| C_raw | Original confidence (0-1) | from resume |
| λ | Decay rate | 0.15 |
| t | Years since last use | from resume |

*Example*: Python with confidence 0.9, unused for 3 years:

C_decayed = 0.9 × e^(−0.15 × 3) = 0.9 × 0.637 = 0.573


### Bayesian Knowledge Tracing (BKT)

Each diagnostic answer updates the mastery estimate:


If correct:
  P(mastery|correct) = P(mastery) × (1 − P_slip) / P(correct)

If incorrect:
  P(mastery|wrong) = P(mastery) × P_slip / P(wrong)

Where:
  P(correct) = P(mastery) × (1 − P_slip) + (1 − P(mastery)) × P_guess


| Parameter | Value | Meaning |
|---|---|---|
| P_init | 0.5 | Prior mastery |
| P_learn | 0.3 | Learning per opportunity |
| P_slip | 0.1 | Wrong despite knowing |
| P_guess | 0.2 | Right despite not knowing |

*Worked Example* (Python, P_mastery = 0.45, correct answer):

P(correct) = 0.45 × 0.9 + 0.55 × 0.2 = 0.405 + 0.11 = 0.515
P(mastery|correct) = (0.45 × 0.9) / 0.515 = 0.786
After learning: 0.786 + (1 − 0.786) × 0.3 = 0.786 + 0.064 = 0.850


---

## Tech Stack

*Frontend*: React 18, Vite, TailwindCSS v4, D3.js v7, Chart.js v4, Framer Motion, React Router v6, Zustand  
*Backend*: FastAPI, Python 3.11, PyMuPDF, Anthropic SDK, Pydantic v2  
*LLM*: Claude Haiku 4.5 + Claude Sonnet 4 (dual-model cost optimization)  
*Deploy*: Vercel (frontend) + Render (backend)

---

## API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Create account → Settings → API Keys → Create Key
3. New accounts get free trial credits (no charge)
4. Key format: sk-ant-api03-xxxx...
5. Never hardcode — set as ANTHROPIC_API_KEY environment variable

---

Built for hackathon evaluation — one URL, zero setup required.


