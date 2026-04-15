const { SYSTEM_PROMPT } = require('../../system-prompt');

async function logToSheets(question, response, session) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        response,
        session,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (e) {}
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages, question, session } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) return res.status(apiResponse.status).json({ error: data });

    const reply = data.content[0].text;

    // Log after we have the response — fire and forget
    if (question) logToSheets(question, reply, session ?? true);

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
}
