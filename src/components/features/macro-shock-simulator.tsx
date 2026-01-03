'use client';

import { useState, useEffect, useRef } from 'react';
import * as React from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { handleMacroShock, fetchPortfolioInsights } from '@/app/actions';
import type { SimulatePortfolioImpactOutput } from '@/ai/flows/portfolio-impact-of-macro-events';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingDown, ShieldHalf, Activity, Brain, Globe } from 'lucide-react';
import type { TavilySearchResponse } from '@/lib/tavily';
import PortfolioDrawdownChart from './portfolio-drawdown-chart';

const FormSchema = z.object({
  portfolioHoldings: z
    .string()
    .min(10, 'Please enter your portfolio holdings.'),
  macroEvent: z.string({ required_error: 'Please select a macro event.' }),
});

export function MacroShockSimulator({ portfolio }: { portfolio?: any } = {}) {
  const [result, setResult] = useState<SimulatePortfolioImpactOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<Record<string, TavilySearchResponse> | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: { portfolioHoldings: '' },
  });

  // Fetch insights when portfolio holdings are available
  const fetchInsights = async (holdingsText: string) => {
    if (!holdingsText || holdingsText.trim().length < 10) {
      setInsights(null);
      return;
    }

    setIsLoadingInsights(true);
    try {
      const res = await fetchPortfolioInsights(holdingsText);
      if (res.error) {
        console.error('Error fetching insights:', res.error);
        // Don't show error toast, just silently fail
      } else {
        setInsights(res.data as Record<string, TavilySearchResponse>);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    setResult(null);

    // Fetch insights in parallel with simulation
    const holdingsText = portfolio 
      ? portfolio.holdings.map((h:any)=>`${h.companyId}: ${h.quantity}`).join(', ')
      : data.portfolioHoldings;
    fetchInsights(holdingsText);

    let res;
    if (portfolio?.id) {
      res = await handleMacroShock({ portfolioId: portfolio.id, macroEvent: data.macroEvent });
    } else {
      res = await handleMacroShock(data);
    }

    setIsLoading(false);

    const { data: simData, error } = res;
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
    } else {
      setResult(simData);
    }
  }

  // Fetch insights when component mounts with portfolio
  useEffect(() => {
    if (portfolio?.holdings && portfolio.holdings.length > 0) {
      const holdingsText = portfolio.holdings.map((h:any)=>`${h.companyId}: ${h.quantity}`).join(', ');
      fetchInsights(holdingsText);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [portfolio]);

  const parseDrawdown = (drawdown: string): number[] => {
    const numbers = drawdown.match(/\d+(\.\d+)?/g);
    return numbers ? numbers.map(Number) : [0,0];
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="portfolioHoldings"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Holdings</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., RELIANCE: 20%, HDFCBANK: 15%, INFY: 10%"
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || (portfolio ? portfolio.holdings.map((h:any)=>`${h.companyId}: ${h.quantity}`).join(', ') : '')}
                      onChange={(e) => {
                        field.onChange(e);
                        // Debounce insights fetching
                        if (debounceTimeoutRef.current) {
                          clearTimeout(debounceTimeoutRef.current);
                        }
                        debounceTimeoutRef.current = setTimeout(() => {
                          fetchInsights(e.target.value);
                        }, 1500);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="macroEvent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Macro Event</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an event to simulate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="RBI rate hike of 0.5%">
                        RBI rate hike of 0.5%
                      </SelectItem>
                      <SelectItem value="Oil price shock to $120/barrel">
                        Oil price shock to $120/barrel
                      </SelectItem>
                      <SelectItem value="10% INR depreciation vs USD">
                        10% INR depreciation vs USD
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading} className="w-full bg-accent hover:bg-accent/90">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simulate Impact
            </Button>
          </form>
        </Form>
      </div>
      <div className="lg:col-span-2">
        {isLoading && (
           <div className="flex items-center justify-center h-full min-h-[300px]">
                <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="mt-4 text-muted-foreground">Running macro-shock simulation...</p>
                </div>
            </div>
        )}
        {result && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Expected Drawdown</CardTitle>
                        <TrendingDown className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-destructive">{result.expectedDrawdown}</div>
                        <p className="text-xs text-muted-foreground">Estimated portfolio value reduction</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Downside Risk</CardTitle>
                        <ShieldHalf className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {/* Safely handle missing or non-string downsideRisk */}
                        {typeof result.downsideRisk === 'string' && result.downsideRisk.trim() ? (
                          <div className="space-y-1">
                            {/* Try to extract a numeric value or key phrase at the start */}
                            {(() => {
                              const trimmed = result.downsideRisk.trim();
                              // Try to match a percentage or number at the start (e.g., "High", "15%", "10-15%", "Moderate (10-15%)")
                              const percentageMatch = trimmed.match(/^([0-9]+(?:\.[0-9]+)?\s*[-–—]\s*[0-9]+(?:\.[0-9]+)?%?|[0-9]+(?:\.[0-9]+)?%?|High|Medium|Moderate|Low)/i);
                              if (percentageMatch) {
                                const value = percentageMatch[1];
                                const rest = trimmed.substring(percentageMatch[0].length).trim();
                                return (
                                  <>
                                    <div className="text-2xl font-bold">{value}</div>
                                    {rest && <p className="text-xs text-muted-foreground">{rest}</p>}
                                  </>
                                );
                              }
                              // If no match, show first 3 words as value and rest as description
                              const words = trimmed.split(/\s+/);
                              if (words.length > 3) {
                                return (
                                  <>
                                    <div className="text-2xl font-bold">{words.slice(0, 3).join(' ')}</div>
                                    <p className="text-xs text-muted-foreground">{words.slice(3).join(' ')}</p>
                                  </>
                                );
                              }
                              // Show all as one line if short
                              return <div className="text-base font-semibold">{trimmed}</div>;
                            })()}
                          </div>
                        ) : (
                          <>
                            <div className="text-2xl font-bold text-muted-foreground">N/A</div>
                            <p className="text-xs text-muted-foreground">No downside risk provided</p>
                          </>
                        )}
                    </CardContent>
                </Card>
            </div>
            <Card>
              <CardHeader>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Sector Sensitivity
                  </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{result.sectorSensitivity}</p>
                <div className="h-[200px] mt-4">
                    <PortfolioDrawdownChart drawdownRange={parseDrawdown(result.expectedDrawdown)} />
                </div>
              </CardContent>
            </Card>

            {/* Reasoning card - Always show when we have a result */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Brain className="h-4 w-4 text-muted-foreground" />
                  Analysis & Reasoning
                </CardTitle>
                <CardDescription>
                  Detailed analysis of the macro shock impact on your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result.reasoning && result.reasoning.trim() ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                      {result.reasoning}
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No detailed reasoning available. Check the console for raw model output.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Suggested action card (if model provided a recommendation) */}
            {result.suggestedAction && ( 
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Suggested Action</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-semibold">{result.suggestedAction.action}</div>
                  <p className="text-sm text-muted-foreground mt-2">{result.suggestedAction.details}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Web Insights Card - Always visible when insights are available */}
        {(insights || isLoadingInsights) && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                Web Insights for Portfolio Holdings
              </CardTitle>
              <CardDescription>
                Real-time news and insights from the web for companies in your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingInsights ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <p className="text-sm text-muted-foreground">Fetching web insights...</p>
                </div>
              ) : insights && Object.keys(insights).length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(insights).map(([companyName, searchResults]) => (
                    <div key={companyName} className="border-b last:border-0 pb-4 last:pb-0">
                      <h4 className="font-semibold text-base mb-3">{companyName}</h4>
                      
                      {searchResults.answer && (
                        <div className="mb-3 p-3 bg-muted/50 rounded-md">
                          <p className="text-sm font-medium mb-1">Summary:</p>
                          <p className="text-sm text-muted-foreground">{searchResults.answer}</p>
                        </div>
                      )}

                      {searchResults.results && searchResults.results.length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Recent News & Insights:</p>
                          {searchResults.results.slice(0, 3).map((result, index) => (
                            <div key={index} className="p-3 border rounded-md hover:bg-muted/50 transition-colors">
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-primary hover:underline block mb-1"
                              >
                                {result.title}
                              </a>
                              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                                {result.content}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="truncate">{new URL(result.url).hostname}</span>
                                {result.published_date && (
                                  <>
                                    <span>•</span>
                                    <span>{new Date(result.published_date).toLocaleDateString()}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {(!searchResults.results || searchResults.results.length === 0) && !searchResults.answer && (
                        <p className="text-sm text-muted-foreground">No insights available for this company.</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No insights available. Please enter portfolio holdings to fetch insights.</p>
              )}
            </CardContent>
          </Card>
        )}

         {!isLoading && !result && (
            <div className="flex items-center justify-center h-full min-h-[300px] border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Fill the form to simulate portfolio impact.</p>
            </div>
        )}
      </div>
    </div>
  );
}
