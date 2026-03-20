const https = require('https');

const MOCK = {
  title: "The AI Data Pioneer",
  tagline: "Bridging artificial intelligence with practical data solutions",
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
    { combo: "AI × Data Science", insight: "A rare blend that powers intelligent systems at scale", rarity: "1 in 4,800 pros" },
    { combo: "Python × AI", insight: "The backbone of modern machine learning engineering", rarity: "1 in 3,100 pros" },
    { combo: "Data Science × Interests", insight: "Applied AI that speaks to real human needs", rarity: "1 in 11,000 pros" }
  ],
  hiddenSuperpower: "You sit at the precise intersection of statistical rigor and AI creativity — a combination that most companies desperately need but rarely find in one person. This makes you uniquely positioned to own end-to-end ML pipelines.",
  monetizationPaths: [
    { path: "AI Consulting", potential: "$3–$8k/mo", timeToRevenue: "2–4 weeks" },
    { path: "Data Products / APIs", potential: "$2–$10k/mo", timeToRevenue: "1–3 months" },
    { path: "ML Freelance Projects", potential: "$5–$15k project", timeToRevenue: "1 month" }
  ],
  oneWeekChallenge: "Build one small AI-powered tool that solves a real problem you personally have, post it publicly on GitHub and LinkedIn, and pitch it to 3 potential clients for feedback. Document the process as a case study."
};

function callGemini(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 1500 },
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 8000,
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            return reject(new Error(`Gemini status ${res.statusCode}: ${data.slice(0, 200)}`));
          }
          const json = JSON.parse(data);
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const match = text.match(/\{[\s\S]*\}/);
          if (!match) return reject(new Error('No JSON in Gemini response'));
          resolve(JSON.parse(match[0]));
        } catch (e) {
          reject(new Error('Parse error: ' + e.message));
        }
      });
    });

    req.on('timeout', () => { req.destroy(); reject(new Error('Gemini request timed out')); });
    req.on('error', (e) => reject(new Error('HTTPS error: ' + e.message)));
    req.write(payload);
    req.end();
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body || {};
  const skills = body.skills || [];
  const { experience = '', education = '', interests = [], country = '' } = body;

  if (skills.length < 2) return res.status(400).json({ error: 'At least 2 skills required' });

  const apiKey = process.env.GEMINI_API_KEY;

  // No API key → return mock data so the UI works
  if (!apiKey) {
    console.log('No GEMINI_API_KEY — returning mock data');
    return res.status(200).json(MOCK);
  }

  const prompt = `You are a career analyst. Analyze this professional:
Skills: ${skills.join(', ')}
Experience: ${experience}
Education: ${education}  
Interests: ${interests.join(', ')}
Country: ${country}

Return ONLY a JSON object (no markdown) with these exact fields:
title, tagline, rarityScore (number 1-100), rarityRatio (string like "1 in X,XXX"),
radarData (array of 5 objects with label and value 0-100),
topIntersections (array of 3 objects with combo, insight, rarity),
hiddenSuperpower (string), 
monetizationPaths (array of 3 objects with path, potential, timeToRevenue),
oneWeekChallenge (string)`;

  try {
    const result = await callGemini(apiKey, prompt);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Gemini failed:', err.message, '— falling back to mock');
    // Fallback to mock so the user sees a result even if Gemini fails
    return res.status(200).json({ ...MOCK, title: skills[0] + ' ' + (skills[1] || '') + ' Expert', tagline: 'Powered by your unique skill combination — AI analysis temporarily unavailable.' });
  }
};
