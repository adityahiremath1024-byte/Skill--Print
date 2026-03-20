/* Full mock data for DEV_MODE */

export const mockSkills = [
  { name: 'Python', category: 'Languages', raw_confidence: 0.9, years_since_used: 1.2, decayed_confidence: 0.74, source: 'both' },
  { name: 'React', category: 'Frontend', raw_confidence: 0.85, years_since_used: 0.3, decayed_confidence: 0.81, source: 'both' },
  { name: 'PostgreSQL', category: 'Databases', raw_confidence: 0.7, years_since_used: 2.5, decayed_confidence: 0.48, source: 'resume' },
  { name: 'Docker', category: 'DevOps', raw_confidence: 0.65, years_since_used: 0.8, decayed_confidence: 0.57, source: 'both' },
  { name: 'TensorFlow', category: 'ML/AI', raw_confidence: 0.6, years_since_used: 3.1, decayed_confidence: 0.38, source: 'resume' },
  { name: 'FastAPI', category: 'Backend', raw_confidence: 0.8, years_since_used: 0.5, decayed_confidence: 0.74, source: 'both' },
  { name: 'Pandas', category: 'Data', raw_confidence: 0.75, years_since_used: 4.2, decayed_confidence: 0.40, source: 'resume' },
  { name: 'Kubernetes', category: 'DevOps', raw_confidence: 0.4, years_since_used: 1.5, decayed_confidence: 0.32, source: 'jd' },
];

export const mockJdRequirements = [
  { name: 'Python', category: 'Languages', raw_confidence: 0.9, years_since_used: 0, decayed_confidence: 0.9, source: 'jd' },
  { name: 'React', category: 'Frontend', raw_confidence: 0.85, years_since_used: 0, decayed_confidence: 0.85, source: 'jd' },
  { name: 'PostgreSQL', category: 'Databases', raw_confidence: 0.8, years_since_used: 0, decayed_confidence: 0.8, source: 'jd' },
  { name: 'Docker', category: 'DevOps', raw_confidence: 0.7, years_since_used: 0, decayed_confidence: 0.7, source: 'jd' },
  { name: 'TensorFlow', category: 'ML/AI', raw_confidence: 0.75, years_since_used: 0, decayed_confidence: 0.75, source: 'jd' },
  { name: 'FastAPI', category: 'Backend', raw_confidence: 0.8, years_since_used: 0, decayed_confidence: 0.8, source: 'jd' },
  { name: 'Pandas', category: 'Data', raw_confidence: 0.7, years_since_used: 0, decayed_confidence: 0.7, source: 'jd' },
  { name: 'Kubernetes', category: 'DevOps', raw_confidence: 0.65, years_since_used: 0, decayed_confidence: 0.65, source: 'jd' },
];

export const mockParseResponse = {
  skills: mockSkills,
  jd_requirements: mockJdRequirements,
  match_score: 0.62,
};

export const mockQuestions = [
  { id: 'q1', skill: 'Python', question: 'Explain the difference between __getattr__ and __getattribute__ in Python. When would you use each, and what are the pitfalls of overriding __getattribute__?', difficulty: 'hard', claimed_depth: 0.74 },
  { id: 'q2', skill: 'React', question: 'A component re-renders 47 times on a single state change. Walk me through your debugging approach and the most likely causes.', difficulty: 'medium', claimed_depth: 0.81 },
  { id: 'q3', skill: 'PostgreSQL', question: 'You have a query that runs fine on 10K rows but takes 45 seconds on 10M rows despite having indexes. What are the three most common causes and how do you diagnose each?', difficulty: 'hard', claimed_depth: 0.48 },
  { id: 'q4', skill: 'Docker', question: 'Your Docker image went from 200MB to 1.8GB after adding a Python ML model. Describe your strategy to get it under 500MB without removing functionality.', difficulty: 'medium', claimed_depth: 0.57 },
  { id: 'q5', skill: 'TensorFlow', question: 'Explain the vanishing gradient problem and describe two architectural solutions that TensorFlow supports natively.', difficulty: 'medium', claimed_depth: 0.38 },
  { id: 'q6', skill: 'Pandas', question: 'You need to join two DataFrames with 50M rows each on a non-unique key. pd.merge() runs out of memory. What are your alternatives?', difficulty: 'hard', claimed_depth: 0.40 },
  { id: 'q7', skill: 'FastAPI', question: 'Describe how FastAPI\'s dependency injection system works under the hood and give an example of a complex dependency chain with cleanup.', difficulty: 'medium', claimed_depth: 0.74 },
];

