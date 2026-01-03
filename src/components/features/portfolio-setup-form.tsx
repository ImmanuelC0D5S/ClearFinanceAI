'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

export default function PortfolioSetupForm({ companies }: { companies: any[] }) {
  const router = useRouter();
  const [rows, setRows] = useState([{ companyId: companies[0]?.id || '', quantity: '', avgPrice: '' }]);
  const [name, setName] = useState('My Portfolio');

  function updateRow(idx: number, patch: Partial<any>) {
    const copy = [...rows];
    copy[idx] = { ...copy[idx], ...patch };
    setRows(copy);
  }

  function addRow() {
    setRows([...rows, { companyId: companies[0]?.id || '', quantity: '', avgPrice: '' }]);
  }

  function removeRow(idx: number) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  async function submit() {
    const holdings = rows.map((r) => ({ companyId: r.companyId, quantity: Number(r.quantity), avgPrice: Number(r.avgPrice) }));
    const res = await fetch('/api/portfolios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, holdings }) });
    const json = await res.json();
    if (res.ok && json.portfolio) {
      const id = json.portfolio.id;
      router.push(`/dashboard?portfolioId=${id}`);
    } else {
      alert(json.error || 'Failed to create portfolio');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Portfolio Name</label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      {rows.map((r, idx) => (
        <div key={idx} className="grid grid-cols-3 gap-2 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Company</label>
            <Select value={r.companyId} onValueChange={(v) => updateRow(idx, { companyId: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem value={c.id} key={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <Input value={r.quantity} onChange={(e) => updateRow(idx, { quantity: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Avg Price</label>
            <Input value={r.avgPrice} onChange={(e) => updateRow(idx, { avgPrice: e.target.value })} />
          </div>
          <div className="col-span-3 flex gap-2">
            <Button variant="ghost" onClick={() => removeRow(idx)}>Remove</Button>
          </div>
        </div>
      ))}
      <div className="flex gap-2">
        <Button variant="outline" onClick={addRow}>Add Holding</Button>
        <Button onClick={submit}>Create Portfolio</Button>
      </div>
    </div>
  );
}
