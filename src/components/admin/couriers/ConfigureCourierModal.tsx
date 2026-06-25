import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Key, Mail, User, Hash, Clock, Box, ShieldCheck, ArrowRight } from 'lucide-react';

interface Courier {
  id: number;
  name: string;
  logo: string;
  type: string;
}

interface ConfigureCourierModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: Courier | null;
}

const getFieldsForCourier = (name: string) => {
  const n = name.toLowerCase();
  
  const defaultFields = [
    { id: 'name', label: 'Account Name', type: 'text', placeholder: 'e.g. Primary Account', icon: Box },
    { id: 'days', label: 'Expected Delivery (Days)', type: 'number', placeholder: 'e.g. 3', icon: Clock },
  ];

  if (['delhivery', 'shadowfax', 'amazon shipping'].includes(n)) {
    return [
      ...defaultFields,
      { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter your API Key', icon: Key },
    ];
  }
  if (['dtdc'].includes(n)) {
    return [
      ...defaultFields,
      { id: 'api', label: 'API Key', type: 'password', placeholder: 'Enter API Key', icon: Key },
      { id: 'user', label: 'Username', type: 'text', placeholder: 'Enter Username', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password', icon: ShieldCheck },
      { id: 'token', label: 'Token', type: 'password', placeholder: 'Enter Token', icon: Hash },
    ];
  }
  if (['xpressbees'].includes(n)) {
    return [
      ...defaultFields,
      { id: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter Email', icon: Mail },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password', icon: ShieldCheck },
    ];
  }
  if (['shiprocket', 'shree maruti', 'lousung360'].includes(n)) {
    return [
      ...defaultFields,
      { id: 'userEmail', label: 'User / Email', type: 'text', placeholder: 'Enter User or Email', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password', icon: ShieldCheck },
    ];
  }
  if (['ekart'].includes(n)) {
    return [
      ...defaultFields,
      { id: 'userEmail', label: 'User / Email', type: 'text', placeholder: 'Enter User or Email', icon: User },
      { id: 'password', label: 'Password', type: 'password', placeholder: 'Enter Password', icon: ShieldCheck },
      { id: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter Client ID', icon: Hash },
    ];
  }
  return [
    ...defaultFields,
    { id: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Enter API Key', icon: Key },
  ];
};

export function ConfigureCourierModal({ isOpen, onClose, courier }: ConfigureCourierModalProps) {
  if (!courier) return null;

  const fields = getFieldsForCourier(courier.name);

  // Motion variants for macOS feel
  const overlayVariants = {
    hidden: { opacity: 0, backdropFilter: 'blur(0px)' },
    visible: { opacity: 1, backdropFilter: 'blur(8px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
    exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const } }
  } as const;

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.96, y: 16 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        type: "spring" as const, 
        stiffness: 400, 
        damping: 32, 
        mass: 0.8,
        staggerChildren: 0.04,
        delayChildren: 0.1
      } 
    },
    exit: { 
      opacity: 0, 
      scale: 0.96, 
      y: 12, 
      transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } 
    }
  } as const;

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-[#0F172A]/20 pointer-events-auto"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-[520px] bg-[#ffffff]/90 backdrop-blur-2xl border border-white/60 shadow-[0_40px_80px_-16px_rgba(0,0,0,0.16),0_0_0_1px_rgba(0,0,0,0.04)] rounded-[28px] pointer-events-auto overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-7 py-6 border-b border-[#E2E8F0]/60 flex items-start justify-between relative bg-white/40">
                <div className="flex items-center gap-5">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.15 }}
                    className="w-14 h-14 bg-white rounded-[16px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E2E8F0]/80 p-2.5 flex items-center justify-center overflow-hidden shrink-0"
                  >
                    <img 
                      src={courier.logo} 
                      alt={courier.name} 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-lg font-bold text-[#94A3B8]">${courier.name.charAt(0)}</span>`;
                      }}
                    />
                  </motion.div>
                  <div>
                    <motion.h3 
                      initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                      className="text-xl font-bold text-[#0F172A] tracking-tight leading-none"
                    >
                      {courier.name}
                    </motion.h3>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.08, backgroundColor: 'rgba(226, 232, 240, 0.9)' }}
                  whileTap={{ scale: 0.92 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#64748B] hover:text-[#0F172A] transition-colors -mr-2 -mt-2"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Body */}
              <div className="p-7 overflow-y-auto max-h-[60vh] bg-[#F8FAFC]/50 space-y-5">
                {fields.map((field, idx) => {
                  const Icon = field.icon;
                  return (
                    <motion.div 
                      key={field.id}
                      variants={itemVariants}
                      className="group"
                    >
                      <label className="block text-xs font-bold text-[#64748B] mb-2 ml-1 tracking-wide uppercase">
                        {field.label}
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#00A86B] transition-colors duration-300">
                          <Icon className="w-4 h-4" />
                        </div>
                        <input
                          type={field.type}
                          placeholder={field.placeholder}
                          className="w-full h-12 pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[14px] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                        />
                        {field.type === 'password' && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#CBD5E1]">
                            <motion.div whileHover={{ scale: 1.1 }} className="cursor-pointer">
                              {/* Simple dots mask visualization */}
                              <div className="flex gap-0.5">
                                {[1,2,3,4].map(i => <div key={i} className="w-1 h-1 rounded-full bg-current" />)}
                              </div>
                            </motion.div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-7 py-5 border-t border-[#E2E8F0]/60 bg-white/60 flex justify-end items-center">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className="px-5 h-11 rounded-[14px] font-semibold text-sm text-[#475569] bg-white border border-[#E2E8F0] shadow-sm hover:text-[#0F172A] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 20px rgba(0,168,107,0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    className="px-6 h-11 rounded-[14px] font-semibold text-sm text-white bg-gradient-to-b from-[#00b876] to-[#00A86B] shadow-[0_4px_12px_rgba(0,168,107,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center gap-2 transition-all border border-[#009B63]"
                  >
                    Connect <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