export const mockDiagnosticResponse = { questions: mockQuestions };

export const mockAnswerResponse = {
  bkt_update: {
    skill: 'Python',
    prior: 0.45,
    posterior: 0.71,
    correct: true,
    assessment: 'Demonstrated strong understanding of Python dunder methods with accurate real-world examples.',
  },
};

export const mockDAGNodes = [
  { id: 'n1', label: 'Python Fundamentals', category: 'Languages', mastery: 0.74, required: 0.9, gap: 0.16, priority: 'medium', hours_to_close: 8, reasoning: '⚠️ Python MEDIUM PRIORITY:\n· Last used 1.2 yrs ago — decay 0.74\n· Diagnostic Q1 correct — BKT 0.71\n· Role requires proficiency 4.5/5\n· Est. 8 hrs to close gap' },
  { id: 'n2', label: 'React Advanced', category: 'Frontend', mastery: 0.81, required: 0.85, gap: 0.04, priority: 'low', hours_to_close: 3, reasoning: 'React LOW PRIORITY:\n· Recently used (0.3 yrs) — minimal decay\n· Strong diagnostic performance\n· Small gap to close' },
  { id: 'n3', label: 'PostgreSQL Perf.', category: 'Databases', mastery: 0.48, required: 0.8, gap: 0.32, priority: 'high', hours_to_close: 18, reasoning: '⚠️ PostgreSQL HIGH PRIORITY:\n· Last used 2.5 yrs ago — decay 0.48\n· Significant gap from requirement\n· Est. 18 hrs to close gap' },
  { id: 'n4', label: 'Docker & Containers', category: 'DevOps', mastery: 0.57, required: 0.7, gap: 0.13, priority: 'medium', hours_to_close: 7, reasoning: 'Docker MEDIUM PRIORITY:\n· Moderate decay (0.8 yrs)\n· Manageable gap' },
  { id: 'n5', label: 'TensorFlow / ML', category: 'ML/AI', mastery: 0.38, required: 0.75, gap: 0.37, priority: 'critical', hours_to_close: 24, reasoning: '🚨 TensorFlow CRITICAL:\n· Last used 3.1 yrs ago — decay 0.38\n· Diagnostic Q5 incorrect — BKT 0.29\n· Role requires proficiency 3.75/5\n· Est. 24 hrs to close gap' },
  { id: 'n6', label: 'FastAPI Backend', category: 'Backend', mastery: 0.74, required: 0.8, gap: 0.06, priority: 'low', hours_to_close: 4, reasoning: 'FastAPI LOW PRIORITY:\n· Recently used — strong retention\n· Minimal gap' },
  { id: 'n7', label: 'Pandas / Data', category: 'Data', mastery: 0.40, required: 0.7, gap: 0.30, priority: 'high', hours_to_close: 14, reasoning: '⚠️ Pandas HIGH PRIORITY:\n· Last used 4.2 yrs ago — decay 0.53\n· Diagnostic Q6 incorrect — BKT 0.31\n· Role requires proficiency 3.5/5\n· Est. 14 hrs to close gap' },
  { id: 'n8', label: 'Kubernetes', category: 'DevOps', mastery: 0.32, required: 0.65, gap: 0.33, priority: 'high', hours_to_close: 20, reasoning: '⚠️ Kubernetes HIGH PRIORITY:\n· Limited experience\n· Significant gap from JD requirement\n· Prerequisite: Docker proficiency' },
  { id: 'n9', label: 'Data Pipelines', category: 'Data', mastery: 0.35, required: 0.6, gap: 0.25, priority: 'medium', hours_to_close: 12, reasoning: 'Data Pipelines MEDIUM:\n· Prerequisite: Pandas + PostgreSQL\n· Composite skill gap' },
  { id: 'n10', label: 'ML Deployment', category: 'MLOps', mastery: 0.25, required: 0.55, gap: 0.30, priority: 'high', hours_to_close: 16, reasoning: 'ML Deployment HIGH:\n· Requires Docker + TensorFlow\n· No direct experience found' },
  { id: 'n11', label: 'API Design', category: 'Backend', mastery: 0.70, required: 0.75, gap: 0.05, priority: 'low', hours_to_close: 3, reasoning: 'API Design LOW:\n· Strong FastAPI foundation\n· Minor polish needed' },
  { id: 'n12', label: 'System Design', category: 'Architecture', mastery: 0.45, required: 0.7, gap: 0.25, priority: 'medium', hours_to_close: 15, reasoning: 'System Design MEDIUM:\n· Composite skill — all other skills contribute\n· Requires breadth + depth' },
];

