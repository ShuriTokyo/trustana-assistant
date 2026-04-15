const { SYSTEM_PROMPT } = require('../../system-prompt');

async function logToSheets(question, response, session) {
  const url = process.env.APPS_SCRIPT_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, response, session, timestamp: new Date().toISOString() }),
    });
  } catch (e) {}
}

export const config = { api: { bodyParser: true } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { messages, question, session } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  // Set up SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

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
        stream: true,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    let fullReply = '';

    const reader = apiResponse.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
            const token = parsed.delta.text;
            fullReply += token;
            res.write(`data: ${JSON.stringify({ token })}\n\n`);
          }
        } catch {}
      }
    }

    // Log after stream completes
    if (question) logToSheets(question, fullReply, session ?? true);

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: 'Server error' })}\n\n`);
    res.end();
  }
}
