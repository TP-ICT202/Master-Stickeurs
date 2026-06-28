import { OPEN_ROUTE_API_KEY } from '../config';

const BASE = 'https://openrouter.ai/api/v1';

export async function openRouterGenerateText(prompt: string, base64Image?: string, mimeType?: string): Promise<string | null> {
  if (!OPEN_ROUTE_API_KEY || OPEN_ROUTE_API_KEY === '') return null;
  try {
    const messages: any[] = [
      { role: 'system', content: 'Tu es un générateur de memes humoristique africain. Réponds UNIQUEMENT en JSON valide.' },
    ];
    if (base64Image && mimeType) {
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      });
    } else {
      messages.push({ role: 'user', content: prompt });
    }

    const res = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPEN_ROUTE_API_KEY}`,
        'HTTP-Referer': 'https://github.com/TP-ICT202/Master-Stickeurs',
        'X-Title': 'MemeGen AI',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages,
        temperature: 0.85,
        max_tokens: 1024,
      }),
    });
    if (!res.ok) {
      console.warn('[OpenRouter] HTTP', res.status, await res.text().catch(() => ''));
      return null;
    }
    const json = await res.json();
    return json.choices?.[0]?.message?.content?.trim() ?? null;
  } catch (e) {
    console.warn('[OpenRouter] error:', e);
    return null;
  }
}

export async function openRouterGenerateImage(prompt: string): Promise<string | null> {
  if (!OPEN_ROUTE_API_KEY || OPEN_ROUTE_API_KEY === '') return null;
  try {
    const res = await fetch(`${BASE}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPEN_ROUTE_API_KEY}`,
        'HTTP-Referer': 'https://github.com/TP-ICT202/Master-Stickeurs',
        'X-Title': 'MemeGen AI',
      },
      body: JSON.stringify({
        model: 'openai/dall-e-3',
        prompt: `meme background, funny cartoon style, no text: ${prompt}`,
        n: 1,
        size: '1024x1024',
      }),
    });
    if (!res.ok) {
      console.warn('[OpenRouter Image] HTTP', res.status);
      return null;
    }
    const json = await res.json();
    return json.data?.[0]?.url ?? null;
  } catch (e) {
    console.warn('[OpenRouter Image] error:', e);
    return null;
  }
}
