const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

import * as mockData from '../src/mocks/skillprint_mock';

async function request(path, options = {}) {
  if (USE_MOCK) {
    return handleMock(path, options);
  }

  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error ${res.status}: ${err}`);
  }

  return res.json();
}

function handleMock(path, options) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (path === '/health') resolve({ status: 'alive' });
      else if (path === '/api/parse') resolve(mockData.mockParseResponse);
      else if (path === '/api/diagnostic/generate') resolve(mockData.mockDiagnosticResponse);
      else if (path === '/api/diagnostic/answer') resolve(mockData.mockAnswerResponse);
      else if (path === '/api/learning-path') resolve(mockData.mockLearningPathResponse);
      else if (path === '/api/sandbox/evaluate') resolve(mockData.mockSandboxResponse);
      else resolve({});
    }, 800);
  });
}

export async function healthCheck() {
  return request('/health');
}

export async function parseResume(formData) {
  if (USE_MOCK) return handleMock('/api/parse');

  const url = `${BASE_URL}/api/parse`;
  const res = await fetch(url, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

export async function generateDiagnostic(skills) {
  return request('/api/diagnostic/generate', {
    method: 'POST',
    body: JSON.stringify({ skills }),
  });
}

export async function submitAnswer(payload) {
  return request('/api/diagnostic/answer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function generateLearningPath(payload) {
  return request('/api/learning-path', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function evaluateSandbox(payload) {
  return request('/api/sandbox/evaluate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
