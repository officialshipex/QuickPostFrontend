import React, { useState } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { Search, MapPin, Package, Truck, CheckCircle2, Clock, RefreshCcw, AlertCircle } from 'lucide-react';

interface TrackingEvent { time: string; location: string; status: string; description: string; done: boolean; }
interface TrackingResult { awb: string; courier: string; status: string; customer: string; origin: string; destination: string; estimatedDelivery: string; events: TrackingEvent[]; }

const MOCK_TRACKING: Record<string, TrackingResult> = {
  'DEL1234567890': {
    awb: 'DEL1234567890', courier: 'Delhivery', status: 'Delivered',
    customer: 'Rahul Sharma', origin: 'Mumbai Hub', destination: 'Delhi - 110001',
    estimatedDelivery: '12 Jun 2026',
    events: [
      { time: '12 Jun, 03:45 PM', location: 'Delhi, Lajpat Nagar', status: 'Delivered', description: 'Package delivered to Rahul Sharma', done: true },
      { time: '12 Jun, 09:20 AM', location: 'Delhi Distribution Center', status: 'Out For Delivery', description: 'Shipment out for delivery', done: true },
      { time: '11 Jun, 08:00 PM', location: 'Delhi Hub', status: 'In Transit', description: 'Arrived at destination city hub', done: true },
      { time: '10 Jun, 11:30 PM', location: 'Mumbai Hub', status: 'In Transit', description: 'Departed from origin hub', done: true },
      { time: '10 Jun, 05:00 PM', location: 'Mumbai Hub', status: 'Picked Up', description: 'Package picked up from seller', done: true },
    ]
  },
  'BDT9876543210': {
    awb: 'BDT9876543210', courier: 'Bluedart', status: 'In Transit',
    customer: 'Priya Singh', origin: 'Ahmedabad Hub', destination: 'Bengaluru - 560001',
    estimatedDelivery: '15 Jun 2026',
    events: [
      { time: '13 Jun, 02:00 PM', location: 'Mumbai Sorting Facility', status: 'In Transit', description: 'Package in transit to next hub', done: true },
      { time: '12 Jun, 08:00 PM', location: 'Ahmedabad Hub', status: 'In Transit', description: 'Departed from origin hub', done: true },
      { time: '12 Jun, 03:00 PM', location: 'Ahmedabad Hub', status: 'Picked Up', description: 'Package picked up from seller', done: true },
      { time: '—', location: 'Bengaluru Hub', status: 'In Transit', description: 'Expected arrival at destination hub', done: false },
      { time: '—', location: 'Bengaluru, Indiranagar', status: 'Delivered', description: 'Expected delivery', done: false },
    ]
  },
};

const RECENT_SEARCHES = ['DEL1234567890', 'BDT9876543210', 'XPB1122334455'];

const STATUS_COLOR: Record<string, string> = {
  'Delivered': 'bg-green-100 text-green-700',
  'In Transit': 'bg-orange-100 text-orange-700',
  'Out For Delivery': 'bg-teal-100 text-teal-700',
  'Picked Up': 'bg-purple-100 text-purple-700',
  'Pending Pickup': 'bg-blue-100 text-blue-700',
};

const EVENT_ICON: Record<string, React.ReactNode> = {
  'Delivered': <CheckCircle2 className="w-4 h-4 text-green-500" />,
  'Out For Delivery': <MapPin className="w-4 h-4 text-teal-500" />,
  'In Transit': <Truck className="w-4 h-4 text-orange-500" />,
  'Picked Up': <Package className="w-4 h-4 text-purple-500" />,
};

