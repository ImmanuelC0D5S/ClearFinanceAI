import { getCompanies } from '@/lib/companies';
import React from 'react';
import PortfolioSetupForm from '@/components/features/portfolio-setup-form';

// Simple server component that fetches companies and renders a client form
export default async function SetupPage() {
  const companies = await getCompanies();
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-2xl font-semibold mb-4">Initial Portfolio Setup</h1>
      <p className="text-sm text-muted-foreground mb-6">Add your holdings to construct a portfolio. This will be used across the dashboard.</p>
      {/* server -> client prop */}
      <PortfolioSetupForm companies={companies} />
    </div>
  );
}
