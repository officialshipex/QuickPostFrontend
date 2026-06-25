import React, { Suspense } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useDashboardData } from '../hooks/useDashboardData';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { ActionNeeded } from '../components/dashboard/ActionNeeded';
import { ShipmentsDetails } from '../components/dashboard/ShipmentsDetails';
import { NDRDetails } from '../components/dashboard/NDRDetails';
import { WeightDiscrepancy } from '../components/dashboard/WeightDiscrepancy';
import { CODStatus } from '../components/dashboard/CODStatus';
import { ChartsSection } from '../components/dashboard/charts/ChartsSection';
import { CourierSummaryTable } from '../components/dashboard/CourierSummaryTable';
import { Calendar, RefreshCw, Filter } from 'lucide-react';
import { DashboardFilterProvider, useDashboardFilters } from '../context/DashboardFilterContext';

function DashboardContent() {
  const { filters, updateFilter } = useDashboardFilters();
  const { data, isLoading, isError, refetch } = useDashboardData();

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full min-h-[500px] text-red-500">
        Failed to load dashboard data.
      </div>
    );
  }

  return (
    <>
      {/* Title Bar with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 text-xs font-medium text-[#64748B]">
          <span>Note: Showing data below from 17th Mar-16th Apr.</span>
          <RefreshCw className="w-3 h-3 cursor-pointer hover:text-[#00A86B]" onClick={() => refetch()} />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          
          <select 
            className="h-9 px-3 rounded-full border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#00A86B]/20"
            value={filters.courier}
            onChange={(e) => updateFilter('courier', e.target.value)}
          >
            <option value="All">All Couriers</option>
            <option value="Delhivery">Delhivery</option>
            <option value="Bluedart">Bluedart</option>
            <option value="XpressBees">XpressBees</option>
          </select>

          <select 
            className="h-9 px-3 rounded-full border border-[#E2E8F0] bg-white text-xs font-semibold text-[#475569] shadow-sm cursor-pointer outline-none focus:ring-2 focus:ring-[#00A86B]/20"
            value={filters.shipmentType}
            onChange={(e) => updateFilter('shipmentType', e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="Forward">Forward</option>
            <option value="Reverse">Reverse</option>
          </select>

          <div className="flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-full px-4 h-9 text-xs font-semibold text-[#475569] shadow-sm cursor-pointer hover:bg-[#F8FAFC]">
            <span>07/02/2026 - 07/04/2026</span>
            <Calendar className="w-3.5 h-3.5 text-[#94A3B8]" />
          </div>
          
          <button onClick={() => refetch()} className="w-9 h-9 rounded-full bg-[#00A86B] text-white flex items-center justify-center hover:bg-[#009B63] transition-colors shadow-sm">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <SummaryCards data={data?.summary} isLoading={isLoading} />
      <ActionNeeded data={data?.actionNeeded} isLoading={isLoading} />
      <ShipmentsDetails data={data?.shipmentsDetails} isLoading={isLoading} />
      <NDRDetails data={data?.ndrDetails} isLoading={isLoading} />
      <WeightDiscrepancy data={data?.weightDiscrepancy} isLoading={isLoading} />
      <CODStatus data={data?.codStatus} isLoading={isLoading} />
      
      <ChartsSection />
      
      <CourierSummaryTable />
    </>
  );
}

export function Dashboard() {
  return (
    <DashboardLayout>
      <DashboardFilterProvider>
        <DashboardContent />
      </DashboardFilterProvider>
    </DashboardLayout>
  );
}
