// src/lib/googleNews.ts
import Parser from 'rss-parser';

const parser = new Parser();

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  contentSnippet: string;
}

const FALLBACK_NEWS: NewsItem[] = [
  {
    title: "Market updates available when connection is restored",
    link: "#",
    pubDate: new Date().toISOString(),
    source: "System",
    contentSnippet: "Real-time news feed will display once connection is established."
  }
];

export async function getGoogleNewsRSS(query: string): Promise<NewsItem[]> {
  try {
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      console.warn("Invalid query provided to getGoogleNewsRSS", { query });
      return FALLBACK_NEWS;
    }
    
    // Financial-focused query parameters
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}+stock+news+analysis&hl=en-IN&gl=IN&ceid=IN:en`;
    const feed = await parser.parseURL(url);
    
    if (!feed || !feed.items || !Array.isArray(feed.items)) {
      console.warn("Invalid feed structure received from Google News", { url, feed: typeof feed });
      return FALLBACK_NEWS;
    }
    
    const newsItems = feed.items.map(item => ({
      title: String(item.title || 'No Title').substring(0, 500),
      link: String(item.link || '#').substring(0, 1000),
      pubDate: String(item.pubDate || new Date().toISOString()).substring(0, 100),
      source: String(item.source || 'Google News').substring(0, 100),
      contentSnippet: String(item.contentSnippet || '').substring(0, 500)
    }));
    
    return newsItems.length > 0 ? newsItems : FALLBACK_NEWS;
  } catch (error) {
    console.error("Google News RSS Error:", error instanceof Error ? error.message : String(error));
    return FALLBACK_NEWS;
  }
}