'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchNewsAction } from '@/app/actions';
import { Loader2, ExternalLink, Search, Newspaper } from 'lucide-react';
import { NewsItem } from '@/lib/googlenews';

export function NewsFeed() {
  const [query, setQuery] = useState('Nifty 50');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = async (searchQuery: string) => {
    setLoading(true);
    const res = await fetchNewsAction(searchQuery);
    setNews(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadNews(query);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search company or sector news..." 
            className="pl-8" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadNews(query)}
          />
        </div>
        <Button onClick={() => loadNews(query)} className="bg-accent hover:bg-accent/90">
          Search
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Fetching latest headlines...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {news.length > 0 ? news.map((item, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-bold uppercase text-accent tracking-widest">{item.source}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {new Date(item.pubDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <CardTitle className="text-sm font-headline leading-tight mt-2 line-clamp-2">
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground line-clamp-3 mb-4">
                  {item.contentSnippet}
                </p>
                <Button variant="outline" size="sm" className="w-full text-xs gap-2" asChild>
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    Read Full Story <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          )) : (
            <div className="col-span-full text-center py-20 border-2 border-dashed rounded-xl">
              <Newspaper className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No news found for "{query}". Try a broader term.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}