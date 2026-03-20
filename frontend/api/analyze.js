const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { skills = [], experience = '', education = '', interests = [], country = '' } = req.body || {};

  if (!skills.length || skills.length < 2) {
    return res.status(400).json({ error: 'At least 2 skills are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server.' });
  }

  const prompt = `You are a world-class career analyst specializing in rare skill combinations.

Analyze this professional profile:
- Skills: ${skills.join(', ')}
- Experience: ${experience || 'Not specified'}
- Education: ${education || 'Not specified'}
- Interests: ${interests.join(', ') || 'Not specified'}
- Country: ${country || 'Not specified'}

Respond with ONLY a valid JSON object (no markdown, no code fences) in this format:
{
  "title": "4-6 word creative archetype title",
  "tagline": "One sentence unique value proposition",
  "rarityScore": 87,
  "rarityRatio": "1 in 8,400",
  "radarData": [
    {"label": "Technical", "value": 80},
    {"label": "Creative", "value": 65},
    {"label": "Leadership", "value": 55},
    {"label": "Domain", "value": 75},
    {"label": "Communication", "value": 70}
  ],
  "topIntersections": [
    {"combo": "Skill A × Skill B", "insight": "Why powerful", "rarity": "1 in 5,000 pros"},
    {"combo": "Skill B × Skill C", "insight": "Why valuable", "rarity": "1 in 3,200 pros"},
    {"combo": "Skill A × Interest", "insight": "Triple value", "rarity": "1 in 12,000 pros"}
  ],
  "hiddenSuperpower": "2-3 sentences about hidden competitive advantage",
  "monetizationPaths": [
    {"path": "Income path 1", "potential": "$2–$5k/mo", "timeToRevenue": "2–4 weeks"},
    {"path": "Income path 2", "potential": "$3–$8k/mo", "timeToRevenue": "1–3 months"},
    {"path": "Income path 3", "potential": "$5k project", "timeToRevenue": "1 month"}
  ],
  "oneWeekChallenge": "Specific 7-day actionable challenge for their skill combo"
}`;

  const payload = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 1500 },
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req2 = https.request(options, (res2) => {
      let data = '';
      res2.on('data', chunk => { data += chunk; });
      res2.on('end', () => {
        try {
          if (res2.statusCode !== 200) {
            console.error('Gemini error status:', res2.statusCode, data);
            res.status(502).json({ error: 'AI service error: ' + res2.statusCode });
            return resolve();
          }
          const parsed = JSON.parse(data);
          const rawText = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!rawText) {
            res.status(502).json({ error: 'Empty AI response.' });
            return resolve();
          }
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            console.error('No JSON in response:', rawText);
            res.status(502).json({ error: 'Could not parse AI response.' });
            return resolve();
          }
          const result = JSON.parse(jsonMatch[0]);
          res.status(200).json(result);
          resolve();
        } catch (err) {
          console.error('Parse error:', err, data);
          res.status(500).json({ error: 'Failed to parse response.' });
          resolve();
        }
      });
    });

    req2.on('error', (err) => {
      console.error('HTTPS error:', err);
      res.status(500).json({ error: 'Network error calling AI service.' });
      resolve();
    });

    req2.setTimeout(9000, () => {
      req2.destroy();
      res.status(504).json({ error: 'AI request timed out. Please try again.' });
      resolve();
    });

    req2.write(payload);
    req2.end();
  });
};
