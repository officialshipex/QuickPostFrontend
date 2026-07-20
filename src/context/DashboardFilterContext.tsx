import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

export interface DashboardDateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface DashboardFilters {
  dateRange: DashboardDateRange;
  courier: string;
  shipmentType: string;
  status: string;
}

interface DashboardFilterContextType {
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  updateFilter: (key: keyof DashboardFilters, value: any) => void;
}

function getDefaultDateRange(): DashboardDateRange {
  const end = new Date(); end.setHours(23, 59, 59, 999);
  const start = new Date(); start.setDate(start.getDate() - 29); start.setHours(0, 0, 0, 0);
  return { start, end, label: 'Last 30 Days' };
}

const defaultFilters: DashboardFilters = {
  dateRange: getDefaultDateRange(),
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
