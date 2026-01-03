'use client'

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';

interface PortfolioDrawdownChartProps {
    drawdownRange: number[];
}

// Placeholder data for sectors. In a real application, this would come from the AI.
const sectorData = [
    { sector: 'IT', impact: -8.5 },
    { sector: 'Finance', impact: -12.2 },
    { sector: 'FMCG', impact: -4.1 },
    { sector: 'Auto', impact: -15.8 },
    { sector: 'Pharma', impact: -3.5 },
];

const chartConfig = {
    value: {
      label: "Impact",
    },
};

export default function PortfolioDrawdownChart({ drawdownRange }: PortfolioDrawdownChartProps) {
    const averageDrawdown = (drawdownRange[0] + (drawdownRange[1] || drawdownRange[0])) / 2;

    const chartData = sectorData.map(d => ({
        name: d.sector,
        value: d.impact,
    }));

    return (
        <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }} accessibilityLayer>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    tickLine={false} 
                    axisLine={false}
                    tick={{ fontSize: '10pt' }}
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: '10pt' }}
                    tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent />}
                />
                <Bar dataKey="value" name="Impact" unit="%">
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value < -10 ? 'hsl(var(--destructive))' : 'hsl(var(--chart-4))'} />
                    ))}
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}
