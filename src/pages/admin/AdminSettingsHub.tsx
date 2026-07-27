import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import {
  User, ShieldCheck, Lock, Tag, CreditCard, Users, MessageCircle, Activity, FileText, ChevronRight,
} from 'lucide-react';

interface SettingsCard {
  title: string;
  description: string;
  icon: any;
  path: string;
}

const SETTINGS_CARDS: SettingsCard[] = [
  { title: 'Company Profile', description: 'Edit your company details', icon: User, path: '/user/profile' },
  { title: 'KYC', description: 'Manage KYC documents', icon: ShieldCheck, path: '/user/kyc' },
  { title: 'Change Password', description: 'Update your credentials', icon: Lock, path: '/user/settings/change-password' },
  { title: 'Label', description: 'Customize your labels', icon: Tag, path: '/user/settings/label' },
  { title: 'Invoice', description: 'Manage invoice settings', icon: CreditCard, path: '/user/settings/invoice' },
  { title: 'Invite & Earn', description: 'Invite your friends and earn rewards', icon: Users, path: '/user/referral' },
  { title: 'Notification Settings', description: 'Manage Notification for status update', icon: MessageCircle, path: '/user/notification' },
  { title: 'Webhook', description: 'Manage your webhooks and logs', icon: Activity, path: '/user/settings/webhook' },
  { title: 'Agreement', description: 'Read and accept platform agreements', icon: FileText, path: '/user/settings/agreement' },
];

export function AdminSettingsHub() {
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        <h1 className="text-[20px] font-bold text-[#0F172A] mb-4">Settings</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {SETTINGS_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.3) }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(card.path)}
                className="group relative bg-white border border-[#E2E8F0] rounded-2xl p-5 text-left shadow-sm hover:border-[#00A86B] hover:shadow-[0_8px_24px_-8px_rgba(0,168,107,0.25)] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#00A86B] to-[#007A4D] flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#00A86B] group-hover:translate-x-0.5 transition-all" />
                </div>
                <h3 className="text-[14px] font-semibold text-[#0F172A] mb-1">{card.title}</h3>
                <p className="text-[12px] font-normal text-[#64748B] leading-relaxed">{card.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
