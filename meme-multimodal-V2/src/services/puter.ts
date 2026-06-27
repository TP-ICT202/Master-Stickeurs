const PUTER_API = 'https://api.puter.com/drivers/call';

async function callPuterDriver(driver: string, args: Record<string, any>): Promise<any> {
  try {
    const res = await fetch(PUTER_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ driver, ...args }),
    });
    if (!res.ok) {
      console.warn(`[Puter] ${driver} HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.warn(`[Puter] ${driver} error:`, e);
    return null;
  }
}

export async function puterTxt2img(prompt: string): Promise<string | null> {
  const json = await callPuterDriver('ai-txt2img', { prompt, testMode: true });
  if (!json) return null;
  const src = json?.result?.src || json?.data?.url || json?.url;
  if (src) return src;
  return null;
}

export async function puterTxt2speech(text: string): Promise<string | null> {
  const json = await callPuterDriver('ai-txt2speech', { text });
  if (!json) return null;
  const audioUrl = json?.result?.src || json?.data?.url || json?.url;
  if (audioUrl) return audioUrl;
  return null;
}

export async function puterTxt2vid(prompt: string, imageUrl?: string): Promise<string | null> {
  const args: any = { prompt };
  if (imageUrl) args.input_image = imageUrl;
  const json = await callPuterDriver('ai-txt2vid', args);
  if (!json) return null;
  const videoUrl = json?.result?.src || json?.data?.url || json?.url;
  if (videoUrl) return videoUrl;
  return null;
}

export async function puterImg2txt(imageUrl: string): Promise<string | null> {
  const json = await callPuterDriver('ai-img2txt', { image: imageUrl });
  if (!json) return null;
  return json?.result?.text || json?.data?.text || null;
}

export async function puterRemoveBg(imageUrl: string): Promise<string | null> {
  const json = await callPuterDriver('ai-removebg', { image: imageUrl });
  if (!json) return null;
  const resultUrl = json?.result?.src || json?.data?.url || json?.url;
  if (resultUrl) return resultUrl;
  return null;
}