export function Tracking() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = (awb?: string) => {
    const q = (awb || query).trim().toUpperCase();
    if (!q) return;
    setLoading(true);
    setNotFound(false);
    setTimeout(() => {
      const found = MOCK_TRACKING[awb || query.trim()];
      setResult(found || null);
      setNotFound(!found);
      setLoading(false);
    }, 600);
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Shipment Tracking</h1>
        <p className="text-sm text-[#64748B] mt-0.5">Track any shipment by AWB or order ID</p>
      </div>

      {/* Search Box */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 mb-6">
        <div className="flex gap-3">
          <div className="flex-1 flex items-center gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full px-4 h-12">
            <Search className="w-5 h-5 text-[#94A3B8] shrink-0" />
            <input
              type="text"
              placeholder="Enter AWB number or Order ID (e.g. DEL1234567890)"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] w-full"
            />
          </div>
          <button onClick={() => handleSearch()} className="px-6 h-12 rounded-full bg-[#00A86B] text-white text-sm font-semibold hover:bg-[#009B63] transition-colors shadow-sm">
            {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div> : 'Track'}
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-[#94A3B8]">Recent:</span>
          {RECENT_SEARCHES.map(awb => (
            <button key={awb} onClick={() => { setQuery(awb); handleSearch(awb); }}
              className="text-xs font-mono text-[#00A86B] hover:underline">{awb}</button>
          ))}
        </div>
      </div>

      {/* Not Found */}
      {notFound && (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 text-center">
          <AlertCircle className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
          <h3 className="font-bold text-[#0F172A] text-lg">No tracking info found</h3>
          <p className="text-sm text-[#64748B] mt-1">The AWB number you entered doesn't match any shipment. Please check and try again.</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Shipment Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-xs text-[#64748B] font-medium">AWB Number</div>
                  <div className="font-mono font-bold text-[#0F172A] text-sm mt-0.5">{result.awb}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[result.status] || 'bg-gray-100 text-gray-700'}`}>{result.status}</span>
              </div>
              <div className="space-y-3 text-xs">
                {[
                  { label: 'Courier', value: result.courier },
                  { label: 'Customer', value: result.customer },
                  { label: 'Origin', value: result.origin },
                  { label: 'Destination', value: result.destination },
                  { label: 'Est. Delivery', value: result.estimatedDelivery },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-[#64748B] font-medium">{label}</span>
                    <span className="text-[#0F172A] font-semibold text-right max-w-[60%]">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Route visual */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
              <div className="text-xs font-bold text-[#0F172A] mb-3">Route</div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#00A86B]/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-[#00A86B]" />
                  </div>
                  <div className="text-[10px] font-semibold text-[#0F172A] mt-1 text-center max-w-[60px]">{result.origin.split(' ')[0]}</div>
                </div>
                <div className="flex-1 h-0.5 bg-gradient-to-r from-[#00A86B] to-[#007BFF] rounded-full"></div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-[10px] font-semibold text-[#0F172A] mt-1 text-center max-w-[60px]">{result.destination.split(' ')[0]}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Timeline */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <div className="font-bold text-[#0F172A] text-sm mb-5">Tracking Timeline</div>
            <div className="space-y-0">
              {result.events.map((event, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {/* Line */}
                  {idx < result.events.length - 1 && (
                    <div className={`absolute left-4 top-8 w-0.5 h-full -translate-x-1/2 ${event.done ? 'bg-[#00A86B]' : 'bg-[#E2E8F0]'}`}></div>
                  )}
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border-2 z-10 ${event.done ? 'border-[#00A86B] bg-white' : 'border-[#E2E8F0] bg-[#F8FAFC]'}`}>
                    {event.done ? (EVENT_ICON[event.status] || <Clock className="w-4 h-4 text-[#94A3B8]" />) : <div className="w-2 h-2 rounded-full bg-[#E2E8F0]"></div>}
                  </div>
                  {/* Content */}
                  <div className={`pb-6 ${event.done ? '' : 'opacity-50'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${event.done ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{event.status}</span>
                      {idx === 0 && event.done && <span className="px-1.5 py-0.5 bg-[#00A86B]/10 text-[#00A86B] text-[10px] font-bold rounded-full">Latest</span>}
                    </div>
                    <div className="text-xs text-[#64748B] mt-0.5">{event.description}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-semibold text-[#10B981]">{event.location}</span>
                      <span className="text-[10px] text-[#94A3B8]">{event.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Default prompt if nothing searched */}
      {!result && !notFound && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { awb: 'DEL1234567890', status: 'Delivered', customer: 'Rahul Sharma', courier: 'Delhivery' },
            { awb: 'BDT9876543210', status: 'In Transit', customer: 'Priya Singh', courier: 'Bluedart' },
            { awb: 'XPB1122334455', status: 'Pending Pickup', customer: 'Amit Kumar', courier: 'XpressBees' },
          ].map(item => (
            <div key={item.awb} onClick={() => { setQuery(item.awb); handleSearch(item.awb); }}
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 cursor-pointer hover:border-[#00A86B] hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-3">
                <span className="font-mono text-xs font-bold text-[#0F172A]">{item.awb}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[item.status] || 'bg-gray-100 text-gray-700'}`}>{item.status}</span>
              </div>
              <div className="text-xs text-[#64748B]">{item.customer} · {item.courier}</div>
              <div className="text-xs text-[#00A86B] font-semibold mt-2 group-hover:underline">Click to track →</div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
