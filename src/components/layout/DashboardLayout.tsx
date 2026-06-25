import React from 'react';
import { Sidebar } from './Sidebar';
import { DashboardHeader } from './DashboardHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  headerLeft?: React.ReactNode;
}

export function DashboardLayout({ children, headerLeft }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <DashboardHeader leftContent={headerLeft} />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto no-scrollbar relative">
          <div className="max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
