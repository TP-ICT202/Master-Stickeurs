import { PEXELS_API_KEY } from '../config';

const API_KEY = PEXELS_API_KEY;

export interface PexelsVideo {
  url: string;
  previewUrl: string;
  title: string;
}

export async function searchShortVideo(query: string): Promise<PexelsVideo | null> {
  if (!API_KEY) return null;
  try {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=1&size=small`,
      { headers: { Authorization: API_KEY } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const video = json.videos?.[0];
    if (!video) return null;
    const videoFile = video.video_files?.find((f: any) => f.quality === 'sd') ?? video.video_files?.[0];
    return {
      url: videoFile?.link ?? '',
      previewUrl: video.image ?? '',
      title: query,
    };
  } catch {
    return null;
  }
}
