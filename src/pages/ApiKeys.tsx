import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, CheckCircle2, Shield, AlertTriangle, X } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed: string;
  status: 'Active' | 'Revoked';
  permissions: string[];
}

const MOCK_KEYS: ApiKey[] = [
  { id: '1', name: 'Production API Key', key: 'qp_live_sk_a3b7c9d2e5f1g8h4i6j0', created: '01 Jan 2026', lastUsed: '12 Jun 2026, 3:45 PM', status: 'Active', permissions: ['Orders', 'Shipments', 'Tracking', 'Webhooks'] },
  { id: '2', name: 'Staging API Key', key: 'qp_test_sk_x1y2z3w4v5u6t7s8r9', created: '15 Mar 2026', lastUsed: '10 Jun 2026, 11:00 AM', status: 'Active', permissions: ['Orders', 'Shipments'] },
  { id: '3', name: 'Old Integration Key', key: 'qp_live_sk_m9n8o7p6q5r4s3t2u1', created: '10 Oct 2025', lastUsed: '28 Feb 2026', status: 'Revoked', permissions: ['Orders'] },
];

export function ApiKeys() {
  const [keys, setKeys] = useState(MOCK_KEYS);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const revokeKey = (id: string) => {
    setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'Revoked' as const } : k));
  };

  const maskKey = (key: string) => key.substring(0, 12) + '••••••••••••';

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">API Keys</h1>
            <p className="text-sm text-[#64748B] mt-0.5">Manage API keys for integrating with QuickPost</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 h-10 rounded-full bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63] transition-colors">
            <Plus className="w-4 h-4" /> Generate Key
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-blue-900">Keep your API keys secure</div>
            <div className="text-xs text-blue-700 mt-0.5">Never expose API keys in client-side code or public repositories. Use environment variables on your server.</div>
          </div>
        </div>

        {/* Keys List */}
        <div className="space-y-4">
          {keys.map(k => (
            <div key={k.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${k.status === 'Revoked' ? 'border-[#E2E8F0] opacity-60' : 'border-[#E2E8F0]'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${k.status === 'Active' ? 'bg-green-50' : 'bg-gray-100'}`}>
                    <Key className={`w-5 h-5 ${k.status === 'Active' ? 'text-green-500' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#0F172A]">{k.name}</div>
                    <div className="text-xs text-[#64748B]">Created: {k.created}</div>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${k.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {k.status === 'Active' ? <><CheckCircle2 className="w-3 h-3 inline mr-1" />{k.status}</> : k.status}
                </span>
              </div>

              {/* Key Display */}
              <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 h-10 mb-3">
                <code className="flex-1 text-xs font-mono text-[#475569]">
                  {showKey === k.id ? k.key : maskKey(k.key)}
                </code>
                <button onClick={() => setShowKey(showKey === k.id ? null : k.id)} className="text-[#94A3B8] hover:text-[#475569]">
                  {showKey === k.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => copyKey(k.key)} className="text-[#94A3B8] hover:text-[#00A86B]">
                  <Copy className="w-4 h-4" />
                </button>
                {copied === k.key && <span className="text-[10px] text-[#00A86B] font-semibold">Copied!</span>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-[#64748B]">Permissions:</span>
                  {k.permissions.map(p => (
                    <span key={p} className="px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[10px] font-semibold text-[#475569]">{p}</span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-[#94A3B8]">Last used: {k.lastUsed}</span>
                  {k.status === 'Active' && (
                    <button onClick={() => revokeKey(k.id)} className="flex items-center gap-1 px-3 h-7 rounded-full border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50">
                      <Trash2 className="w-3 h-3" /> Revoke
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-[#0F172A]">Generate New API Key</h3>
                <button onClick={() => setShowCreate(false)} className="w-8 h-8 rounded-full hover:bg-[#F8FAFC] flex items-center justify-center text-[#64748B]"><X className="w-4 h-4" /></button>
              </div>
              <div className="mb-4">
                <label className="text-xs font-semibold text-[#475569] mb-1.5 block">Key Name</label>
                <input type="text" value={newKeyName} onChange={e => setNewKeyName(e.target.value)} placeholder="e.g. Production API Key"
                  className="w-full h-10 px-3 rounded-xl border border-[#E2E8F0] text-sm outline-none focus:border-[#00A86B]" />
              </div>
              <div className="mb-5">
                <label className="text-xs font-semibold text-[#475569] mb-2 block">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {['Orders', 'Shipments', 'Tracking', 'Webhooks', 'COD', 'Reports'].map(p => (
                    <label key={p} className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E2E8F0] rounded-full cursor-pointer hover:border-[#00A86B]">
                      <input type="checkbox" className="accent-[#00A86B] w-3.5 h-3.5" defaultChecked={p === 'Orders' || p === 'Shipments'} />
                      <span className="text-xs text-[#475569]">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl mb-5 text-xs text-yellow-800">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>The API key will only be shown once. Make sure to copy and store it securely.</span>
              </div>
              <button className="w-full h-11 rounded-full bg-[#00A86B] text-white font-bold hover:bg-[#009B63] transition-colors flex items-center justify-center gap-2">
                <Key className="w-4 h-4" /> Generate Key
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
