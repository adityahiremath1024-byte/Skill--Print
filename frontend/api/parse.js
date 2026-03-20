export const config = { runtime: 'edge' };

export default async function handler(request) {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 200, headers: cors });
  if (request.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...cors, 'Content-Type': 'application/json' } });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers: { ...cors, 'Content-Type': 'application/json' } });

  let body;
  try { body = await request.json(); } catch {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const { pdfBase64, jdText, mimeType } = body;

  if (!pdfBase64 && !jdText) {
    return new Response(JSON.stringify({ error: 'Provide pdfBase64 or jdText' }), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  const instruction = `Extract professional information from this document and return ONLY a JSON object with:
{
  "skills": ["skill1", "skill2", ...],  // list of 5-10 specific skills found
  "experience": "one of: Student/Fresh Graduate | 1-2 years | 3-5 years | 5-10 years | 10+ years",
  "education": "one of: High School | Bachelor's | Master's | PhD | Self-taught",
  "interests": ["interest1", "interest2"],  // 2-4 topics/interests inferred from content
  "country": ""  // leave empty if not found
}
Only include skills explicitly mentioned. Return raw JSON only, no markdown.`;

  let geminiBody;

  if (pdfBase64) {
    geminiBody = {
      contents: [{
        parts: [
          { text: instruction },
          { inline_data: { mime_type: mimeType || 'application/pdf', data: pdfBase64 } }
        ]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
    };
  } else {
    geminiBody = {
      contents: [{
        parts: [{ text: `${instruction}\n\nDOCUMENT TEXT:\n${jdText.slice(0, 8000)}` }]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
    };
  }

  try {
    const model = pdfBase64 ? 'gemini-1.5-flash' : 'gemini-1.5-flash';
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(geminiBody) }
    );

    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');

    const parsed = JSON.parse(match[0]);
    return new Response(JSON.stringify(parsed), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error('parse error:', err.message);
    return new Response(JSON.stringify({ error: 'Could not extract skills. Please fill in manually.' }), { status: 422, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
}
