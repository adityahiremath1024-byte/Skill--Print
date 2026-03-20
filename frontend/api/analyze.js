export const config = { runtime: 'edge' };

const MOCK = {
  title: "The AI-Powered Problem Solver",
  tagline: "Turning data and intelligence into real-world impact",
  rarityScore: 89,
  rarityRatio: "1 in 9,200",
  radarData: [
    { label: "Technical", value: 88 },
    { label: "Creative", value: 72 },
    { label: "Leadership", value: 60 },
    { label: "Domain", value: 85 },
    { label: "Communication", value: 74 }
  ],
  topIntersections: [
    { combo: "AI × Data Science", insight: "Powers intelligent decision systems that most teams can't build without two people", rarity: "1 in 4,800 pros" },
    { combo: "Python × Machine Learning", insight: "The rare combo that owns the full ML pipeline from data to deployment", rarity: "1 in 3,100 pros" },
    { combo: "Technical Skills × Domain Interest", insight: "Applied expertise that speaks to real problems — the holy grail for employers", rarity: "1 in 11,000 pros" }
  ],
  hiddenSuperpower: "You sit at the precise intersection of statistical rigor and AI creativity — a combination that most companies desperately need but rarely find in one person. This makes you uniquely positioned to own end-to-end ML pipelines and communicate results to non-technical stakeholders.",
  monetizationPaths: [
    { path: "AI Consulting", potential: "$3–$8k/mo", timeToRevenue: "2–4 weeks" },
    { path: "Data Products / APIs", potential: "$2–$10k/mo", timeToRevenue: "1–3 months" },
    { path: "ML Freelance Projects", potential: "$5–$15k project", timeToRevenue: "1 month" }
  ],
  oneWeekChallenge: "Build one small AI-powered tool that solves a real problem you personally face. Post it publicly on GitHub and LinkedIn, then pitch it to 3 potential clients or collaborators for feedback. Document the process as a personal case study."
};

export default async function handler(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const skills = body.skills || [];
  const experience = body.experience || '';
  const education = body.education || '';
  const interests = body.interests || [];
  const country = body.country || '';

  if (skills.length < 2) {
    return new Response(JSON.stringify({ error: 'At least 2 skills required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    // No key configured — return mock
    return new Response(JSON.stringify(MOCK), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = `You are a career analyst. Analyze this professional:
Skills: ${skills.join(', ')}
Experience: ${experience}
Education: ${education}
Interests: ${interests.join(', ')}
Country: ${country}

Respond with ONLY a JSON object (no markdown, no code fences) with these fields:
title, tagline, rarityScore (number), rarityRatio (string),
radarData (5 objects: label + value 0-100),
topIntersections (3 objects: combo, insight, rarity),
hiddenSuperpower, monetizationPaths (3 objects: path, potential, timeToRevenue),
oneWeekChallenge`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 1500 },
        }),
      }
    );

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const match = rawText.match(/\{[\s\S]*\}/);

    if (!match) throw new Error('No JSON in response');

    const result = JSON.parse(match[0]);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Gemini error, using mock:', err.message);
    return new Response(JSON.stringify(MOCK), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
