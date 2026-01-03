'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Loader2, Briefcase } from 'lucide-react';

export function PortfolioManager() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [portfolioName, setPortfolioName] = useState('My Main Portfolio');
  const [holdings, setHoldings] = useState([{ ticker: '', quantity: 0 }]);

  // Load existing portfolio from Firebase on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/portfolios');
        const data = await res.json();
        if (data.portfolio) {
          setPortfolioName(data.portfolio.portfolioName || 'My Main Portfolio');
          setHoldings(data.portfolio.holdings || [{ ticker: '', quantity: 0 }]);
        }
      } catch (e) {
        console.error("Failed to load portfolio");
      } finally {
        setFetching(false);
      }
    }
    load();
  }, []);

  const addHolding = () => setHoldings([...holdings, { ticker: '', quantity: 0 }]);
  
  const removeHolding = (index: number) => {
    setHoldings(holdings.filter((_, i) => i !== index));
  };

  const updateHolding = (index: number, field: string, value: string | number) => {
    const newHoldings = [...holdings];
    // @ts-ignore
    newHoldings[index][field] = value;
    setHoldings(newHoldings);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: portfolioName, holdings })
      });
      
      if (res.ok) {
        toast({ title: "Success", description: "Portfolio synced to Firebase." });
      } else {
        throw new Error("Failed to save");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: "Could not save to database." });
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <Card className="max-w-2xl mx-auto shadow-xl border-t-4 border-t-primary">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Briefcase className="text-primary h-6 w-6" />
          <div>
            <CardTitle>Portfolio Settings</CardTitle>
            <CardDescription>Update your NSE/BSE holdings for AI analysis.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-muted-foreground">Portfolio Name</label>
          <Input value={portfolioName} onChange={(e) => setPortfolioName(e.target.value)} />
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold uppercase text-muted-foreground">Holdings</label>
          {holdings.map((holding, index) => (
            <div key={index} className="flex gap-3 items-center">
              <Input 
                className="flex-[2]"
                placeholder="Ticker (e.g. TCS.NS)" 
                value={holding.ticker}
                onChange={(e) => updateHolding(index, 'ticker', e.target.value.toUpperCase())}
              />
              <Input 
                className="flex-1"
                type="number"
                placeholder="Qty" 
                value={holding.quantity}
                onChange={(e) => updateHolding(index, 'quantity', parseInt(e.target.value))}
              />
              <Button variant="ghost" size="icon" onClick={() => removeHolding(index)} className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button variant="outline" onClick={addHolding} className="flex-1">Add Stock</Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1 bg-accent">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save to Cloud"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}