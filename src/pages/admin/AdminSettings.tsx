import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { Save, Shield, Settings, Server, Mail, CreditCard, Key } from 'lucide-react';

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('General');
  
  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A]">System Settings</h2>
          <p className="text-xs text-[#64748B] mt-1">Manage global platform configurations.</p>
        </div>
        <button className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#009B63] shadow-sm">
          <Save className="w-4 h-4" /> Save Changes
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
            {[
              { id: 'General', icon: Settings },
              { id: 'Security', icon: Shield },
              { id: 'Integrations', icon: Server },
              { id: 'Email', icon: Mail },
              { id: 'Billing', icon: CreditCard },
              { id: 'API Keys', icon: Key },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-colors border-l-2 ${activeTab === tab.id ? 'bg-[#F8FAFC] border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'}`}
              >
                <tab.icon className="w-4 h-4" /> {tab.id}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <h3 className="font-bold text-lg text-[#0F172A] mb-6">{activeTab} Settings</h3>
            
            {activeTab === 'General' && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">Platform Name</label>
                  <input type="text" defaultValue="QuickPost Logistics" className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">Support Email</label>
                  <input type="email" defaultValue="support@quickpost.in" className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-sm focus:outline-none focus:border-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#475569] mb-1.5">Maintenance Mode</label>
                  <div className="flex items-center gap-3 mt-2">
                    <button className="w-12 h-6 rounded-full bg-gray-200 relative transition-colors focus:outline-none">
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform"></div>
                    </button>
                    <span className="text-sm text-[#64748B]">Disable platform access for maintenance</span>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab !== 'General' && (
              <div className="py-12 text-center">
                <Settings className="w-12 h-12 text-[#E2E8F0] mx-auto mb-3" />
                <h4 className="text-[#0F172A] font-bold">Settings Panel</h4>
                <p className="text-sm text-[#64748B] mt-1">Configuration options for {activeTab.toLowerCase()} will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
