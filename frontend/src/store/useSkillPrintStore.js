import { create } from 'zustand';
import {
  mockSkills,
  mockJdRequirements,
  mockParseResponse,
  mockQuestions,
  mockDAGNodes,
  mockDAGEdges,
  mockSandboxScenario,
} from '../mocks/skillprint_mock';

/* Auto-initialize with mock data so pages always show content */
const useSkillPrintStore = create((set, get) => ({
  // ─── Resume + JD ──────────────────────────────────
  resumeFile: null,
  resumeText: '',
  jdText: '',
  setResumeFile: (file) => set({ resumeFile: file }),
  setResumeText: (text) => set({ resumeText: text }),
  setJdText: (text) => set({ jdText: text }),

  // ─── Parsed Skills (pre-loaded with mock) ─────────
  skills: mockSkills,
  jdRequirements: mockJdRequirements,
  matchScore: mockParseResponse.match_score,
  setParseResult: (result) =>
    set({
      skills: result.skills || [],
      jdRequirements: result.jd_requirements || [],
      matchScore: result.match_score || 0,
    }),

  // ─── Diagnostic (pre-loaded with mock) ────────────
  questions: mockQuestions,
  currentQuestionIndex: 0,
  bktUpdates: [
    { skill: 'Python', prior: 0.45, posterior: 0.71, correct: true, assessment: 'Strong understanding of dunder methods' },
    { skill: 'React', prior: 0.60, posterior: 0.78, correct: true, assessment: 'Good re-render debugging approach' },
    { skill: 'PostgreSQL', prior: 0.35, posterior: 0.22, correct: false, assessment: 'Missed query plan analysis' },
    { skill: 'Docker', prior: 0.50, posterior: 0.68, correct: true, assessment: 'Excellent multi-stage build knowledge' },
    { skill: 'TensorFlow', prior: 0.30, posterior: 0.18, correct: false, assessment: 'Limited understanding of gradient flow' },
  ],
  setQuestions: (questions) => set({ questions, currentQuestionIndex: 0 }),
  advanceQuestion: () =>
    set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),
  addBktUpdate: (update) =>
    set((s) => ({ bktUpdates: [...s.bktUpdates, update] })),

  // Track mastery per skill (pre-loaded)
  skillMastery: {
    Python: 0.71,
    React: 0.78,
    PostgreSQL: 0.22,
    Docker: 0.68,
    TensorFlow: 0.18,
    FastAPI: 0.74,
    Pandas: 0.31,
    Kubernetes: 0.32,
  },
  updateSkillMastery: (skill, posterior) =>
    set((s) => ({
      skillMastery: { ...s.skillMastery, [skill]: posterior },
    })),

  // ─── Learning Path (pre-loaded with mock) ─────────
  dagNodes: mockDAGNodes,
  dagEdges: mockDAGEdges,
  setLearningPath: (result) =>
    set({ dagNodes: result.nodes || [], dagEdges: result.edges || [] }),

  // ─── Sandbox ──────────────────────────────────────
  sandboxScenario: mockSandboxScenario.scenario,
  sandboxResponse: '',
  sandboxEvaluation: null,
  setSandboxScenario: (scenario) => set({ sandboxScenario: scenario }),
  setSandboxResponse: (response) => set({ sandboxResponse: response }),
  setSandboxEvaluation: (evaluation) => set({ sandboxEvaluation: evaluation }),

  // ─── UI State ─────────────────────────────────────
  isLoading: false,
  loadingMessage: '',
  setLoading: (isLoading, loadingMessage = '') =>
    set({ isLoading, loadingMessage }),

  // ─── Reset (resets to mock, not empty) ────────────
  reset: () =>
    set({
      resumeFile: null,
      resumeText: '',
      jdText: '',
      skills: mockSkills,
      jdRequirements: mockJdRequirements,
      matchScore: mockParseResponse.match_score,
      questions: mockQuestions,
      currentQuestionIndex: 0,
      bktUpdates: [],
      skillMastery: {},
      dagNodes: mockDAGNodes,
      dagEdges: mockDAGEdges,
      sandboxScenario: mockSandboxScenario.scenario,
      sandboxResponse: '',
      sandboxEvaluation: null,
      isLoading: false,
      loadingMessage: '',
    }),
}));

export default useSkillPrintStore;
