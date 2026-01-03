import { PortfolioManager } from '@/components/features/portfolio-manager';

export default function PortfolioPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-8 pt-6 min-h-screen">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-bold tracking-tight font-headline">User Profile</h1>
        <p className="text-muted-foreground">
          Manage your investment holdings. This data is saved to Firebase and used for AI forensic audits.
        </p>
      </div>
      
      {/* This component handles the actual form and Firebase logic */}
      <PortfolioManager />
    </div>
  );
}