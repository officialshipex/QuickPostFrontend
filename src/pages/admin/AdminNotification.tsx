import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { 
  Edit2, Trash2, X, Check, Eye, Send,
  Bell, Mail, MessageSquare, Smartphone, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NotificationLog {
  id: string;
  recipient: string;
  email: string;
  channel: 'Email' | 'WhatsApp' | 'SMS' | 'Push';
  title: string;
  message: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  date: string;
}

interface Template {
  id: string;
  name: string;
  triggerEvent: string;
  channel: 'Email' | 'WhatsApp' | 'SMS' | 'Push';
  subject?: string;
  message: string;
  active: boolean;
}

const INITIAL_LOGS: NotificationLog[] = [
  {
    id: 'NTF-982',
    recipient: 'Dinesh Tharwani',
    email: 'dineshtharwani@gmail.com',
    channel: 'WhatsApp',
    title: 'KYC Verification Approved',
    message: 'Congratulations! Your business KYC verification has been approved. You can start shipping now.',
    status: 'Delivered',
    date: '25 Jun 2026, 11:20 AM'
  },
  {
    id: 'NTF-981',
    recipient: 'Rahul Sharma',
    email: 'rahul.s@example.com',
    channel: 'Email',
    title: 'Low Wallet Balance Alert',
    message: 'Your wallet balance is low (₹120.00). Please recharge soon to avoid shipment disruptions.',
    status: 'Delivered',
    date: '25 Jun 2026, 09:15 AM'
  },
  {
    id: 'NTF-980',
    recipient: 'Anita Desai',
    email: 'anita.d@shopeasy.in',
    channel: 'SMS',
    title: 'COD Remittance Processed',
    message: 'COD amount of ₹4,530.50 has been remitted to your bank account today.',
    status: 'Delivered',
    date: '24 Jun 2026, 04:34 PM'
  },
  {
    id: 'NTF-979',
    recipient: 'Vikram Singh',
    email: 'vikram.singh@example.com',
    channel: 'Push',
    title: 'New Feature: Multi-pickup points',
    message: 'You can now configure multiple pickup points in your address settings.',
    status: 'Delivered',
    date: '23 Jun 2026, 02:45 PM'
  },
  {
    id: 'NTF-978',
    recipient: 'Pooja Verma',
    email: 'pooja.verma@example.com',
    channel: 'Email',
    title: 'Daily Shipment Summary',
    message: 'Your summary for 22nd Jun: 12 orders delivered, 2 NDR cases open, 0 returns.',
    status: 'Failed',
    date: '22 Jun 2026, 10:05 PM'
  }
];

const INITIAL_TEMPLATES: Template[] = [
  {
    id: 'TMP-001',
    name: 'KYC Approval Notification',
    triggerEvent: 'On KYC Status Update (Approved)',
    channel: 'WhatsApp',
    message: 'Hello {userName}, your KYC verification is successful! Start booking your shipments today.',
    active: true
  },
  {
    id: 'TMP-002',
    name: 'Low Balance Warning',
    triggerEvent: 'When Wallet Balance falls below threshold',
    channel: 'Email',
    subject: 'Action Required: Recharge your QuickPost Wallet',
    message: 'Dear {userName}, your current wallet balance is {balance}, which is below the threshold of {threshold}. Please recharge to continue smooth shipping.',
    active: true
  },
  {
    id: 'TMP-003',
    name: 'COD Remittance Credit Alert',
    triggerEvent: 'When COD amount is credited to bank',
    channel: 'SMS',
    message: 'QuickPost Alert: COD remittance of {amount} has been processed for AWB(s) {awbList}. Expect credit in 24 hours.',
    active: true
  },
  {
    id: 'TMP-004',
    name: 'NDR Action Request',
    triggerEvent: 'When courier marks shipment as non-delivered',
    channel: 'Push',
    message: 'Alert: Action required for shipment AWB {awb}. Customer refused delivery. Respond to NDR within 24 hours.',
    active: false
  }
];

export function AdminNotification() {
  const [activeTab, setActiveTab] = useState<'logs' | 'templates'>('logs');
  const [logs, setLogs] = useState<NotificationLog[]>(INITIAL_LOGS);
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState(() => 
    (window as unknown as { __adminSearchQuery?: string }).__adminSearchQuery?.toLowerCase() || ''
  );

  // Modals state
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<NotificationLog | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Send Notification Form State
  const [sendForm, setSendForm] = useState({
    recipient: 'All Users',
    specificName: '',
    specificEmail: '',
    channel: 'Email' as NotificationLog['channel'],
    title: '',
    message: ''
  });

  // Template Form State
  const [templateForm, setTemplateForm] = useState({
    name: '',
    triggerEvent: '',
    channel: 'Email' as Template['channel'],
    subject: '',
    message: ''
  });

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync search from global navbar header
  useEffect(() => {
    const handleSearch = (e: Event) => {
      setSearchTerm(((e as CustomEvent).detail || '').toLowerCase());
    };
    window.addEventListener('admin-search', handleSearch);
    return () => {
      window.removeEventListener('admin-search', handleSearch);
    };
  }, []);

  // Filter logs and templates
  const filteredLogs = logs.filter(log => 
    log.recipient.toLowerCase().includes(searchTerm) ||
    log.email.toLowerCase().includes(searchTerm) ||
    log.title.toLowerCase().includes(searchTerm) ||
    log.message.toLowerCase().includes(searchTerm)
  );

  const filteredTemplates = templates.filter(temp => 
    temp.name.toLowerCase().includes(searchTerm) ||
    temp.triggerEvent.toLowerCase().includes(searchTerm) ||
    temp.message.toLowerCase().includes(searchTerm)
  );

  // Form submission handlers
  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendForm.title || !sendForm.message || (sendForm.recipient === 'Specific User' && (!sendForm.specificName || !sendForm.specificEmail))) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const newLog: NotificationLog = {
      id: `NTF-${Math.floor(100 + Math.random() * 900)}`,
      recipient: sendForm.recipient === 'All Users' ? 'All Users' : sendForm.specificName,
      email: sendForm.recipient === 'All Users' ? 'broadcast@quickpost.in' : sendForm.specificEmail,
      channel: sendForm.channel,
      title: sendForm.title,
      message: sendForm.message,
      status: 'Delivered',
      date: new Date().toLocaleString('en-GB', { 
        day: 'numeric', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      }).replace(',', '')
    };

    setLogs([newLog, ...logs]);
    setIsSendModalOpen(false);
    setSendForm({
      recipient: 'All Users',
      specificName: '',
      specificEmail: '',
      channel: 'Email',
      title: '',
      message: ''
    });
    showToast('Notification sent successfully!');
  };

  const handleEditTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate || !templateForm.name || !templateForm.message || !templateForm.triggerEvent) {
      showToast('Please fill out all fields.', 'error');
      return;
    }

    setTemplates(templates.map(t => 
      t.id === editingTemplate.id 
        ? {
            ...t,
            name: templateForm.name,
            triggerEvent: templateForm.triggerEvent,
            channel: templateForm.channel,
            subject: templateForm.channel === 'Email' ? templateForm.subject : undefined,
            message: templateForm.message
          }
        : t
    ));

    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
    showToast('Template updated successfully!');
  };

  const handleDeleteLog = (id: string) => {
    setLogs(logs.filter(l => l.id !== id));
    showToast('Log entry removed successfully!');
  };

  const toggleTemplateActive = (id: string, name: string) => {
    let nextState = false;
    setTemplates(templates.map(t => {
      if (t.id === id) {
        nextState = !t.active;
        return { ...t, active: nextState };
      }
      return t;
    }));
    showToast(`Template "${name}" ${nextState ? 'enabled' : 'disabled'}!`);
  };

  const openEditTemplate = (item: Template) => {
    setEditingTemplate(item);
    setTemplateForm({
      name: item.name,
      triggerEvent: item.triggerEvent,
      channel: item.channel,
      subject: item.subject || '',
      message: item.message
    });
    setIsTemplateModalOpen(true);
  };

  // Helper render components
  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Email': return <Mail className="w-4 h-4 text-blue-500" />;
      case 'WhatsApp': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'SMS': return <Smartphone className="w-4 h-4 text-orange-500" />;
      case 'Push': return <Bell className="w-4 h-4 text-purple-500" />;
      default: return <Bell className="w-4 h-4 text-[#00A86B]" />;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1400px] mx-auto pb-10">
        
        {/* Header Title block */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#00A86B]" />
              Notification Management
            </h2>
            <p className="text-xs text-[#64748B] mt-1">Send customized broadcasts and manage system triggers or notification templates.</p>
          </div>
          
          <button 
            onClick={() => setIsSendModalOpen(true)}
            className="h-9 px-4 rounded-lg bg-[#00A86B] text-white text-xs font-semibold flex items-center gap-2 hover:bg-[#009B63] shadow-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Send Custom Alert
          </button>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[#F4F9FF] rounded-xl p-4 border border-[#E0F2FE] flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#E0F2FE]">
              <Send className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#0F172A]">15,240</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">Total Alerts Sent</div>
            </div>
          </div>

          <div className="bg-[#F0FDF4] rounded-xl p-4 border border-[#DCFCE7] flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#DCFCE7]">
              <Check className="w-5 h-5 text-[#22C55E]" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#0F172A]">98.4%</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">Delivery Rate</div>
            </div>
          </div>

          <div className="bg-[#FEFCE8] rounded-xl p-4 border border-[#FEF08A] flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#FEF08A]">
              <Mail className="w-5 h-5 text-[#EAB308]" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#0F172A]">8,124</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">Email Notifications</div>
            </div>
          </div>

          <div className="bg-[#FDF4FF] rounded-xl p-4 border border-[#F3E8FF] flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-[#F3E8FF]">
              <MessageSquare className="w-5 h-5 text-[#A855F7]" />
            </div>
            <div>
              <div className="text-lg font-extrabold text-[#0F172A]">7,116</div>
              <div className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mt-0.5">WhatsApp / SMS Sent</div>
            </div>
          </div>
        </div>

        {/* Tab Row & Actions */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden mb-6">
          <div className="flex justify-between items-center px-6 py-2 border-b border-[#E2E8F0] bg-white">
            <div className="flex gap-6 shrink-0">
              <button 
                onClick={() => setActiveTab('logs')} 
                className={`text-[13px] font-bold py-2.5 border-b-[3px] transition-colors ${activeTab === 'logs' ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
              >
                Sent Logs
              </button>
              <button 
                onClick={() => setActiveTab('templates')} 
                className={`text-[13px] font-bold py-2.5 border-b-[3px] transition-colors ${activeTab === 'templates' ? 'border-[#00A86B] text-[#00A86B]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'}`}
              >
                Triggers & Templates
              </button>
            </div>
          </div>

          {/* Table Area */}
          <div className="overflow-x-auto no-scrollbar">
            {activeTab === 'logs' ? (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                    <th className="p-4 w-28">Log ID</th>
                    <th className="p-4 w-52">Recipient</th>
                    <th className="p-4 w-28">Channel</th>
                    <th className="p-4">Notification Details</th>
                    <th className="p-4 w-32">Status</th>
                    <th className="p-4 w-40">Sent At</th>
                    <th className="p-4 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[#475569]">
                  {filteredLogs.map((item) => (
                    <tr key={item.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 font-semibold text-[#0F172A]">{item.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-[#0F172A]">{item.recipient}</div>
                        <div className="font-sans text-xs font-normal text-[#94A3B8]">{item.email}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0F172A]">
                          {getChannelIcon(item.channel)}
                          {item.channel}
                        </div>
                      </td>
                      <td className="p-4 max-w-[320px]">
                        <div className="font-bold text-[#0F172A] text-sm truncate">{item.title}</div>
                        <div className="text-[#64748B] mt-0.5 text-xs truncate">{item.message}</div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${
                          item.status === 'Delivered' ? 'bg-green-50 text-[#00A86B] border-green-200' :
                          item.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                          'bg-red-50 text-red-500 border-red-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-xs">{item.date}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedLog(item)}
                            className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-slate-50 hover:text-[#0F172A] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteLog(item.id)}
                            className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-400 font-medium">
                        No notification logs found matching search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[10px] uppercase tracking-wider font-bold text-[#64748B]">
                    <th className="p-4 w-60">Template Name</th>
                    <th className="p-4 w-64">Trigger Event</th>
                    <th className="p-4 w-32">Channel</th>
                    <th className="p-4">Message Template</th>
                    <th className="p-4 w-32">Status</th>
                    <th className="p-4 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-[13px] text-[#475569]">
                  {filteredTemplates.map((item) => (
                    <tr key={item.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors">
                      <td className="p-4 font-bold text-[#0F172A]">{item.name}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-[#00A86B] bg-[#E6F5F1] px-2.5 py-1 rounded-lg w-fit">
                          <Settings className="w-3.5 h-3.5" />
                          {item.triggerEvent}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-semibold text-xs text-[#0F172A]">
                          {getChannelIcon(item.channel)}
                          {item.channel}
                        </div>
                      </td>
                      <td className="p-4 max-w-[320px]">
                        {item.subject && (
                          <div className="text-[11px] font-bold text-[#0F172A] mb-0.5 truncate">Subject: {item.subject}</div>
                        )}
                        <div className="text-[#64748B] text-xs leading-relaxed line-clamp-2">{item.message}</div>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => toggleTemplateActive(item.id, item.name)}
                          className={`w-12 h-6 rounded-full transition-all duration-300 relative flex items-center border ${
                            item.active ? 'bg-[#00A86B] border-[#00A86B]' : 'bg-[#CBD5E1] border-[#CBD5E1]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${
                            item.active ? 'translate-x-6' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => openEditTemplate(item)}
                          className="w-8 h-8 rounded-lg border border-[#E2E8F0] flex items-center justify-center text-[#64748B] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                          title="Edit Template"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTemplates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                        No notification templates found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Modal: Send Notification */}
        <AnimatePresence>
          {isSendModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" 
                onClick={() => setIsSendModalOpen(false)} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
              >
                <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                    <Send className="w-5 h-5 text-[#00A86B]" />
                    Send Custom Alert
                  </h2>
                  <button onClick={() => setIsSendModalOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleSendNotification}>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Recipient Type</label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] cursor-pointer">
                          <input 
                            type="radio" 
                            checked={sendForm.recipient === 'All Users'}
                            onChange={() => setSendForm({ ...sendForm, recipient: 'All Users' })}
                            className="accent-[#00A86B]" 
                          />
                          Broadcast (All Users)
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-semibold text-[#475569] cursor-pointer">
                          <input 
                            type="radio" 
                            checked={sendForm.recipient === 'Specific User'}
                            onChange={() => setSendForm({ ...sendForm, recipient: 'Specific User' })}
                            className="accent-[#00A86B]" 
                          />
                          Specific Recipient
                        </label>
                      </div>
                    </div>

                    {sendForm.recipient === 'Specific User' && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Full Name</label>
                          <input 
                            type="text" 
                            required
                            value={sendForm.specificName}
                            onChange={(e) => setSendForm({ ...sendForm, specificName: e.target.value })}
                            placeholder="e.g. Dinesh Tharwani"
                            className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Email Address</label>
                          <input 
                            type="email" 
                            required
                            value={sendForm.specificEmail}
                            onChange={(e) => setSendForm({ ...sendForm, specificEmail: e.target.value })}
                            placeholder="e.g. dinesh@gmail.com"
                            className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]"
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Delivery Channel</label>
                        <select 
                          value={sendForm.channel}
                          onChange={(e) => setSendForm({ ...sendForm, channel: e.target.value as NotificationLog['channel'] })}
                          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white appearance-none"
                        >
                          <option value="Email">Email</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="SMS">SMS</option>
                          <option value="Push">Push Notification</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Subject / Title</label>
                        <input 
                          type="text" 
                          required
                          value={sendForm.title}
                          onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                          placeholder="e.g. Account Verification Pending"
                          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Message Content</label>
                      <textarea 
                        required
                        value={sendForm.message}
                        onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                        placeholder="Write your custom alert content here..."
                        className="w-full h-28 p-3 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end items-center p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] gap-3">
                    <button 
                      type="button"
                      onClick={() => setIsSendModalOpen(false)} 
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-[#00A86B] text-white font-bold text-xs hover:bg-[#009B63] transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Dispatch Alert
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Edit Template */}
        <AnimatePresence>
          {isTemplateModalOpen && editingTemplate && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" 
                onClick={() => {
                  setIsTemplateModalOpen(false);
                  setEditingTemplate(null);
                }} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden z-10"
              >
                <div className="flex justify-between items-center p-5 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                    <Edit2 className="w-4.5 h-4.5 text-[#00A86B]" />
                    Edit Trigger Template
                  </h2>
                  <button 
                    onClick={() => {
                      setIsTemplateModalOpen(false);
                      setEditingTemplate(null);
                    }} 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <form onSubmit={handleEditTemplate}>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Template Name</label>
                      <input 
                        type="text" 
                        required
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">System Trigger Event</label>
                        <input 
                          type="text" 
                          required
                          value={templateForm.triggerEvent}
                          onChange={(e) => setTemplateForm({ ...templateForm, triggerEvent: e.target.value })}
                          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Channel</label>
                        <select 
                          value={templateForm.channel}
                          onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value as Template['channel'] })}
                          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] bg-white appearance-none"
                        >
                          <option value="Email">Email</option>
                          <option value="WhatsApp">WhatsApp</option>
                          <option value="SMS">SMS</option>
                          <option value="Push">Push</option>
                        </select>
                      </div>
                    </div>

                    {templateForm.channel === 'Email' && (
                      <div>
                        <label className="block text-xs font-bold text-[#475569] mb-1.5 uppercase tracking-wide">Email Subject Line</label>
                        <input 
                          type="text" 
                          required
                          value={templateForm.subject}
                          onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                          placeholder="Email subject line..."
                          className="w-full h-10 px-3 rounded-lg border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B]"
                        />
                      </div>
                    )}

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-[#475569] uppercase tracking-wide">Template Body</label>
                        <span className="text-[10px] text-[#94A3B8] font-bold">Use placeholders: &#123;userName&#125;, &#123;balance&#125;, &#123;amount&#125;</span>
                      </div>
                      <textarea 
                        required
                        value={templateForm.message}
                        onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                        className="w-full h-28 p-3 rounded-xl border border-[#E2E8F0] text-xs focus:outline-none focus:border-[#00A86B] resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end items-center p-5 border-t border-[#E2E8F0] bg-[#F8FAFC] gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsTemplateModalOpen(false);
                        setEditingTemplate(null);
                      }} 
                      className="px-5 py-2.5 rounded-xl font-bold text-xs text-[#64748B] hover:text-[#0F172A] hover:bg-[#E2E8F0] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2.5 rounded-xl bg-[#00A86B] text-white font-bold text-xs hover:bg-[#009B63] transition-colors shadow-sm"
                    >
                      Save Template
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: View Details Pop-up */}
        <AnimatePresence>
          {selectedLog && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" 
                onClick={() => setSelectedLog(null)} 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 p-6 space-y-4"
              >
                <div className="flex justify-between items-center pb-3 border-b border-[#E2E8F0]">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Log Detail</span>
                    <h3 className="text-base font-bold text-[#0F172A] mt-0.5">{selectedLog.id}</h3>
                  </div>
                  <button onClick={() => setSelectedLog(null)} className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:bg-[#E2E8F0] transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-4 bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Recipient</span>
                      <div className="font-bold text-slate-800 mt-0.5">{selectedLog.recipient}</div>
                      <div className="text-[10px] text-slate-400 font-semibold truncate">{selectedLog.email}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Channel & Status</span>
                      <div className="flex items-center gap-1 mt-1 font-semibold text-slate-700">
                        {getChannelIcon(selectedLog.channel)}
                        {selectedLog.channel}
                      </div>
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase ${
                          selectedLog.status === 'Delivered' ? 'bg-green-50 text-[#00A86B] border-green-200' : 'bg-red-50 text-red-500 border-red-200'
                        }`}>{selectedLog.status}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-1">Title / Subject</span>
                    <div className="font-bold text-slate-800 bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs">{selectedLog.title}</div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[9px] tracking-wider block mb-1">Message Body</span>
                    <div className="text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-3 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line text-xs">
                      {selectedLog.message}
                    </div>
                  </div>

                  <div className="text-[10px] text-slate-400 text-right font-semibold pt-1">
                    Dispatched on: {selectedLog.date}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm"
                  >
                    Close View
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Success / Info Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-4 right-4 z-[120] bg-[#0F172A] text-white px-4 py-2.5 rounded-xl border border-[#1E293B] shadow-xl text-xs font-semibold flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AdminLayout>
  );
}
