export interface LyricSegment {
  text: string;
  reading?: string;
  isKanji: boolean;
}

export async function processLyrics(lyrics: string): Promise<LyricSegment[]> {
  const response = await fetch("/api/lyrics/process", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ lyrics }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to process lyrics");
  }

  return response.json();
}
