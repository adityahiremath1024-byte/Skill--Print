module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { skills = [], experience = '', education = '', interests = [], country = '' } = req.body;

  if (!skills.length || skills.length < 2) {
    return res.status(400).json({ error: 'At least 2 skills are required.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  const prompt = `You are a world-class career analyst specializing in rare skill combinations.

Analyze this person's professional profile:
- Skills: ${skills.join(', ')}
- Experience: ${experience || 'Not specified'}
- Education: ${education || 'Not specified'}
- Interests: ${interests.join(', ') || 'Not specified'}
- Country: ${country || 'Not specified'}

Generate a personalized SkillPrint DNA report. Respond with ONLY a valid JSON object (no markdown, no explanation) in this EXACT format:

{
  "title": "A creative 4-6 word title for their unique skill archetype (e.g. 'The Ethical AI Architect')",
  "tagline": "One sentence that captures their unique value proposition",
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
    {"combo": "Skill A × Skill B", "insight": "Why this combo is powerful", "rarity": "1 in 5,000 pros"},
    {"combo": "Skill B × Skill C", "insight": "Why this combo is valuable", "rarity": "1 in 3,200 pros"},
    {"combo": "Skill A × Skill C × Interest", "insight": "About this triple intersection", "rarity": "1 in 12,000 pros"}
  ],
  "hiddenSuperpower": "2-3 sentences about their hidden competitive advantage",
  "monetizationPaths": [
    {"path": "Specific Income Path", "potential": "$X–$Xk/mo", "timeToRevenue": "2–4 weeks"},
    {"path": "Another Path", "potential": "$X–$Xk/mo", "timeToRevenue": "1–3 months"},
    {"path": "Third Path", "potential": "$X–$Xk project", "timeToRevenue": "1 month"}
  ],
  "oneWeekChallenge": "A specific actionable 7-day challenge tailored to their exact skill combination"
}

Make all values specific to their actual skills. Use their country context for monetization amounts.`;

  try {
    const res2 = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.85, topP: 0.95, maxOutputTokens: 1500 },
        }),
      }
    );

    if (!res2.ok) {
      const errText = await res2.text();
      console.error('Gemini error:', errText);
      return res.status(502).json({ error: 'AI service error. Please try again.' });
    }

    const data = await res2.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return res.status(502).json({ error: 'Empty response from AI.' });

    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(502).json({ error: 'Could not parse AI response.' });

    const result = JSON.parse(jsonMatch[0]);
    return res.status(200).json(result);
  } catch (err) {
    console.error('analyze error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
