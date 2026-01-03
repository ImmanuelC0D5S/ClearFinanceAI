export async function scrapeLatestTranscript(companyName: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${companyName} latest quarterly earnings call transcript full text`,
      search_depth: "advanced",
      include_raw_content: true,
      max_results: 1
    }),
  });
  const data = await response.json();
  const text = data.results?.[0]?.raw_content || data.results?.[0]?.content || "";
  return text.replace(/<[^>]*>?/gm, '').substring(0, 8000);
}

export async function searchMultipleCompanies(companyNames: string[], maxResults: number = 2) {
  const apiKey = process.env.TAVILY_API_KEY;
  const results = new Map();
  
  await Promise.all(companyNames.map(async (name) => {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey, query: name, max_results: maxResults })
    });
    const data = await res.json();
    results.set(name, data);
  }));
  return results;
}

export function extractCompanyNames(text: string): string[] {
  const patterns = [/([A-Z][A-Z0-9]+):/g, /([A-Z][a-zA-Z\s]+?):/g];
  const companies = new Set<string>();
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1].trim().length > 1) companies.add(match[1].trim());
    }
  }
  return Array.from(companies);
}

export function formatTavilyResultsForAI(companyName: string, searchResults: any): string {
  return `\nNews for ${companyName}: ` + searchResults.results?.map((r: any) => r.title).join("; ");
}