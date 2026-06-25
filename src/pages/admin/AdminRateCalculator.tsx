import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { HelpCircle, Send, MapPin, Globe2, Package, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminRateCalculator() {
  const [shipmentType, setShipmentType] = useState('Forward');
  const [paymentType, setPaymentType] = useState('Cash on Delivery');
  const [dangerousGoods, setDangerousGoods] = useState('Yes');
  const [isCalculated, setIsCalculated] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = () => {
    setIsCalculating(true);
    // Simulate backend API call delay for production feel
    setTimeout(() => {
      setIsCalculating(false);
      setIsCalculated(true);
    }, 800);
  };

  const handleReset = () => {
    setIsCalculated(false);
    setShipmentType('Forward');
    setPaymentType('Cash on Delivery');
    setDangerousGoods('Yes');
  };

  const scrollbarStyle = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
      border-radius: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #CBD5E1;
      border-radius: 8px;
    }
    .custom-scrollbar:hover::-webkit-scrollbar-thumb {
      background: #94A3B8;
    }
  `;

  return (
    <AdminLayout>
      <style>{scrollbarStyle}</style>
      <div className="w-full max-w-[1400px] mx-auto space-y-6 pb-10">
        
        <h1 className="text-xl font-bold text-[#0F172A] mb-6">Shipping Rate Calculator</h1>

        {/* Top Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Side */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Shipment Type */}
              <div>
                <label className="block text-[13px] font-bold text-[#0F172A] mb-3">Shipment Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${shipmentType === 'Forward' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                      {shipmentType === 'Forward' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </div>
                    <span className="text-[13px] font-medium text-[#475569]">Forward</span>
                    <input type="radio" className="hidden" checked={shipmentType === 'Forward'} onChange={() => setShipmentType('Forward')} />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${shipmentType === 'Return' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                      {shipmentType === 'Return' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </div>
                    <span className="text-[13px] font-medium text-[#475569]">Return</span>
                    <input type="radio" className="hidden" checked={shipmentType === 'Return'} onChange={() => setShipmentType('Return')} />
                  </label>
                </div>
              </div>

              {/* Payment Type */}
              <div>
                <label className="block text-[13px] font-bold text-[#0F172A] mb-3">Payment Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentType === 'Cash on Delivery' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                      {paymentType === 'Cash on Delivery' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </div>
                    <span className="text-[13px] font-medium text-[#475569]">Cash on Delivery</span>
                    <input type="radio" className="hidden" checked={paymentType === 'Cash on Delivery'} onChange={() => setPaymentType('Cash on Delivery')} />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentType === 'Prepaid' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                      {paymentType === 'Prepaid' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </div>
                    <span className="text-[13px] font-medium text-[#475569]">Prepaid</span>
                    <input type="radio" className="hidden" checked={paymentType === 'Prepaid'} onChange={() => setPaymentType('Prepaid')} />
                  </label>
                </div>
              </div>

              {/* Dangerous Goods */}
              <div>
                <label className="block text-[13px] font-bold text-[#0F172A] mb-3">Shipping Dangerous Goods?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${dangerousGoods === 'Yes' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                      {dangerousGoods === 'Yes' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </div>
                    <span className="text-[13px] font-medium text-[#475569]">Yes</span>
                    <input type="radio" className="hidden" checked={dangerousGoods === 'Yes'} onChange={() => setDangerousGoods('Yes')} />
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${dangerousGoods === 'No' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                      {dangerousGoods === 'No' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                    </div>
                    <span className="text-[13px] font-medium text-[#475569]">No</span>
                    <input type="radio" className="hidden" checked={dangerousGoods === 'No'} onChange={() => setDangerousGoods('No')} />
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Pickup Pincode</label>
                <input type="text" placeholder="Enter 6 digit pickup area pincode" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-xl text-[13px] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B]" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Delivery Pincode</label>
                <input type="text" placeholder="Enter 6 digit delivery area pincode" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-xl text-[13px] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B]" />
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Actual Weight</label>
                <input type="text" placeholder="Enter actual weight" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-xl text-[13px] font-medium placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B]" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
              <div className="md:col-span-2">
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Dimensions <span className="font-normal text-[11px]">(optional)</span></label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input type="text" placeholder="0.5" className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">CM</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="text" placeholder="B" className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">CM</span>
                  </div>
                  <div className="relative flex-1">
                    <input type="text" placeholder="H" className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B]" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">CM</span>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-bold text-[#64748B] mb-2">Shipment Value (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#94A3B8]">₹</span>
                  <input type="text" placeholder="1000" className="w-full h-11 pl-8 pr-4 border border-[#E2E8F0] rounded-xl text-[13px] font-medium focus:outline-none focus:border-[#00A86B]" />
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#94A3B8] mb-6">Note: Dimensional value should be greater than 0.5cm</p>

            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                <span className="text-[13px] font-semibold text-[#0F172A]">Volumetric Weight: 0.00 KG</span>
                <HelpCircle className="w-4 h-4 text-[#94A3B8]" />
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                <span className="text-[13px] font-semibold text-[#0F172A]">Applicable Weight: 0.50 KG</span>
                <HelpCircle className="w-4 h-4 text-[#94A3B8]" />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={handleCalculate}
                disabled={isCalculating}
                className="px-8 h-11 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-full transition-colors shadow-sm flex items-center justify-center min-w-[120px] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Calculate'}
              </button>
              <button 
                onClick={handleReset}
                className="px-8 h-11 bg-white border border-[#00A86B] text-[#475569] text-[13px] font-bold rounded-full transition-colors hover:bg-[#F8FAFC]"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Location Graphic Side */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm flex flex-col items-center justify-center">
            
            <div className="w-full relative px-4 py-6">
              {/* Pickup Location Box */}
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] border-dashed rounded-xl p-4 text-center relative z-10 mx-auto max-w-xs">
                <div className="flex items-center justify-center gap-1.5 text-[#2563EB] mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[13px] font-bold">Pickup Location</span>
                </div>
                <div className="text-[12px] text-[#64748B]">Central Delhi</div>
                <div className="text-[14px] font-bold text-[#0F172A]">Delhi</div>
              </div>

              {/* Dotted Line */}
              <div className="absolute left-1/2 top-24 bottom-24 w-0 border-l-2 border-dashed border-[#94A3B8] -translate-x-1/2 z-0"></div>

              {/* Delivery Location Box */}
              <div className="bg-[#F8FAFC] border border-[#CBD5E1] border-dashed rounded-xl p-4 text-center relative z-10 mx-auto max-w-xs mt-12">
                <div className="flex items-center justify-center gap-1.5 text-[#2563EB] mb-1">
                  <MapPin className="w-4 h-4" />
                  <span className="text-[13px] font-bold">Delivery Location</span>
                </div>
                <div className="text-[12px] text-[#64748B]">Mumbai</div>
                <div className="text-[14px] font-bold text-[#0F172A]">Maharashtra</div>
              </div>
            </div>

            {/* Illustration Placeholder */}
            <div className="mt-4 flex justify-center w-full">
              <div className="relative w-48 h-32 flex items-center justify-center">
                <Globe2 className="w-24 h-24 text-[#E2E8F0] absolute" />
                <div className="absolute left-0 bottom-4 w-8 h-8 bg-[#D1FAE5] rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#00A86B]" />
                </div>
                <div className="absolute right-2 top-2 w-8 h-8 bg-[#D1FAE5] rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#00A86B]" />
                </div>
                <div className="absolute right-10 bottom-0 w-8 h-8 bg-[#D1FAE5] rounded-full flex items-center justify-center">
                  <Package className="w-4 h-4 text-[#00A86B]" />
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Middle Section (Conditionally Rendered) */}
        <AnimatePresence>
          {isCalculated && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -20 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="flex flex-col gap-6 overflow-hidden"
            >
          
          {/* Order Details Horizontal Card */}
          <div className="w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC]/50 flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Order Overview</h3>
            </div>
            <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-6 bg-white">
              <div>
                <p className="text-[12px] text-[#64748B] mb-1.5 font-medium">Pick up from</p>
                <p className="text-[14px] font-bold text-[#0F172A]">127021, Haryana</p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1.5 font-medium">Deliver to</p>
                <p className="text-[14px] font-bold text-[#0F172A]">479374, Chhattisgarh</p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1.5 font-medium">Order Value</p>
                <p className="text-[14px] font-bold text-[#0F172A]">₹ 1,100.00</p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1.5 font-medium">Payment Mode</p>
                <p className="text-[14px] font-bold text-[#0F172A] px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded inline-block">COD</p>
              </div>
              <div>
                <p className="text-[12px] text-[#64748B] mb-1.5 font-medium">Applicable Weight</p>
                <p className="text-[14px] font-bold text-[#0F172A]">0.5 kg</p>
              </div>
            </div>
          </div>

          {/* Courier List */}
          <div className="w-full bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]/50">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Select Courier Partner</h3>
              <select className="h-10 px-4 border border-[#E2E8F0] rounded-xl text-[13px] font-bold text-[#0F172A] outline-none focus:border-[#00A86B] min-w-[240px] bg-white shadow-sm cursor-pointer hover:border-[#CBD5E1] transition-colors">
                <option>Sort By: Recommendation</option>
                <option>Sort By: Lowest Price</option>
                <option>Sort By: Fastest Delivery</option>
              </select>
            </div>
            
            <div className="overflow-x-auto overflow-y-auto max-h-[500px] custom-scrollbar">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    <th className="py-4 px-5 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Courier partner</th>
                    <th className="py-4 px-5 text-center text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Rating</th>
                    <th className="py-4 px-5 text-center text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Expected Pickup</th>
                    <th className="py-4 px-5 text-center text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Estimated Delivery</th>
                    <th className="py-4 px-5 text-center text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Chargeable Weight</th>
                    <th className="py-4 px-5 text-center text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Charges</th>
                    <th className="py-4 px-5 text-right text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {/* Row 1 - Recommended */}
                  <tr className="bg-white relative">
                    <td className="py-5 px-5">
                      <div className="absolute top-0 left-5 px-2 py-0.5 bg-[#1D4ED8] text-white text-[10px] font-bold rounded-b flex items-center gap-1 shadow-sm">
                        <span className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">★</span> Recommended
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">DELHIVERY</span>
                        </div>
                        <div>
                          <div className="font-bold text-[14px] text-[#0F172A]">Delhivery Surface</div>
                          <div className="text-[12px] text-[#64748B]">Surface | Min-weight: <span className="font-bold text-[#0F172A]">0.5 Kg</span></div>
                          <div className="text-[12px] text-[#64748B]">RTO Charges: <span className="font-bold text-[#0F172A]">₹71</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#FBBF24] border-l-[#E2E8F0] flex items-center justify-center">
                          <span className="text-[14px] font-bold text-[#0F172A]">3.3</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">Tomorrow</td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium flex items-center justify-center gap-1">13th Apr 2028 <HelpCircle className="w-3 h-3 text-[#94A3B8]" /></td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">0.5 kg</td>
                    <td className="py-5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[14px] font-bold text-[#00A86B]">
                        ₹876.00 <HelpCircle className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                    </td>
                    <td className="py-5 px-5 text-right">
                      <button className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-[13px] font-bold rounded-full transition-colors flex items-center gap-2 ml-auto shadow-sm">
                        Ship <Send className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 2 - Recommended */}
                  <tr className="bg-white relative">
                    <td className="py-5 px-5">
                      <div className="absolute top-0 left-5 px-2 py-0.5 bg-[#1D4ED8] text-white text-[10px] font-bold rounded-b flex items-center gap-1 shadow-sm">
                        <span className="w-3 h-3 bg-white/20 rounded-full flex items-center justify-center">★</span> Recommended
                      </div>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">DELHIVERY</span>
                        </div>
                        <div>
                          <div className="font-bold text-[14px] text-[#0F172A]">Delhivery Surface</div>
                          <div className="text-[12px] text-[#64748B]">Surface | Min-weight: <span className="font-bold text-[#0F172A]">0.5 Kg</span></div>
                          <div className="text-[12px] text-[#64748B]">RTO Charges: <span className="font-bold text-[#0F172A]">₹71</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#FBBF24] border-l-[#E2E8F0] flex items-center justify-center">
                          <span className="text-[14px] font-bold text-[#0F172A]">3.3</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">Tomorrow</td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium flex items-center justify-center gap-1">13th Apr 2028 <HelpCircle className="w-3 h-3 text-[#94A3B8]" /></td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">0.5 kg</td>
                    <td className="py-5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[14px] font-bold text-[#00A86B]">
                        ₹876.00 <HelpCircle className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                    </td>
                    <td className="py-5 px-5 text-right">
                      <button className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-[13px] font-bold rounded-full transition-colors flex items-center gap-2 ml-auto shadow-sm">
                        Ship <Send className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 3 */}
                  <tr className="bg-white">
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">DELHIVERY</span>
                        </div>
                        <div>
                          <div className="font-bold text-[14px] text-[#0F172A]">Delhivery Surface</div>
                          <div className="text-[12px] text-[#64748B]">Surface | Min-weight: <span className="font-bold text-[#0F172A]">0.5 Kg</span></div>
                          <div className="text-[12px] text-[#64748B]">RTO Charges: <span className="font-bold text-[#0F172A]">₹71</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#FBBF24] border-l-[#E2E8F0] flex items-center justify-center">
                          <span className="text-[14px] font-bold text-[#0F172A]">3.3</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">Tomorrow</td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium flex items-center justify-center gap-1">13th Apr 2028 <HelpCircle className="w-3 h-3 text-[#94A3B8]" /></td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">0.5 kg</td>
                    <td className="py-5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[14px] font-bold text-[#00A86B]">
                        ₹876.00 <HelpCircle className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                    </td>
                    <td className="py-5 px-5 text-right">
                      <button className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-[13px] font-bold rounded-full transition-colors flex items-center gap-2 ml-auto shadow-sm">
                        Ship <Send className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Row 4 */}
                  <tr className="bg-white">
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">DELHIVERY</span>
                        </div>
                        <div>
                          <div className="font-bold text-[14px] text-[#0F172A]">Delhivery Surface</div>
                          <div className="text-[12px] text-[#64748B]">Surface | Min-weight: <span className="font-bold text-[#0F172A]">0.5 Kg</span></div>
                          <div className="text-[12px] text-[#64748B]">RTO Charges: <span className="font-bold text-[#0F172A]">₹71</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#FBBF24] border-l-[#E2E8F0] flex items-center justify-center">
                          <span className="text-[14px] font-bold text-[#0F172A]">3.3</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">Tomorrow</td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium flex items-center justify-center gap-1">13th Apr 2028 <HelpCircle className="w-3 h-3 text-[#94A3B8]" /></td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">0.5 kg</td>
                    <td className="py-5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[14px] font-bold text-[#00A86B]">
                        ₹876.00 <HelpCircle className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                    </td>
                    <td className="py-5 px-5 text-right">
                      <button className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-[13px] font-bold rounded-full transition-colors flex items-center gap-2 ml-auto shadow-sm">
                        Ship <Send className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 5 */}
                  <tr className="bg-white">
                    <td className="py-5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center shrink-0">
                          <span className="text-white text-[10px] font-bold">DELHIVERY</span>
                        </div>
                        <div>
                          <div className="font-bold text-[14px] text-[#0F172A]">Delhivery Surface</div>
                          <div className="text-[12px] text-[#64748B]">Surface | Min-weight: <span className="font-bold text-[#0F172A]">0.5 Kg</span></div>
                          <div className="text-[12px] text-[#64748B]">RTO Charges: <span className="font-bold text-[#0F172A]">₹71</span></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5">
                      <div className="flex justify-center">
                        <div className="w-12 h-12 rounded-full border-4 border-[#FBBF24] border-l-[#E2E8F0] flex items-center justify-center">
                          <span className="text-[14px] font-bold text-[#0F172A]">3.3</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">Tomorrow</td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium flex items-center justify-center gap-1">13th Apr 2028 <HelpCircle className="w-3 h-3 text-[#94A3B8]" /></td>
                    <td className="py-5 px-5 text-center text-[13px] text-[#475569] font-medium">0.5 kg</td>
                    <td className="py-5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1 text-[14px] font-bold text-[#00A86B]">
                        ₹876.00 <HelpCircle className="w-3 h-3 text-[#94A3B8]" />
                      </div>
                    </td>
                    <td className="py-5 px-5 text-right">
                      <button className="px-5 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-[13px] font-bold rounded-full transition-colors flex items-center gap-2 ml-auto shadow-sm">
                        Ship <Send className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Terms */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
          <h3 className="text-[15px] font-bold text-[#0F172A] mb-4">Important Terms</h3>
          <ol className="list-decimal list-inside text-[12px] text-[#64748B] space-y-1.5 leading-relaxed">
            <li>Above mentioned prices are inclusive of GST.</li>
            <li>Fixed COD charge or COD % of the order value whichever is higher will be considered while calculating the COD fee.</li>
            <li>The above pricing is subject to change based on fuel surcharges and courier company base rates.</li>
            <li>Dead/Dry weight or volumetric weight whichever is higher will be considered while calculating the freight charges.</li>
            <li>Volumetric weight is calculated L x W x H (in cms) / 5000 for all courier companies. In case of Ecom Express EGS Shipments it is L x W x H (in cms) / 4500.</li>
            <li>RTO (return to origin) shipment will be charged differently from the forward delivery rate.</li>
            <li>Pickup services may face issues due to operational concerns of the courier company.</li>
            <li>Return charges may apply over and above the freight fee in case of Ecom Express.</li>
            <li>Other Charges like Octroi charges, State Entry Tax and Fees, Address Correction charges if applicable shall be charged extra.</li>
            <li>Billing issues should be escalated within 7 days from the date of invoice.</li>
            <li>Lost or damaged products claims will be handled as per the carrier terms and conditions.</li>
            <li>The Customer/Seller shall not book/handover or allows to be handed over any Product which is banned, restricted, illegal, prohibited, stolen, infringing of any third-party rights, liquid materials, hazardous or dangerous or in breach of any law or regulation in force in India for the purpose of the logistics or delivery services.</li>
            <li>Additional government rules and norms can be applicable while shipping to certain states and subject to change without prior intimation and will abide by them.</li>
            <li>Detailed terms and conditions can be reviewed on Shipex's Terms of services.</li>
            <li>For any queries reach out to us at https://carrier.shipex.in/support or write to us at support@shipex.in.</li>
          </ol>
        </div>

      </div>
    </AdminLayout>
  );
}
