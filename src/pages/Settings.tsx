import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Bell, Lock, Globe, Palette, Save, Shield, Eye, EyeOff } from 'lucide-react';

export function Settings() {
  const [activeSection, setActiveSection] = useState('notifications');
  const [notifSettings, setNotifSettings] = useState({
    emailPickup: true, emailNdr: true, emailCod: true, emailWeight: false,
    smsPickup: false, smsNdr: true, smsCod: false, smsWeight: false,
    pushPickup: true, pushNdr: true, pushCod: true, pushWeight: true,
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const sections = [
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const toggleNotif = (key: string) => setNotifSettings(p => ({ ...p, [key]: !(p as any)[key] }));

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-1">Settings</h1>
        <p className="text-sm text-[#64748B] mb-6">Manage your preferences and security</p>

        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-56 shrink-0">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
              {sections.map(s => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-xs font-semibold border-b border-[#E2E8F0] last:border-0 transition-all ${activeSection === s.id ? 'bg-[#00A86B]/5 text-[#00A86B] border-l-2 border-l-[#00A86B]' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}>
                  <s.icon className="w-4 h-4" /> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {activeSection === 'notifications' && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
                <h3 className="text-sm font-bold text-[#0F172A] mb-5">Notification Preferences</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[400px]">
                    <thead>
                      <tr className="text-xs font-semibold text-[#64748B]">
                        <th className="pb-4">Event</th>
                        <th className="pb-4 text-center">Email</th>
                        <th className="pb-4 text-center">SMS</th>
                        <th className="pb-4 text-center">Push</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { event: 'Pickup Updates', keys: ['emailPickup', 'smsPickup', 'pushPickup'] },
                        { event: 'NDR Alerts', keys: ['emailNdr', 'smsNdr', 'pushNdr'] },
                        { event: 'COD Settlements', keys: ['emailCod', 'smsCod', 'pushCod'] },
                        { event: 'Weight Discrepancy', keys: ['emailWeight', 'smsWeight', 'pushWeight'] },
                      ].map(row => (
                        <tr key={row.event} className="border-t border-[#E2E8F0]">
                          <td className="py-3 text-sm font-medium text-[#0F172A]">{row.event}</td>
                          {row.keys.map(k => (
                            <td key={k} className="py-3 text-center">
                              <button onClick={() => toggleNotif(k)}
                                className={`w-9 h-5 rounded-full transition-all relative ${(notifSettings as any)[k] ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${(notifSettings as any)[k] ? 'left-4' : 'left-0.5'}`}></div>
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end mt-5">
                  <button className="flex items-center gap-2 px-5 h-10 rounded-full bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63]">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
                <h3 className="text-sm font-bold text-[#0F172A] mb-5">Change Password</h3>
                <div className="space-y-4 max-w-md mb-6">
                  <div>
                    <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Current Password</label>
                    <div className="flex items-center border border-[#E2E8F0] rounded-xl px-3 h-10 focus-within:border-[#00A86B]">
                      <input type={showOldPass ? 'text' : 'password'} placeholder="Enter current password"
                        className="flex-1 text-sm outline-none text-[#0F172A]" />
                      <button onClick={() => setShowOldPass(!showOldPass)} className="text-[#94A3B8]">
                        {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#475569] mb-1.5 block">New Password</label>
                    <div className="flex items-center border border-[#E2E8F0] rounded-xl px-3 h-10 focus-within:border-[#00A86B]">
                      <input type={showNewPass ? 'text' : 'password'} placeholder="Enter new password"
                        className="flex-1 text-sm outline-none text-[#0F172A]" />
                      <button onClick={() => setShowNewPass(!showNewPass)} className="text-[#94A3B8]">
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Confirm New Password</label>
                    <input type="password" placeholder="Confirm new password"
                      className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B]" />
                  </div>
                </div>
                <button className="flex items-center gap-2 px-5 h-10 rounded-full bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63]">
                  <Lock className="w-4 h-4" /> Update Password
                </button>

                <div className="border-t border-[#E2E8F0] mt-8 pt-6">
                  <h3 className="text-sm font-bold text-[#0F172A] mb-3">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4">
                    <div>
                      <div className="text-sm font-semibold text-[#0F172A]">2FA is disabled</div>
                      <div className="text-xs text-[#64748B] mt-0.5">Add an extra layer of security to your account</div>
                    </div>
                    <button className="px-4 h-9 rounded-full border border-[#00A86B] text-[#00A86B] text-xs font-semibold hover:bg-[#00A86B]/5">Enable 2FA</button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
                <h3 className="text-sm font-bold text-[#0F172A] mb-5">Shipping Preferences</h3>
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Default Courier</label>
                    <select className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B]">
                      <option>Auto Select (Best Rate)</option><option>Delhivery</option><option>Bluedart</option><option>XpressBees</option><option>Shadowfax</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Default Pickup Slot</label>
                    <select className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B]">
                      <option>9:00 AM – 12:00 PM</option><option>12:00 PM – 3:00 PM</option><option>3:00 PM – 6:00 PM</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Default Package Weight (KG)</label>
                    <input type="text" defaultValue="0.5" className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B]" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Label Format</label>
                    <select className="w-full h-10 px-3 border border-[#E2E8F0] rounded-xl text-sm outline-none focus:border-[#00A86B]">
                      <option>A4 (4 per page)</option><option>A6 (Thermal Printer)</option><option>Custom</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end mt-5">
                  <button className="flex items-center gap-2 px-5 h-10 rounded-full bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63]">
                    <Save className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6">
                <h3 className="text-sm font-bold text-[#0F172A] mb-5">Privacy & Data</h3>
                <div className="space-y-4">
                  {[
                    { title: 'Share analytics with couriers', desc: 'Allow courier partners to view aggregated shipment data', enabled: true },
                    { title: 'Marketing communications', desc: 'Receive product updates and promotional offers', enabled: false },
                    { title: 'Activity logging', desc: 'Log all account activity for security purposes', enabled: true },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A]">{item.title}</div>
                        <div className="text-xs text-[#64748B] mt-0.5">{item.desc}</div>
                      </div>
                      <button className={`w-9 h-5 rounded-full transition-all relative ${item.enabled ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}>
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all shadow-sm ${item.enabled ? 'left-4' : 'left-0.5'}`}></div>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E2E8F0] mt-6 pt-6">
                  <h3 className="text-sm font-bold text-red-600 mb-2">Danger Zone</h3>
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div>
                      <div className="text-sm font-semibold text-red-700">Delete Account</div>
                      <div className="text-xs text-red-600">Permanently delete your account and all data</div>
                    </div>
                    <button className="px-4 h-9 rounded-full bg-red-600 text-white text-xs font-semibold hover:bg-red-700">Delete</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
