import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/layout/AdminLayout';
import { ArrowLeft, Upload, Trash2, Plus, Minus, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  unitPrice: number;
  qty: number;
  tax: number;
}

export function AdminAddOrder() {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: '', unitPrice: 0, qty: 1, tax: 0 }
  ]);

  const [deadWeight, setDeadWeight] = useState<number | string>('');
  const [length, setLength] = useState<number | string>('');
  const [width, setWidth] = useState<number | string>('');
  const [height, setHeight] = useState<number | string>('');

  const [paymentMode, setPaymentMode] = useState('');
  const [billingSame, setBillingSame] = useState(true);

  // Computations
  const subTotal = products.reduce((sum, p) => sum + (p.unitPrice * p.qty), 0);
  const otherCharges = 0;
  const totalOrderValue = subTotal + otherCharges;

  const l = Number(length) || 0;
  const w = Number(width) || 0;
  const h = Number(height) || 0;
  const volWeight = (l * w * h) / 5000;
  const dWeight = Number(deadWeight) || 0;
  const applicableWeight = Math.max(dWeight, volWeight, 0.5); // Min 0.5kg

  const handleAddProduct = () => {
    setProducts([...products, { id: Math.random().toString(), name: '', unitPrice: 0, qty: 1, tax: 0 }]);
  };

  const handleRemoveProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto pb-6 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/admin/dashboard" className="flex items-center gap-2 text-[#0F172A] font-bold text-[15px] hover:text-[#00A86B] transition-colors">
            <ArrowLeft className="w-5 h-5" />
            Add Order
          </Link>
          <button className="flex items-center gap-2 h-9 px-4 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-full transition-colors shadow-sm">
            <Upload className="w-4 h-4" /> Bulk Upload
          </button>
        </div>

        <div className="space-y-6">
          
          {/* Pickup Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Pickup Details</h2>
            </div>
            <div className="p-6">
              <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Address</label>
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 relative">
                  <select className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] text-[#475569] font-medium appearance-none focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]">
                    <option>GC Industries | Factory no 8, Opp shree Ram Darbar mandir, Housing board colony Ambala cantt, Ambala, 133001</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button className="text-[13px] font-bold text-[#2563EB] hover:underline whitespace-nowrap">
                  + Add new pickup address
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Delivery Details</h2>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Contact Name <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter Contact Name" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Email <span className="text-red-500">*</span></label>
                  <input type="email" placeholder="Enter Contact Name" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                  <div className="flex relative">
                    <select className="h-11 w-20 pl-3 pr-6 border border-[#E2E8F0] rounded-l-lg border-r-0 bg-[#F8FAFC] text-[13px] text-[#475569] font-medium appearance-none focus:outline-none">
                      <option>+91</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute left-14 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="text" placeholder="Enter Phone Number" className="flex-1 h-11 px-4 border border-[#E2E8F0] rounded-r-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Address <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter Address" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Pincode <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Enter Pincode" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">City <span className="text-red-500">*</span></label>
                      <select className="w-full h-11 pl-4 pr-8 border border-[#E2E8F0] rounded-lg text-[13px] text-[#94A3B8] appearance-none focus:outline-none">
                        <option>Enter City</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-2.5 bottom-3.5 pointer-events-none" />
                    </div>
                    <div className="relative">
                      <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">State <span className="text-red-500">*</span></label>
                      <select className="w-full h-11 pl-4 pr-8 border border-[#E2E8F0] rounded-lg text-[13px] text-[#94A3B8] appearance-none focus:outline-none">
                        <option>Enter State</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-2.5 bottom-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" checked={billingSame} onChange={(e) => setBillingSame(e.target.checked)} className="w-4 h-4 rounded border-[#CBD5E1] text-[#00A86B] focus:ring-[#00A86B]" />
                <span className="text-[13px] text-[#64748B] font-medium">Billing Details are same as Delivery Details</span>
              </label>
            </div>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Product Details</h2>
            </div>
            <div className="p-6 space-y-5">
              
              {products.map((product, index) => (
                <div key={product.id} className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1">
                    {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Product Name</label>}
                    <input 
                      type="text" 
                      placeholder="Enter or search your product name" 
                      className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" 
                    />
                  </div>
                  
                  <div className="w-[140px]">
                    {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Unit Price</label>}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#94A3B8]">₹</span>
                      <input 
                        type="number" 
                        value={product.unitPrice || ''}
                        onChange={(e) => updateProduct(product.id, 'unitPrice', Number(e.target.value))}
                        placeholder="0.00" 
                        className="w-full h-11 pl-8 pr-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" 
                      />
                    </div>
                  </div>

                  <div className="w-[120px]">
                    {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Qty</label>}
                    <div className="flex h-11 border border-[#E2E8F0] rounded-lg overflow-hidden">
                      <button 
                        onClick={() => updateProduct(product.id, 'qty', Math.max(1, product.qty - 1))}
                        className="w-10 flex items-center justify-center bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] transition-colors border-r border-[#E2E8F0]"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input 
                        type="text" 
                        value={product.qty}
                        readOnly
                        className="flex-1 w-full text-center text-[13px] font-medium text-[#0F172A] focus:outline-none" 
                      />
                      <button 
                        onClick={() => updateProduct(product.id, 'qty', product.qty + 1)}
                        className="w-10 flex items-center justify-center bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] transition-colors border-l border-[#E2E8F0]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="w-[140px]">
                    {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Unit Price</label>}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#94A3B8]">₹</span>
                      <input 
                        type="text" 
                        value={(product.unitPrice * product.qty).toFixed(2)}
                        readOnly
                        className="w-full h-11 pl-8 pr-4 border border-[#E2E8F0] bg-[#F8FAFC] rounded-lg text-[13px] text-[#475569] font-medium focus:outline-none cursor-not-allowed" 
                      />
                    </div>
                  </div>

                  <div className="w-[100px]">
                    {index === 0 && <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Tax</label>}
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] font-medium text-[#94A3B8]">%</span>
                      <input 
                        type="number" 
                        placeholder="0.00" 
                        className="w-full h-11 pl-8 pr-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" 
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => handleRemoveProduct(product.id)}
                    className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#EF4444] transition-colors shrink-0 bg-[#FEF2F2] border border-[#FEE2E2]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button 
                onClick={handleAddProduct}
                className="flex items-center gap-1.5 text-[12px] font-bold text-[#00A86B] hover:text-[#009B63] px-3 py-1.5 rounded-full border border-[#00A86B] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Another Product
              </button>

              <div className="pt-4 border-t border-[#E2E8F0]">
                <button className="flex items-center gap-2 text-[13px] font-bold text-[#0F172A]">
                  Add Other Charges & Discount <ChevronDown className="w-4 h-4 text-[#94A3B8]" />
                  <span className="text-[11px] font-medium text-[#94A3B8] font-normal">(Optional)</span>
                </button>
              </div>

              <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] space-y-3">
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#64748B] font-medium">Sub-total for Product</span>
                  <span className="font-bold text-[#0F172A]">₹{subTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-[#64748B] font-medium">Other Charges</span>
                  <span className="font-bold text-[#0F172A]">₹0.00</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-[#E2E8F0] text-[14px]">
                  <span className="font-bold text-[#0F172A]">Total Order Value</span>
                  <span className="font-bold text-[#0F172A]">₹{totalOrderValue.toFixed(2)}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#94A3B8]">Note: All the Prices/Charges are inclusive of GST.</p>
            </div>
          </div>

          {/* Package Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Package Details</h2>
            </div>
            <div className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Package Type:</label>
                  <div className="relative">
                    <select className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] text-[#475569] font-medium appearance-none focus:outline-none">
                      <option>B2C</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Dead Weight:</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={deadWeight}
                      onChange={(e) => setDeadWeight(e.target.value)}
                      placeholder="0" 
                      className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">Kg</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Length:</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="0" 
                      className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Width:</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="0" 
                      className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Height:</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="0" 
                      className="w-full h-11 pl-4 pr-10 border border-[#E2E8F0] rounded-lg text-[13px] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" 
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-medium text-[#94A3B8]">cm</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-[#64748B]">
                <span className="text-red-500 font-bold">Note:</span> The minimum chargeable weight is <span className="font-bold">0.50 Kg.</span> Dimensions should be in <span className="font-bold">centimetres only</span> and value should be greater than <span className="font-bold">0.50 cm.</span>
              </p>

              <div className="bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0]">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[13px] font-bold text-[#0F172A]">Applicable Weight</span>
                  <span className="font-bold text-[#0F172A] text-[13px]">{applicableWeight.toFixed(2)} kg</span>
                </div>
                <p className="text-[11px] text-[#64748B] mb-4">Applicable weight is the heavier among Dead Weight vs Volumetric Weight. Final chargeable weight will be based on the weight slab of the courier selected.</p>
                
                <div className="h-px bg-[#E2E8F0] w-full my-4" />

                <div className="flex justify-between items-center py-2">
                  <span className="text-[13px] font-bold text-[#0F172A]">Volumetric Weight</span>
                  <span className="font-bold text-[#0F172A] text-[13px]">{volWeight.toFixed(2)} Kg</span>
                </div>

                <div className="h-px bg-[#E2E8F0] w-full my-4" />

                <div className="flex justify-between items-center py-2">
                  <span className="text-[13px] font-bold text-[#0F172A]">Total Order Value</span>
                  <span className="font-bold text-[#0F172A] text-[13px]">₹{totalOrderValue.toFixed(2)}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Payment Details</h2>
            </div>
            <div className="p-6">
              <p className="text-[11px] text-[#94A3B8] mb-4">Select Mode of Payment that your buyer has chosen for the order</p>
              
              <div className="flex gap-8 mb-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMode === 'Prepaid' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                    {paymentMode === 'Prepaid' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">Prepaid <span className="font-normal text-[#64748B] text-[11px]">(No Additional charges.)</span></span>
                  <input type="radio" className="hidden" checked={paymentMode === 'Prepaid'} onChange={() => setPaymentMode('Prepaid')} />
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMode === 'COD' ? 'border-[#00A86B]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                    {paymentMode === 'COD' && <div className="w-2 h-2 rounded-full bg-[#00A86B]" />}
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">COD <span className="font-normal text-[#64748B] text-[11px]">(Additional charges may be applicable.)</span></span>
                  <input type="radio" className="hidden" checked={paymentMode === 'COD'} onChange={() => setPaymentMode('COD')} />
                </label>
              </div>

              <button className="flex items-center gap-1.5 text-[12px] font-bold text-[#00A86B] hover:text-[#009B63] transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Shipping Charges, Gift Wrap, Transaction Fee <span className="font-normal text-[#94A3B8]">(Optional)</span>
              </button>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E2E8F0] bg-white flex items-center gap-2 cursor-pointer">
              <h2 className="text-[14px] font-bold text-[#0F172A]">Order Details</h2>
              <ChevronDown className="w-4 h-4 text-[#64748B]" />
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Order tag</label>
                  <input type="text" placeholder="Type and press enter to add tag" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Order ID</label>
                  <input type="text" placeholder="6543217890" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#64748B] mb-1.5">Notes</label>
                  <input type="text" placeholder="Notes" className="w-full h-11 px-4 border border-[#E2E8F0] rounded-lg text-[13px] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#00A86B] focus:ring-1 focus:ring-[#00A86B]" />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions Sticky */}
        <div className="sticky bottom-6 mt-6 bg-white/95 backdrop-blur-md border border-[#E2E8F0] p-4 flex gap-4 z-40 rounded-xl shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.1)]">
          <button className="px-8 h-11 bg-[#00A86B] hover:bg-[#009B63] text-white text-[13px] font-bold rounded-full transition-colors shadow-sm">
            Ship Now
          </button>
          <button className="px-8 h-11 bg-white border border-[#00A86B] text-[#00A86B] hover:bg-[#F0FDF4] text-[13px] font-bold rounded-full transition-colors shadow-sm">
            Add Order
          </button>
        </div>

      </div>
    </AdminLayout>
  );
}
