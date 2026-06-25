import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface DashboardFilters {
  dateRange: { start: Date | null; end: Date | null };
  courier: string;
  shipmentType: string;
  status: string;
}

interface DashboardFilterContextType {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  updateFilter: (key: keyof DashboardFilters, value: any) => void;
}

const defaultFilters: DashboardFilters = {
  dateRange: { start: null, end: null },
  courier: 'All',
  shipmentType: 'All',
  status: 'All',
};

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const updateFilter = (key: keyof DashboardFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardFilterContext.Provider value={{ filters, setFilters, updateFilter }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}
