import React, { useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';

const stats = [
  { value: "10,000+", label: "Sellers Onboarded" },
  { value: "50L+", label: "Shipments Delivered" },
  { value: "25+", label: "Courier Partners" }
];

export function StatsSection() {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);

  return (
    <section className="py-16 bg-[#FAFAFA]">
      <div className="container mx-auto px-4 md:px-8 max-w-5xl" ref={ref}>
        <div className="bg-[#065F46] rounded-2xl p-10 md:p-12 shadow-xl">
          <div className="text-center mb-10">
            <h3 className="text-white font-bold text-lg">Built for Speed. Trusted for Scale.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <motion.div 
                key={index}
                className="flex flex-col items-center justify-center"
                initial={{ opacity: 0, y: 20 }}
                animate={controls}
                variants={{
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: index * 0.15 } }
                }}
              >
                <div className="text-white font-bold text-3xl md:text-4xl mb-1 italic tracking-tight">
                  {stat.value}
                </div>
                <div className="text-white/80 text-xs font-medium">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
