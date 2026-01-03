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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { RegulatoryWatchOutput } from '@/ai/flows/regulatory-watch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const FormSchema = z.object({
  companyName: z.string().min(2, 'Company name is required.'),
  filingText: z.string().min(50, 'Filing text is too short.'),
});

const defaultFilingText = `Fictional FMCG Ltd. - Board Meeting Outcome

The Board of Directors at their meeting held today, has approved the resignation of M/s. Old & Associates, Chartered Accountants, as the Statutory Auditors of the Company with immediate effect.

The Board has also approved the appointment of M/s. New & Co., Chartered Accountants, as the new Statutory Auditors, subject to shareholder approval. This change is being made to leverage the new firm's expertise in the digital and e-commerce space, which is a growing part of our business.

Additionally, Mr. Promoter, a member of the promoter group, has pledged 5% of his shareholding in the company to secure a personal loan. The company has taken note of the disclosure.`;

const RiskBadge = ({ level }: { level: 'High' | 'Medium' | 'Low' }) => {
  const variant = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'default',
  }[level] as "destructive" | "secondary" | "default";
  return <Badge variant={variant}>{level} Risk</Badge>;
};

export function RegulatoryWatch({ portfolio }: { portfolio?: any } = {}) {
  const [result, setResult] = useState<RegulatoryWatchOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      companyName: '',
      filingText: defaultFilingText,
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);

    // If a portfolio is provided, request the regulatory watch for the portfolio (server will pick a company)
    const body = portfolio?.id ? { task: 'regulatoryWatch', input: { portfolioId: portfolio.id } } : { task: 'regulatoryWatch', input: data };

    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setIsLoading(false);
    const json = await res.json();
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Error', description: json?.error || 'Unknown error' });
    } else {
      try {
        const parsed = JSON.parse(json.text);
        setResult(parsed);
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Error parsing response', description: e.message || 'Invalid JSON returned from model.' });
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Fictional FMCG Ltd." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="filingText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Regulatory Filing Text</FormLabel>
                  <FormControl>
                    <Textarea className="min-h-[200px] text-xs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-2">
              <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Scan for Red Flags
              </Button>
              {portfolio?.id && (
                <Button
                  type="button"
                  disabled={isLoading}
                  variant="outline"
                  onClick={async () => {
                    setIsLoading(true);
                    setResult(null);
                    const res = await fetch('/api/insights', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ task: 'regulatoryWatch', input: { portfolioId: portfolio.id } }),
                    });
                    setIsLoading(false);
                    const json = await res.json();
                    if (!res.ok) {
                      toast({ variant: 'destructive', title: 'Error', description: json?.error || 'Unknown error' });
                    } else {
                      try {
                        const parsed = JSON.parse(json.text);
                        setResult(parsed);
                      } catch (e: any) {
                        toast({ variant: 'destructive', title: 'Error parsing response', description: e.message || 'Invalid JSON returned from model.' });
                      }
                    }
                  }}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Scan Portfolio
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
      <div className="lg:col-span-1">
        {isLoading && (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Scanning filing...</p>
            </div>
          </div>
        )}
        {result && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-headline">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Identified Red Flags
                </CardTitle>
                <div className="text-right">
                  {portfolio?.name && <div className="text-sm text-muted-foreground">Portfolio: <span className="font-semibold">{portfolio.name}</span></div>}
                  <span className="text-2xl font-bold">{result.redFlags.length}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {result.redFlags.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {result.redFlags.map((flag, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-4 text-left">
                            <RiskBadge level={flag.riskLevel} />
                            <span className="flex-1">{flag.description}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground">{flag.implication}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-center text-muted-foreground py-10">
                  No significant red flags identified in this filing.
                </p>
              )}
            </CardContent>
          </Card>
        )}
        {!isLoading && !result && (
          <div className="flex items-center justify-center h-full min-h-[300px] border-2 border-dashed rounded-lg">
            <p className="text-center text-muted-foreground">
              Enter filing details to scan for red flags.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
