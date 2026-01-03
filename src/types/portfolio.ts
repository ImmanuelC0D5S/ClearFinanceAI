export type Company = {
  id: string;
  name: string;
  ticker?: string;
  sector?: string;
  metadata?: Record<string, any>;
};

export type Holding = {
  companyId: string;
  quantity: number;
  avgPrice: number; // per-share average price in portfolio currency
};

export type Portfolio = {
  id: string;
  name: string;
  ownerId?: string;
  holdings: Holding[];
  createdAt: string; // ISO
  updatedAt?: string;
};
