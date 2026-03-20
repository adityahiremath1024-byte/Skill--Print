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

  // Common skill keywords for fallback extraction
  const SKILL_KEYWORDS = ['javascript','python','react','node','sql','html','css','java','c++','typescript','aws','docker','git','figma','excel','tableau','power bi','machine learning','ai','data analysis','project management','agile','scrum','leadership','communication','photoshop','illustrator','flutter','swift','kotlin','mongodb','postgresql','rest api','graphql','linux','devops','cloud','seo','marketing','writing','english','hindi','research','testing','qa'];

  const naiveFallback = (text) => {
    const lower = text.toLowerCase();
    const found = SKILL_KEYWORDS.filter(k => lower.includes(k)).map(k => k.charAt(0).toUpperCase() + k.slice(1));
    return {
      skills: found.slice(0, 8).length ? found.slice(0, 8) : ['Communication', 'Problem Solving'],
      experience: '',
      education: '',
      interests: [],
      country: '',
    };
  };

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

  // No API key → use naive keyword extraction for JD text
  if (!apiKey) {
    const fallback = naiveFallback(jdText || '');
    return new Response(JSON.stringify(fallback), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  }

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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
    const fallback = naiveFallback(jdText || '');
    return new Response(JSON.stringify(fallback), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
}
