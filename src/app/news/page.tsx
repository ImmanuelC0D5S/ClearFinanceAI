import { NewsFeed } from '@/components/features/news-feed';

export default function NewsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight font-headline">Live Market News</h1>
      </div>
      <p className="text-muted-foreground -mt-2">
        Real-time intelligence from Google News RSS. Search by ticker or company name.
      </p>
      <NewsFeed />
    </div>
  );
}