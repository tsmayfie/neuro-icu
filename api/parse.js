export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { transcript } = req.body;
  if (!transcript) return res.status(400).json({ error: 'No transcript' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: `You are a Neuro ICU AI Assistant. Parse the dictation into organized sections for a consult note. Return ONLY valid JSON with no preamble:

{
  "chiefComplaint": "brief CC",
  "hpi": "organized history paragraph ready to paste",
  "assessment": "primary diagnosis/assessment",
  "neuro": "neurologic recommendations",
  "cardio": "cardiovascular recommendations",
  "pulmonary": "pulmonary recommendations",
  "renal": "renal/electrolyte recommendations",
  "gi": "GI/nutrition recommendations",
  "id": "infectious disease recommendations",
  "heme": "hematologic/endocrine recommendations",
  "prophylaxis": "DVT/stress ulcer prophylaxis",
  "lines": "lines, drains, airway status",
  "exam": "key physical exam findings",
  "labs": "important labs to review",
  "differential": ["diagnosis 1", "diagnosis 2", "diagnosis 3"],
  "missing": ["info gap 1", "info gap 2"]
}`,
        messages: [{ role: 'user', content: transcript }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content[0].text;
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim());

    res.status(200).json(parsed);
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({ error: error.message });
  }
}
