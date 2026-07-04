import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { MapPin, Package, Calendar as CalendarIcon, CheckCircle2, Navigation, Loader2, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export interface TrackingEvent {
  id: number;
  date: string;
  time: string;
  status: string;
  desc: string;
  location: string;
  active: boolean;
}

export interface TrackingData {
  awb: string;
  orderId: string;
  orderDate: string;
  paymentMode: string;
  orderAmount: number;
  currentStatus: string;
  estimatedDelivery: string;
  courierName: string;
  courierLogo: string;
  events: TrackingEvent[];
}

// Simulated API Service
const fetchTrackingData = async (awbNumber: string): Promise<TrackingData> => {
  // Simulate network delay for backend integration readiness
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Return mocked data structure that matches expected API response
  return {
    awb: awbNumber,
    orderId: '98765432187654',
    orderDate: '15 Feb, 2023',
    paymentMode: 'Prepaid',
    orderAmount: 1245.00,
    currentStatus: 'Out for Delivery',
    estimatedDelivery: 'Sat, 18 February',
    courierName: 'Delhivery Surface',
    courierLogo: '/brands/delhivery.png',
    events: [
      { id: 1, date: '18 Feb 2026', time: '10:30 AM', status: 'Out for Delivery', desc: 'Shipment is out for delivery.', location: 'Gurugram, Haryana', active: true },
      { id: 2, date: '17 Feb 2026', time: '08:45 PM', status: 'Arrived at Facility', desc: 'Shipment arrived at the final delivery facility.', location: 'Gurugram, Haryana', active: false },
      { id: 3, date: '16 Feb 2026', time: '11:20 AM', status: 'In Transit', desc: 'Shipment is in transit to the destination.', location: 'New Delhi, Hub', active: false },
      { id: 4, date: '15 Feb 2026', time: '06:15 PM', status: 'Picked Up', desc: 'Shipment picked up from origin.', location: 'Noida, Uttar Pradesh', active: false },
      { id: 5, date: '15 Feb 2026', time: '02:30 PM', status: 'Order Manifested', desc: 'Manifest generated for the order.', location: 'Noida, Uttar Pradesh', active: false },
    ]
  };
};

export function AdminTracking() {
  const location = useLocation();
  const [awb, setAwb] = useState(location.state?.awb || '');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (location.state?.awb) {
      setAwb(location.state.awb);
      handleTrack(location.state.awb);
    }
  }, [location.state?.awb]);

  const handleTrack = async (trackingAwb: string = awb) => {
    if (!trackingAwb.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTrackingData(trackingAwb);
      setTrackingData(data);
    } catch (err) {
      setError('Failed to fetch tracking details. Please check the AWB number and try again.');
      setTrackingData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-[1400px] mx-auto py-2 space-y-5">
        
        {/* Search Header */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] p-5 flex flex-col md:flex-row items-center gap-5">
          <div className="flex items-center shrink-0 pr-4 border-r border-[#E2E8F0]">
            <img src="/logo-color.png" alt="Quickpost" className="h-7" />
          </div>
          
          <div className="flex-1 w-full">
            <div className="relative flex items-center">
              <input 
                type="text" 
                value={awb}
                onChange={(e) => setAwb(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="Track your shipment by entering AWB number..." 
                className="w-full h-11 pl-4 pr-32 border border-[#E2E8F0] rounded-lg text-[14px] text-[#0F172A] font-medium focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B] shadow-inner bg-[#F8FAFC]/50"
              />
              <button 
                onClick={() => handleTrack()}
                disabled={isLoading}
                className="absolute right-1.5 h-8 px-5 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-md transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Track
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && !trackingData && (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 flex flex-col items-center justify-center text-[#64748B]">
            <Loader2 className="w-8 h-8 animate-spin text-[#00A86B] mb-4" />
            <p className="font-medium">Fetching tracking details...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium text-sm">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {trackingData && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left Column: Order Details */}
            <div className="lg:col-span-3 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] h-fit overflow-hidden">
              <div className="px-5 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/50 flex items-center gap-2">
                <Package className="w-4 h-4 text-[#64748B]" />
                <h2 className="text-[14px] font-bold text-[#0F172A]">Order Overview</h2>
              </div>

              <div className="p-5">
                <div className="space-y-4 mb-5">
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Order ID</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{trackingData.orderId}</p>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Order Placed</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">{trackingData.orderDate}</p>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Payment Mode</p>
                    <span className="px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] text-[11px] font-bold rounded">{trackingData.paymentMode}</span>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#F1F5F9] pb-3">
                    <p className="text-[12px] text-[#64748B] font-medium">Order Amount</p>
                    <p className="text-[13px] font-bold text-[#0F172A]">₹{trackingData.orderAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-[#FFFBEB] border border-[#FEF3C7] rounded-lg p-3">
                  <p className="text-[11px] text-[#B45309] font-medium leading-relaxed mb-2">
                    To take any action and see complete buyer details, please verify yourself.
                  </p>
                  <button className="text-[12px] font-bold text-[#D97706] hover:underline flex items-center gap-1">
                    Verify via OTP <Navigation className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Tracking Details */}
            <div className="lg:col-span-9 bg-white rounded-xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
              
              {/* Status Banner */}
              <div className="bg-gradient-to-r from-[#00A86B]/10 to-[#F0FDF4] border-b border-[#E2E8F0] px-6 py-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00A86B] opacity-40"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00A86B]"></span>
                    </span>
                    <h2 className="text-[18px] font-extrabold text-[#0F172A] tracking-tight">{trackingData.currentStatus}</h2>
                  </div>
                  <p className="text-[13px] text-[#475569] font-medium flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" /> Estimated Delivery: <span className="text-[#0F172A] font-bold">{trackingData.estimatedDelivery}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-3 bg-white px-3 py-2 rounded-lg border border-[#E2E8F0] shadow-sm">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Shipped Via</p>
                    <p className="text-[12px] font-bold text-[#0F172A]">{trackingData.courierName}</p>
                  </div>
                  <div className="w-px h-8 bg-[#E2E8F0]"></div>
                  <img src={trackingData.courierLogo} alt={trackingData.courierName} className="h-6 w-auto object-contain" />
                </div>
              </div>

              {/* Timeline Container */}
              <div className="p-6 flex-1 bg-white">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-[#F1F5F9]">
                  <MapPin className="w-4 h-4 text-[#00A86B]" />
                  <h3 className="text-[14px] font-bold text-[#0F172A]">Tracking Journey</h3>
                </div>

                <div className="pl-2">
                  {trackingData.events.map((event, index, arr) => (
                    <div key={event.id} className="relative flex gap-5 pb-6 last:pb-0">
                      {/* Timeline Line */}
                      {index !== arr.length - 1 && (
                        <div className="absolute left-[9px] top-6 bottom-0 w-px bg-[#E2E8F0]" />
                      )}
                      
                      {/* Timeline Dot */}
                      <div className="relative z-10 mt-1">
                        {event.active ? (
                          <div className="w-5 h-5 rounded-full bg-[#00A86B] flex items-center justify-center shadow-[0_0_0_4px_rgba(0,168,107,0.1)]">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-white border-2 border-[#CBD5E1]" />
                        )}
                      </div>

                      {/* Timeline Content */}
                      <div className={`flex-1 ${event.active ? 'opacity-100' : 'opacity-75'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                          <h4 className={`text-[14px] font-bold ${event.active ? 'text-[#00A86B]' : 'text-[#0F172A]'}`}>
                            {event.status}
                          </h4>
                          <span className="text-[12px] font-semibold text-[#64748B]">
                            {event.date} <span className="font-normal mx-1">•</span> {event.time}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#475569] leading-relaxed mb-1">
                          {event.desc}
                        </p>
                        <p className="text-[12px] font-medium text-[#94A3B8] flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.location}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        )}

      </div>
    </AdminLayout>
  );
}
