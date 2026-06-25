import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Camera, Save, Mail, Phone, MapPin, User } from 'lucide-react';

export function Profile() {
  const [form, setForm] = useState({
    firstName: 'ABC',
    lastName: 'Studio',
    email: 'abc@gmail.com',
    phone: '9876543210',
    altPhone: '',
    address: '123 Business Park, Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
  });

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">My Profile</h1>
        <p className="text-sm text-[#64748B] mb-6">Manage your personal information</p>

        {/* Avatar Section */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6 flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center border-2 border-indigo-200 overflow-hidden">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <button className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-sm hover:bg-[#009B63]">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <div className="text-lg font-bold text-[#0F172A]">{form.firstName} {form.lastName}</div>
            <div className="text-sm text-[#64748B]">{form.email}</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">Member since January 2026</div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#0F172A] mb-5">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {[
              { key: 'firstName', label: 'First Name', icon: User },
              { key: 'lastName', label: 'Last Name', icon: User },
              { key: 'email', label: 'Email Address', icon: Mail },
              { key: 'phone', label: 'Phone Number', icon: Phone },
              { key: 'altPhone', label: 'Alt Phone', icon: Phone },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-[#475569] mb-1.5 block">{f.label}</label>
                <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 h-10 focus-within:border-[#00A86B] transition-colors">
                  <f.icon className="w-4 h-4 text-[#94A3B8] shrink-0" />
                  <input type="text" value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)}
                    className="flex-1 text-sm outline-none text-[#0F172A]" />
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-sm font-bold text-[#0F172A] mb-5">Address</h3>
          <div className="grid grid-cols-1 gap-4 mb-4">
            <div>
              <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Street Address</label>
              <div className="flex items-center gap-2 border border-[#E2E8F0] rounded-xl px-3 h-10 focus-within:border-[#00A86B]">
                <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0" />
                <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                  className="flex-1 text-sm outline-none text-[#0F172A]" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { key: 'city', label: 'City' },
              { key: 'state', label: 'State' },
              { key: 'pincode', label: 'Pincode' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-[#475569] mb-1.5 block">{f.label}</label>
                <input type="text" value={(form as any)[f.key]} onChange={e => update(f.key, e.target.value)}
                  className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B] text-[#0F172A]" />
              </div>
            ))}
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