export const mockDAGEdges = [
  { source: 'n1', target: 'n6', label: 'foundation' },
  { source: 'n1', target: 'n7', label: 'language' },
  { source: 'n1', target: 'n5', label: 'language' },
  { source: 'n4', target: 'n8', label: 'prerequisite' },
  { source: 'n4', target: 'n10', label: 'deployment' },
  { source: 'n5', target: 'n10', label: 'model' },
  { source: 'n3', target: 'n9', label: 'storage' },
  { source: 'n7', target: 'n9', label: 'transform' },
  { source: 'n6', target: 'n11', label: 'framework' },
  { source: 'n11', target: 'n12', label: 'component' },
  { source: 'n8', target: 'n12', label: 'infra' },
  { source: 'n9', target: 'n12', label: 'data' },
  { source: 'n10', target: 'n12', label: 'ml' },
  { source: 'n2', target: 'n12', label: 'frontend' },
  { source: 'n3', target: 'n12', label: 'database' },
];

export const mockLearningPathResponse = {
  nodes: mockDAGNodes,
  edges: mockDAGEdges,
};

export const mockSandboxScenario = {
  scenario: `You're a senior engineer at a fintech startup. The data team discovers that your production ML pipeline (TensorFlow model predicting fraud) is silently dropping 12% of incoming transactions during peak hours. The model's accuracy metrics look fine in dashboards, but customer complaints about false negatives are rising.\n\nYour stack: FastAPI backend, PostgreSQL, TensorFlow Serving, Kubernetes cluster, Pandas for preprocessing.\n\nDescribe your investigation approach, root cause analysis methodology, and proposed fix. Be specific about tools, commands, and code you'd write.`,
  skill: 'System Design',
  expected_approach: 'Systematic debugging from ingestion to prediction, checking queue depths, pod resource limits, and model serving timeouts.',
};

export const mockSandboxResponse = {
  score: 0.72,
  feedback: 'Good systematic approach to debugging the pipeline. Strong on monitoring and observability, but could improve on the Kubernetes-specific diagnosis. The proposed fix addresses the symptom but not the root capacity planning issue.',
  strengths: [
    'Methodical investigation starting from data ingestion',
    'Good use of logging and metrics for root cause analysis',
    'Practical fix for the immediate issue',
  ],
  improvements: [
    'Consider Kubernetes HPA (Horizontal Pod Autoscaler) for handling peak loads',
    'Add circuit breaker pattern to prevent silent drops',
    'Implement dead letter queue for failed predictions',
  ],
};
