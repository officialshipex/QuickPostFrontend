import React from 'react';
import { UserPlus, Truck, Package, AlertTriangle, IndianRupee, TicketCheck, ShieldAlert } from 'lucide-react';

const ACTIVITIES = [
  { id: 1, title: 'New Seller Registered', desc: 'Fashion Hub completed KYC verification.', time: '10 mins ago', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50' },
  { id: 2, title: 'Courier API Alert', desc: 'Bluedart API experiencing high latency.', time: '45 mins ago', icon: ShieldAlert, color: 'text-red-500', bg: 'bg-red-50' },
  { id: 3, title: 'COD Settled', desc: '₹12.4L settled for 45 vendors.', time: '2 hrs ago', icon: IndianRupee, color: 'text-green-500', bg: 'bg-green-50' },
  { id: 4, title: 'NDR Escalation', desc: 'Vendor escalated 12 NDR cases.', time: '3 hrs ago', icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-50' },
  { id: 5, title: 'Ticket Closed', desc: 'Support closed ticket #1042.', time: '4 hrs ago', icon: TicketCheck, color: 'text-purple-500', bg: 'bg-purple-50' },
  { id: 6, title: 'Courier Added', desc: 'Shadowfax Air integration successful.', time: '5 hrs ago', icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { id: 7, title: 'Large Shipment Spike', desc: 'Order volume exceeded 5k/hr.', time: '6 hrs ago', icon: Package, color: 'text-teal-500', bg: 'bg-teal-50' },
];

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm h-full flex flex-col">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-sm text-[#0F172A]">Recent Activity</h3>
        <span className="text-xs font-semibold text-[#00A86B] cursor-pointer hover:underline">View Audit Logs</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '400px' }}>
        <div className="relative border-l-2 border-[#E2E8F0] ml-4 space-y-6">
          {ACTIVITIES.map((activity) => (
            <div key={activity.id} className="relative pl-6">
              <div className={`absolute -left-[13px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white ${activity.bg}`}>
                <activity.icon className={`w-3 h-3 ${activity.color}`} />
              </div>
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-[#0F172A]">{activity.title}</span>
                  <span className="text-[10px] text-[#94A3B8] font-medium">{activity.time}</span>
                </div>
                <p className="text-[11px] text-[#64748B]">{activity.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
