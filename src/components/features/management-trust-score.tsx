'use client';
import { generateForTask } from '@/ai/vertex';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { handleManagementTrustScore } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, Search, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const FormSchema = z.object({
  companyName: z.string().min(2, 'Enter company name for web scraping.'),
  ticker: z.string().min(2, 'Ticker required for Yahoo Finance verification.'),
});

export function ManagementTrustScore() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { companyName: '', ticker: '' },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await handleManagementTrustScore(data);
      if (res.error) throw new Error(res.error);
      setResult(res.data);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Audit Failed', description: e.message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="companyName" render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name (for Scraping)</FormLabel>
                <FormControl><Input placeholder="e.g. Reliance Industries" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="ticker" render={({ field }) => (
              <FormItem>
                <FormLabel>Yahoo Ticker</FormLabel>
                <FormControl><Input placeholder="e.g. RELIANCE.NS" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <Button type="submit" disabled={isLoading} className="w-full bg-accent">
              {isLoading ? (
                <><Loader2 className="animate-spin mr-2" /> Scraping & Auditing...</>
              ) : (
                <><Globe className="mr-2 h-4 w-4" /> Run Automated Audit</>
              )}
            </Button>
          </form>
        </Form>
      </div>

      <div className="lg:col-span-2">
        {!isLoading && !result && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-lg bg-muted/20">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center max-w-sm">
              Enter a company and ticker. I will automatically scrape the web for the latest transcripts and verify them against Yahoo Finance data.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
            <Loader2 className="h-10 w-10 animate-spin text-accent mb-4" />
            <div className="text-center space-y-2">
              <p className="font-medium">Forensic Engine Active</p>
              <p className="text-sm text-muted-foreground animate-pulse">Cross-referencing web transcripts with market financials...</p>
            </div>
          </div>
        )}

        {result && (
           <Card className="border-t-4 border-t-accent shadow-lg">
             <CardContent className="p-6">
               <div className="flex items-center gap-6 mb-8">
                 <div className="h-32 w-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[{v: result.managementTrustScore}, {v: 100 - result.managementTrustScore}]} cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" dataKey="v" stroke="none">
                          <Cell fill={result.managementTrustScore > 70 ? '#10b981' : '#f59e0b'} />
                          <Cell fill="#e5e7eb" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div>
                    <h2 className="text-3xl font-bold">{result.managementTrustScore}<span className="text-sm text-muted-foreground ml-1">/100</span></h2>
                    <p className="text-sm font-semibold uppercase text-accent tracking-widest">Trust Score</p>
                 </div>
               </div>
               <div className="space-y-4">
                 <h3 className="font-bold text-lg">Analysis Summary</h3>
                 <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 p-4 rounded-lg">
                   {result.reasoning}
                 </p>
               </div>
             </CardContent>
           </Card>
        )}
      </div>
    </div>
  );
}

export interface ManagementTrustScoreOutput {
  managementTrustScore: number;
  reasoning: string;
  citations: { text: string; source: string }[];
}

export async function calculateManagementTrustScore(input: any): Promise<ManagementTrustScoreOutput> {
  // We use 'any' for the input here so it can accept our new RAG data (transcript, yahoo, news)
  const text = await generateForTask('managementTrustScore', input);
  try {
    return JSON.parse(text) as ManagementTrustScoreOutput;
  } catch (e: any) {
    console.error("AI Parse Error:", text);
    return {
      managementTrustScore: 0,
      reasoning: "Failed to parse AI response. The data might be too complex.",
      citations: []
    };
  }
}