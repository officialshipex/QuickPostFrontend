import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Type, Tag, Trash2 } from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  courier: any;
  onAdd: (services: { name: string; type: string }[]) => void;
}

export function AddServiceModal({ isOpen, onClose, courier, onAdd }: AddServiceModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('Surface');
  const [addedNames, setAddedNames] = useState<string[]>([]);

  if (!courier) return null;

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

  const handleAddName = () => {
    if (name.trim() && !addedNames.includes(name.trim())) {
      setAddedNames([...addedNames, name.trim()]);
      setName('');
    }
  };

  const handleRemoveName = (nameToRemove: string) => {
    setAddedNames(addedNames.filter(n => n !== nameToRemove));
  };

  const handleSubmit = () => {
    const finalNames = [...addedNames];
    if (name.trim() && !finalNames.includes(name.trim())) {
      finalNames.push(name.trim());
    }
    
    if (finalNames.length === 0) return;
    
    onAdd(finalNames.map(n => ({ name: n, type })));
    setName('');
    setType('Surface');
    setAddedNames([]);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 bg-[#0F172A]/20 pointer-events-auto"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none">
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="w-full max-w-[520px] bg-[#ffffff]/90 backdrop-blur-2xl border border-white/60 shadow-[0_40px_80px_-16px_rgba(0,0,0,0.16),0_0_0_1px_rgba(0,0,0,0.04)] rounded-[28px] pointer-events-auto overflow-hidden flex flex-col"
            >
              <div className="px-7 py-6 border-b border-[#E2E8F0]/60 flex items-start justify-between relative bg-white/40">
                <div className="flex items-center gap-5">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", delay: 0.15 }}
                    className="w-20 h-20 bg-white rounded-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-[#E2E8F0]/80 p-3 flex items-center justify-center overflow-hidden shrink-0"
                  >
                    <img 
                      src={courier.logo} 
                      alt={courier.name} 
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).parentElement!.innerHTML = `<span class="text-2xl font-bold text-[#94A3B8]">${courier.name.charAt(0)}</span>`;
                      }}
                    />
                  </motion.div>
                  <div className="flex flex-col justify-center h-20">
                    <motion.h3 
                      initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                      className="text-[22px] font-extrabold text-[#0F172A] tracking-tight leading-none"
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

              <div className="p-7 overflow-y-auto max-h-[60vh] bg-[#F8FAFC]/50 space-y-5">
                <motion.div variants={itemVariants} className="group">
                  <label className="block text-xs font-bold text-[#64748B] mb-2 ml-1 tracking-wide uppercase">
                    Mode
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#00A86B] transition-colors duration-300 z-10">
                      <Tag className="w-4 h-4" />
                    </div>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      className="w-full h-12 pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[14px] text-sm font-medium text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.02)] appearance-none cursor-pointer"
                    >
                      <option value="Surface">Surface</option>
                      <option value="Air">Air</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="group">
                  <label className="block text-xs font-bold text-[#64748B] mb-2 ml-1 tracking-wide uppercase">
                    Service Name
                  </label>
                  <div className="relative flex gap-3 items-center">
                    <div className="relative flex-1">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-[#00A86B] transition-colors duration-300">
                        <Type className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddName();
                          }
                        }}
                        placeholder="e.g. Standard Delivery, Next Day Air"
                        className="w-full h-12 pl-11 pr-4 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] rounded-[14px] text-sm font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#00A86B]/20 focus:border-[#00A86B] transition-all shadow-[0_2px_6px_rgba(0,0,0,0.02)]"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddName}
                      disabled={!name.trim()}
                      className="h-12 px-5 bg-[#00A86B]/10 hover:bg-[#00A86B]/20 text-[#00A86B] font-bold text-sm rounded-[14px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                  
                  {/* Added Names List */}
                  {addedNames.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 flex flex-col gap-2"
                    >
                      {addedNames.map((addedName, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-sm">
                          <span className="text-sm font-medium text-[#0F172A]">{addedName}</span>
                          <button 
                            onClick={() => handleRemoveName(addedName)}
                            className="text-[#94A3B8] hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </div>

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
                    onClick={handleSubmit}
                    disabled={addedNames.length === 0 && !name.trim()}
                    className="px-6 h-11 rounded-[14px] font-semibold text-sm text-white bg-gradient-to-b from-[#00b876] to-[#00A86B] shadow-[0_4px_12px_rgba(0,168,107,0.25),inset_0_1px_1px_rgba(255,255,255,0.2)] flex items-center gap-2 transition-all border border-[#009B63] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save Services <ArrowRight className="w-4 h-4" />
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
