import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldCheck, TrendingUp, FileText, FileWarning, Newspaper } from 'lucide-react';
import { LiveNewsTile } from '@/components/features/live-news-file'; // Import the new tile

const features = [
  {
    title: 'Management Trust Score',
    description: 'Analyze management credibility and promise fulfillment.',
    href: '/management-trust',
    icon: <ShieldCheck className="h-6 w-6 text-accent" />,
  },
  {
    title: 'Macro-Shock Simulation',
    description: 'Simulate the impact of macro events on your portfolio.',
    href: '/macro-simulation',
    icon: <TrendingUp className="h-6 w-6 text-accent" />,
  },
  {
    title: 'Risk Factor Summary',
    description: 'Summarize key risk factors from financial documents.',
    href: '/risk-analysis',
    icon: <FileText className="h-6 w-6 text-accent" />,
  },
  {
    title: 'Regulatory Watch',
    description: 'Scan regulatory filings for potential red flags.',
    href: '/regulatory-watch',
    icon: <FileWarning className="h-6 w-6 text-accent" />,
  },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-8 pt-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight font-headline">
          Investment Command Center
        </h1>
        <p className="text-muted-foreground">
          Forensic-grade insights for the Indian stock market.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* NEW: LIVE NEWS TILE */}
        <LiveNewsTile />

        {/* EXISTING FEATURE CARDS */}
        {features.map((feature) => (
          <Link href={feature.href} key={feature.href}>
            <Card className="hover:border-primary/80 hover:shadow-lg transition-all duration-300 h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  {feature.icon}
                  <CardTitle className="font-headline text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription className="pt-2">{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}