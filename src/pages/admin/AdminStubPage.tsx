import React from "react";
import { AdminLayout } from "../../components/admin/layout/AdminLayout";
import { useLocation } from "react-router-dom";

export function AdminStubPage({ title }: { title: string }) {
  const location = useLocation();
  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-4">{title}</h1>
        <p className="text-[#64748B] mb-2">
          This is a stub page for the admin module.
        </p>
        <code className="bg-[#F8FAFC] border border-[#E2E8F0] px-4 py-2 rounded-lg text-[#00A86B] text-sm">
          {location.pathname}
        </code>
      </div>
    </AdminLayout>
  );
}
