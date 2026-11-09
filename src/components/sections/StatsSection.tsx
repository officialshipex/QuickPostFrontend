import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
}

function CountUp({ end, duration = 1.5, suffix = "" }: CountUpProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let startTimeValue: number | null = null;
      let animationFrameId: number;

      const step = (timestamp: number) => {
        if (!startTimeValue) startTimeValue = timestamp;
        const progress = Math.min((timestamp - startTimeValue) / (duration * 1000), 1);
        setCount(Math.floor(progress * end));
        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        }
      };
      animationFrameId = window.requestAnimationFrame(step);
      return () => {
        window.cancelAnimationFrame(animationFrameId);
      };
    }
  }, [isInView, end, duration]);

  const formatted = count.toLocaleString();
  return <span ref={ref}>{formatted}{suffix}</span>;
}

export function StatsSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-12 md:py-28 bg-[#F1F5F3] md:bg-[#FAFAFA] border-t border-slate-100" ref={ref}>
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -180;
          }
        }
      `}</style>

      {/* Mobile: light stat cards (the green CTA band sits right above, so no second green block) */}
      <div className="md:hidden px-4">
        <h2 className="text-[24px] font-black text-[#0F172A] tracking-tight leading-tight text-center font-sans">
          Built for Speed. <span className="text-[#00A86B]">Trusted for Scale.</span>
        </h2>
        <div className="w-12 h-1 bg-[#00A86B] mx-auto rounded-full mt-4 mb-7" />
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] divide-y divide-slate-100 overflow-hidden">
          {[
            { end: 10000, suffix: '+', label: 'Sellers onboarded', art: 'growth' },
            { end: 50, suffix: 'L+', label: 'Shipments delivered', art: 'routes' },
            { end: 25, suffix: '+', label: 'Courier partners', art: 'network' },
          ].map((st, i) => (
            <motion.div
              key={st.label}
              className="relative flex items-center justify-between gap-4 pl-6 pr-4 py-5"
              initial={{ opacity: 0, x: -12 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.12 }}
            >
              {/* accent bar grows in */}
              <motion.span
                className="absolute left-0 top-5 bottom-5 w-[3px] rounded-r-full bg-[#00A86B] origin-top"
                initial={{ scaleY: 0 }}
                animate={isInView ? { scaleY: 1 } : {}}
                transition={{ duration: 0.6, delay: 0.25 + i * 0.12 }}
              />
              <div className="min-w-0">
                <div className="text-[32px] font-black text-[#0F172A] tracking-tight leading-none tabular-nums"><CountUp end={st.end} suffix={st.suffix} /></div>
                <div className="mt-1.5 text-[#5F5E5A] text-[11.5px] font-semibold uppercase tracking-wider font-sans">{st.label}</div>
              </div>
              <svg className="w-[112px] h-12 shrink-0 text-[#00A86B]" viewBox="0 0 200 80" fill="none" stroke="currentColor" aria-hidden>
                {st.art === 'growth' && (
                  <>
                    <path d="M10,70 L40,68 L70,55 L100,58 L130,35 L160,38 L190,12" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M10,70 L40,68 L70,55 L100,58 L130,35 L160,38 L190,12" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24 156" className="animate-[dash_3s_linear_infinite]" />
                    <circle cx="190" cy="12" r="5" fill="#00A86B" />
                  </>
                )}
                {st.art === 'routes' && [20, 40, 60].map((y, k) => (
                  <g key={y}>
                    <line x1="10" y1={y} x2="190" y2={y} stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
                    <line x1="10" y1={y} x2="190" y2={y} strokeWidth="3" strokeLinecap="round" strokeDasharray="15 165" strokeDashoffset={k * 40} className={['animate-[dash_3.5s_linear_infinite]', 'animate-[dash_2.8s_linear_infinite]', 'animate-[dash_2.2s_linear_infinite]'][k]} />
                  </g>
                ))}
                {st.art === 'network' && (
                  <>
                    {[[45, 20], [155, 20], [45, 60], [155, 60]].map(([x, y]) => (
                      <g key={`${x}-${y}`}>
                        <line x1="100" y1="40" x2={x} y2={y} stroke="#E2E8F0" strokeWidth="2" />
                        <circle cx={x} cy={y} r="6" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2" />
                        <circle r="3" fill="currentColor"><animateMotion path={`M100,40 L${x},${y}`} dur={`${1.2 + (x + y) % 5 / 10}s`} repeatCount="indefinite" /></circle>
                      </g>
                    ))}
                    <circle cx="100" cy="40" r="8" fill="currentColor" />
                  </>
                )}
              </svg>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="hidden md:block container mx-auto px-6 md:px-8 max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16 md:mb-20">
          <h2 className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight leading-tight">
            Built for Speed. <span className="text-[#00A86B]">Trusted for Scale.</span>
          </h2>
          <div className="w-16 h-1 bg-[#00A86B] mx-auto rounded-full mt-6"></div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {/* Card 1: Sellers Onboarded */}
          <motion.div
            className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 hover:border-[#00A86B]/30 hover:shadow-xl hover:shadow-[#00A86B]/5 transition-all duration-300 flex flex-col items-center text-center relative group overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#00A86B]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="w-full relative z-10 flex flex-col items-center">
              {/* SVG Growth Chart */}
              <div className="text-[#00A86B]/80 group-hover:text-[#00A86B] transition-colors duration-300 w-full flex justify-center">
                <svg className="w-full max-w-[140px] h-16 mb-6" viewBox="0 0 200 80" fill="none" stroke="currentColor">
                  {/* Background path */}
                  <path d="M10,70 L40,68 L70,55 L100,58 L130,35 L160,38 L190,12" stroke="#E2E8F0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Animated path */}
                  <path d="M10,70 L40,68 L70,55 L100,58 L130,35 L160,38 L190,12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24 156" strokeDashoffset="0" className="animate-[dash_3s_linear_infinite]" />
                  
                  <path d="M10,70 L40,68 L70,55 L100,58 L130,35 L160,38 L190,12 L190,75 L10,75 Z" fill="url(#grad_sellers)" opacity="0.06" />
                  <defs>
                    <linearGradient id="grad_sellers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00A86B" />
                      <stop offset="100%" stopColor="#00A86B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <circle cx="190" cy="12" r="3.5" fill="#00A86B" />
                </svg>
              </div>
              
              <div className="text-4xl md:text-5xl font-black text-[#0F172A] mb-2 tracking-tight">
                <CountUp end={10000} suffix="+" />
              </div>
              <div className="text-[#5F5E5A] text-xs font-semibold uppercase tracking-wider">
                Sellers Onboarded
              </div>
            </div>
          </motion.div>

          {/* Card 2: Shipments Delivered */}
          <motion.div
            className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 hover:border-[#00A86B]/30 hover:shadow-xl hover:shadow-[#00A86B]/5 transition-all duration-300 flex flex-col items-center text-center relative group overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#00A86B]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="w-full relative z-10 flex flex-col items-center">
              {/* SVG Speed Routes */}
              <div className="text-[#00A86B]/80 group-hover:text-[#00A86B] transition-colors duration-300 w-full flex justify-center">
                <svg className="w-full max-w-[140px] h-16 mb-6" viewBox="0 0 200 80" fill="none" stroke="currentColor">
                  <line x1="10" y1="20" x2="190" y2="20" stroke="#E2E8F0" strokeWidth="2.5" />
                  <line x1="10" y1="20" x2="190" y2="20" stroke="currentColor" strokeWidth="2.5" strokeDasharray="15 165" strokeDashoffset="0" className="animate-[dash_3.5s_linear_infinite]" />

                  <line x1="10" y1="40" x2="190" y2="40" stroke="#E2E8F0" strokeWidth="2.5" />
                  <line x1="10" y1="40" x2="190" y2="40" stroke="currentColor" strokeWidth="2.5" strokeDasharray="15 165" strokeDashoffset="40" className="animate-[dash_2.8s_linear_infinite]" />

                  <line x1="10" y1="60" x2="190" y2="60" stroke="#E2E8F0" strokeWidth="2.5" />
                  <line x1="10" y1="60" x2="190" y2="60" stroke="currentColor" strokeWidth="2.5" strokeDasharray="15 165" strokeDashoffset="80" className="animate-[dash_2.2s_linear_infinite]" />
                </svg>
              </div>

              <div className="text-4xl md:text-5xl font-black text-[#0F172A] mb-2 tracking-tight">
                <CountUp end={50} suffix="L+" />
              </div>
              <div className="text-[#5F5E5A] text-xs font-semibold uppercase tracking-wider">
                Shipments Delivered
              </div>
            </div>
          </motion.div>

          {/* Card 3: Courier Partners */}
          <motion.div
            className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 hover:border-[#00A86B]/30 hover:shadow-xl hover:shadow-[#00A86B]/5 transition-all duration-300 flex flex-col items-center text-center relative group overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#00A86B]/[0.01] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="w-full relative z-10 flex flex-col items-center">
              {/* SVG Connection Matrix */}
              <div className="text-[#00A86B]/80 group-hover:text-[#00A86B] transition-colors duration-300 w-full flex justify-center">
                <svg className="w-full max-w-[140px] h-16 mb-6" viewBox="0 0 200 80" fill="none" stroke="currentColor">
                  {/* Central Node */}
                  <circle cx="100" cy="40" r="6" fill="currentColor" />
                  <circle cx="100" cy="40" r="12" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" className="origin-center animate-[spin_10s_linear_infinite]" style={{ transformOrigin: '100px 40px' }} />
                  
                  {/* Connector lines */}
                  <line x1="100" y1="40" x2="45" y2="20" stroke="#E2E8F0" strokeWidth="1.5" />
                  <line x1="100" y1="40" x2="155" y2="20" stroke="#E2E8F0" strokeWidth="1.5" />
                  <line x1="100" y1="40" x2="45" y2="60" stroke="#E2E8F0" strokeWidth="1.5" />
                  <line x1="100" y1="40" x2="155" y2="60" stroke="#E2E8F0" strokeWidth="1.5" />
                  
                  {/* Peripheral Nodes */}
                  <circle cx="45" cy="20" r="4.5" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
                  <circle cx="155" cy="20" r="4.5" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
                  <circle cx="45" cy="60" r="4.5" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />
                  <circle cx="155" cy="60" r="4.5" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.5" />

                  {/* Pulsing signal on lines */}
                  <circle cx="0" cy="0" r="2" fill="currentColor">
                    <animateMotion path="M100,40 L45,20" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="2" fill="currentColor">
                    <animateMotion path="M100,40 L155,20" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="2" fill="currentColor">
                    <animateMotion path="M100,40 L45,60" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="0" cy="0" r="2" fill="currentColor">
                    <animateMotion path="M100,40 L155,60" dur="1.6s" repeatCount="indefinite" />
                  </circle>
                </svg>
              </div>

              <div className="text-4xl md:text-5xl font-black text-[#0F172A] mb-2 tracking-tight">
                <CountUp end={25} suffix="+" />
              </div>
              <div className="text-[#5F5E5A] text-xs font-semibold uppercase tracking-wider">
                Courier Partners
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

