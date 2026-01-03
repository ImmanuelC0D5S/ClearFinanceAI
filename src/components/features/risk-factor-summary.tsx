'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { handleRiskSummary } from '@/app/actions';
import type { SummarizeRiskFactorsOutput } from '@/ai/flows/summarize-risk-factors';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

const FormSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  financialReport: z.string().min(50, 'Report text is too short.'),
});

const defaultReportText = `Risk Factors for Fictional Auto Co.

1. Market and Economic Risks:
Our business is highly dependent on the automotive industry, which is subject to market cycles. Economic downturns, rising interest rates, and reduced consumer spending can adversely affect demand for our products. Competition in the EV space is intensifying with new entrants, which may impact our market share and profitability.

2. Operational Risks:
We rely on a global supply chain for key components like batteries and semiconductors. Disruptions due to geopolitical events, trade disputes, or pandemics can halt production. Our manufacturing processes are complex and any failure could lead to significant delays and costs.

3. Regulatory Risks:
Our operations are subject to stringent environmental and safety regulations. Changes in these regulations could require costly modifications to our vehicles and manufacturing facilities. We may also face significant penalties for non-compliance.
`;

export function RiskFactorSummary({ portfolio }: { portfolio?: any } = {}) {
  const [result, setResult] = useState<SummarizeRiskFactorsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      companyName: 'Fictional Auto Co.',
      financialReport: defaultReportText,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);

    let res;
    if (portfolio?.id) {
      res = await handleRiskSummary({ portfolioId: portfolio.id });
    } else {
      res = await handleRiskSummary(data);
    }

    const { data: summaryData, error } = res;
    setIsLoading(false);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
    } else {
      setResult(summaryData);
    }
  }

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="financialReport"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financial Report Text</FormLabel>
                <FormControl>
                  <Textarea className="min-h-[150px] text-xs" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Summarize Risks
          </Button>
        </form>
      </Form>

      {isLoading && (
         <div className="flex items-center justify-center h-full min-h-[150px]">
              <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-2 text-muted-foreground text-sm">Summarizing risk factors...</p>
              </div>
          </div>
      )}
      {result && (
        <Card>
          <CardContent className="p-4">
            <ScrollArea className="h-48">
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-2">
                {result.riskFactorSummary.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
       {!isLoading && !result && (
          <div className="flex items-center justify-center h-full min-h-[150px] border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground text-sm">Submit a report to see risk summary.</p>
          </div>
      )}
    </div>
  );
}
