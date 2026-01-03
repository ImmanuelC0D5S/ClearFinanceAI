import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskFactorSummary } from "@/components/features/risk-factor-summary";
import { getPortfolioById } from '@/lib/portfolio';

export default async function RiskAnalysisPage({ searchParams }: { searchParams?: { portfolioId?: string } | Promise<{ portfolioId?: string }> }) {
  const sp = (await searchParams) as { portfolioId?: string } | undefined;
  const portfolio = sp?.portfolioId ? await getPortfolioById(sp.portfolioId) : null;

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Risk Factor Summary
            </h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Summarize Key Risk Factors</CardTitle>
            </CardHeader>
            <CardContent>
                {/* server -> client prop */}
                <RiskFactorSummary portfolio={portfolio} />
            </CardContent>
        </Card>
    </div>
  );
}
