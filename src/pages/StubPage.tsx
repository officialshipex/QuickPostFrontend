import React from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { useLocation } from 'react-router-dom';

export function StubPage({ title }: { title: string }) {
  const location = useLocation();

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center h-[70vh] bg-white rounded-2xl border border-[#E2E8F0] p-8 text-center">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-4">{title}</h1>
        <p className="text-[#64748B] text-lg max-w-md">
          This is a placeholder page for the {title} feature. It will be implemented in future backend integration phases.
        </p>
        <div className="mt-8 bg-[#F8FAFC] px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm font-mono text-[#475569]">
          Current Route: {location.pathname}{location.search}
        </div>
      </div>
    </DashboardLayout>
  );
}
