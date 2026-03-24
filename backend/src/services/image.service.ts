export async function searchImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) return [];

  try {
    const res = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${cx}&key=${apiKey}&searchType=image&num=6`,
    );
    const data = await res.json();
    return data.items?.map((item: any) => item.link) || [];
  } catch {
    return [];
  }
}