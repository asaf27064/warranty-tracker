export async function searchImages(query: string): Promise<string[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch(
      `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&ijn=0&api_key=${apiKey}`,
    );
    const data = await res.json();
    return data.images_results?.slice(0, 6).map((img: any) => img.thumbnail) || [];
  } catch {
    return [];
  }
}