import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Building2, Save, Globe, Phone, Mail, MapPin, FileText } from 'lucide-react';

export function Company() {
  const [form, setForm] = useState({
    companyName: 'ABC Studio Pvt Ltd',
    brandName: 'ABC Studio',
    website: 'https://abcstudio.in',
    industry: 'E-Commerce',
    gstNumber: '27AABCU9603R1ZM',
    panNumber: 'AABCU9603R',
    contactEmail: 'business@abcstudio.in',
    contactPhone: '022-12345678',
    regAddress: '123 Business Park, Andheri West, Mumbai, Maharashtra 400053',
    warehouseAddress: 'Unit 4, Industrial Area Phase 2, Thane, Maharashtra 400601',
  });

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Company Details</h1>
        <p className="text-sm text-[#64748B] mb-6">Manage your business information</p>

        {/* Company Header */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00A86B] to-[#007BFF] flex items-center justify-center text-white text-2xl font-bold shadow-sm">
            A
          </div>
          <div>
            <div className="text-lg font-bold text-[#0F172A]">{form.companyName}</div>
            <div className="text-sm text-[#64748B]">{form.industry} · GSTIN: {form.gstNumber}</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">Verified business account</div>
          </div>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
          <h3 className="text-sm font-bold text-[#0F172A] mb-5">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { key: 'companyName', label: 'Legal Company Name', icon: Building2 },
              { key: 'brandName', label: 'Brand Name', icon: Building2 },
              { key: 'website', label: 'Website', icon: Globe },
              { key: 'industry', label: 'Industry', icon: FileText },
              { key: 'contactEmail', label: 'Business Email', icon: Mail },
              { key: 'contactPhone', label: 'Business Phone', icon: Phone },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-[#475569] mb-1.5 block">{f.label}</label>
                <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 h-10 focus-within:border-[#00A86B]">
                  <f.icon className="w-4 h-4 text-[#94A3B8] shrink-0" />
                  <input type="text" value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)}
                    className="flex-1 text-sm outline-none text-[#0F172A]" />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-bold text-[#0F172A] mb-5">Tax Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-[#475569] mb-1.5 block">GST Number</label>
              <input type="text" value={form.gstNumber} onChange={e => update('gstNumber', e.target.value)}
                className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B] font-mono" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#475569] mb-1.5 block">PAN Number</label>
              <input type="text" value={form.panNumber} onChange={e => update('panNumber', e.target.value)}
                className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B] font-mono" />
            </div>
          </div>

          <h3 className="text-sm font-bold text-[#0F172A] mb-5">Addresses</h3>
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Registered Address</label>
              <div className="flex items-start gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2 focus-within:border-[#00A86B]">
                <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                <textarea value={form.regAddress} onChange={e => update('regAddress', e.target.value)} rows={2}
                  className="flex-1 text-sm outline-none text-[#0F172A] resize-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Warehouse / Pickup Address</label>
              <div className="flex items-start gap-2 border border-[#E2E8F0] rounded-xl px-3 py-2 focus-within:border-[#00A86B]">
                <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                <textarea value={form.warehouseAddress} onChange={e => update('warehouseAddress', e.target.value)} rows={2}
                  className="flex-1 text-sm outline-none text-[#0F172A] resize-none" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button className="px-5 h-10 rounded-full border border-[#E2E8F0] text-sm font-semibold text-[#475569] hover:bg-[#F8FAFC]">Cancel</button>
            <button className="flex items-center gap-2 px-5 h-10 rounded-full bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63] transition-colors">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
