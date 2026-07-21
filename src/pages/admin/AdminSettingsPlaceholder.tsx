import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { ArrowLeft, Construction } from 'lucide-react';

interface AdminSettingsPlaceholderProps {
  title: string;
  description: string;
}

export function AdminSettingsPlaceholder({ title, description }: AdminSettingsPlaceholderProps) {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        <button
          onClick={() => navigate('/user/settings')}
          className="flex items-center gap-2 text-[12px] font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors bg-white px-3.5 py-2 rounded-lg border border-[#E2E8F0] hover:border-[#CBD5E1] mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Settings
        </button>

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[50vh]">
          <div className="w-14 h-14 rounded-full bg-[#F0FDF4] flex items-center justify-center mb-4">
            <Construction className="w-6 h-6 text-[#00A86B]" />
          </div>
          <h2 className="text-[14px] font-semibold text-[#0F172A] mb-1">{title}</h2>
          <p className="text-[12px] font-normal text-[#64748B] max-w-sm">{description}</p>
          <p className="text-[12px] font-normal text-[#94A3B8] mt-4">This section is coming soon.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
