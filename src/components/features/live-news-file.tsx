'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { fetchNewsAction } from '@/app/actions';
import { Newspaper, ArrowUpRight, Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function LiveNewsTile() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchNewsAction('Indian Stock Market');
        
        if (res.error) {
          console.warn('News fetch warning:', res.error);
          setError(res.error);
          // Still try to show whatever data we have
          setNews(res.data || []);
        } else {
          setError(null);
          setNews(res.data?.slice(0, 3) || []); // Only show top 3 on dashboard
        }
      } catch (e) {
        console.error('Error loading news:', e);
        setError('Failed to load news');
        setNews([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <Card className="col-span-full lg:col-span-2 border-l-4 border-l-accent hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Newspaper className="h-5 w-5 text-accent" />
          Live Market Intelligence
        </CardTitle>
        <Link href="/news" className="text-xs text-accent hover:underline flex items-center gap-1 font-medium">
          View All <ArrowUpRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error && news.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <p>{error}. Check your internet connection.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.length > 0 ? (
              news.map((item, i) => (
                <a 
                  key={i} 
                  href={item.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="group block border-b last:border-0 pb-3 last:pb-0"
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-sm font-medium leading-snug group-hover:text-accent transition-colors line-clamp-2">
                      {item.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-1">
                      {new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No news available at the moment.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}