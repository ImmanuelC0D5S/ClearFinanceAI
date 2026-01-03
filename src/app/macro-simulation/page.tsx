import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MacroShockSimulator } from "@/components/features/macro-shock-simulator";
import { getPortfolioById } from '@/lib/portfolio';

export default async function MacroSimulationPage({ searchParams }: { searchParams?: { portfolioId?: string } | Promise<{ portfolioId?: string }> }) {
  const sp = (await searchParams) as { portfolioId?: string } | undefined;
  const portfolio = sp?.portfolioId ? await getPortfolioById(sp.portfolioId) : null;

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h1 className="text-3xl font-bold tracking-tight font-headline">
                Macro-Shock Simulation
            </h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Simulate Portfolio Impact</CardTitle>
            </CardHeader>
            <CardContent>
                {/* server -> client prop */}
                <MacroShockSimulator portfolio={portfolio} />
            </CardContent>
        </Card>
    </div>
  );
}
