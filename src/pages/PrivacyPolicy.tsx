import { motion } from 'framer-motion';
import { ArrowRight, Lock, ShieldCheck, Mail, Phone, MapPin, UserCog } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

const EASE = [0.16, 1, 0.3, 1] as const;

interface PolicySection {
  title: string;
  body: string;
}

const SECTIONS: PolicySection[] = [
  {
    title: 'Introduction',
    body: 'By visiting this Platform, providing your information, or availing any product/service offered on the Platform, you expressly agree to be bound by the terms and conditions of this Privacy Policy.',
  },
  {
    title: 'Collection',
    body: 'We collect your personal data when you use our Platform, services or otherwise interact with us. This includes information such as name, date of birth, address, phone number, and email ID. Sensitive personal data may also be collected with your consent.',
  },
  {
    title: 'Usage',
    body: 'We use personal data to provide services, enhance customer experience, resolve disputes, and protect against fraud. We may also use your data for marketing research and surveys.',
  },
  {
    title: 'Sharing',
    body: 'We may share your personal data internally within our group entities, affiliates, and third-party service providers for the purpose of providing access to services and products offered by them.',
  },
  {
    title: 'Security Precautions',
    body: 'We adopt reasonable security practices to protect your personal data from unauthorized access. However, transmission of information via the internet is not completely secure.',
  },
  {
    title: 'Data Deletion and Retention',
    body: 'You may delete your account through profile settings. However, we may retain certain data to prevent fraud or comply with legal obligations.',
  },
  {
    title: 'Your Rights',
    body: 'You may access, rectify, and update your personal data directly through our Platform.',
  },
  {
    title: 'Consent',
    body: 'By using our Platform, you consent to the collection, storage, and processing of your information in accordance with this Privacy Policy.',
  },
  {
    title: 'Changes to this Privacy Policy',
    body: 'We may update this Privacy Policy periodically to reflect changes in our information practices.',
  },
];

const GRIEVANCE_OFFICER = {
  name: 'Sandeep Singh',
  designation: 'Founder',
  address: '212, Aerocity, Aerovista, Greater Mohali 140306',
  email: 'sandeep@quickpost.in',
  hours: 'Monday - Friday (9:00 - 18:00)',
};

/* ── Dot-grid background, same recipe used across the site ── */
function DotGrid({ opacity = 0.035 }: { opacity?: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        opacity,
        backgroundImage:
          'linear-gradient(#0F172A 1px, transparent 1px), linear-gradient(90deg, #0F172A 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    />
  );
}

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative overflow-hidden pt-[120px] pb-14 md:pt-[150px] md:pb-20 bg-[#F8FAFC]">
          <DotGrid />
          <div className="absolute top-16 -right-24 w-[360px] h-[360px] rounded-full bg-[#00A86B]/[0.05] blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-4 py-1.5 rounded-full">
                <Lock className="w-3.5 h-3.5" />
                Legal
              </span>

              <h1 className="mt-5 text-[30px] leading-[1.15] md:text-[44px] md:leading-[1.1] font-bold text-[#0F172A] tracking-tight">
                Privacy Policy
              </h1>

              <p className="mt-4 text-[14.5px] md:text-[15.5px] text-[#5F5E5A] leading-relaxed max-w-[620px] mx-auto">
                How Quickpost and its affiliates collect, use, share, protect, or otherwise process your
                information through our website.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ SECTIONS — numbered arrow list ═══════════════════════ */}
        <section className="relative py-14 md:py-20 -mt-6 md:-mt-10">
          <div className="max-w-4xl mx-auto px-6 md:px-10">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, ease: EASE }}
              className="mb-8 md:mb-10 bg-white rounded-2xl border border-[#E0EDE8] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.15)] p-6 md:p-9"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-[#00A86B]" />
                </div>
                <h2 className="text-[16px] md:text-[18px] font-bold text-[#0F172A] tracking-tight">
                  What this policy covers
                </h2>
              </div>
              <p className="mt-3 text-[13px] md:text-[13.5px] text-[#475569] leading-relaxed pl-13">
                This Privacy Policy describes how Quickpost and its affiliates (collectively "Quickpost, we, our,
                us") collect, use, share, protect or otherwise process your information/personal data through our
                website.
              </p>
            </motion.div>

            <div className="space-y-3">
              {SECTIONS.map((section, i) => (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: Math.min(i * 0.05, 0.5), ease: EASE }}
                  className="group relative flex items-start gap-4 bg-white rounded-2xl border border-[#E0EDE8] p-4 md:p-5 hover:border-[#00A86B]/30 hover:shadow-lg hover:shadow-[#00A86B]/5 hover:-translate-y-[1px] transition-all duration-250"
                >
                  {/* 2D numbered badge */}
                  <div className="relative shrink-0">
                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#F0FDF4] border border-[#00A86B]/20 flex items-center justify-center text-[13px] md:text-[14px] font-bold text-[#00A86B] group-hover:bg-[#00A86B] group-hover:text-white group-hover:border-[#00A86B] transition-colors duration-250">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 pt-1 md:pt-1.5">
                    <h3 className="text-[13.5px] md:text-[14.5px] font-bold text-[#0F172A]">{section.title}</h3>
                    <p className="mt-1 text-[13px] md:text-[13.5px] leading-relaxed text-[#334155]">{section.body}</p>
                  </div>

                  <ArrowRight className="hidden md:block w-4 h-4 text-[#CBD5E1] group-hover:text-[#00A86B] group-hover:translate-x-1 transition-all duration-250 shrink-0 mt-2.5" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ GRIEVANCE OFFICER ═══════════════════════ */}
        <section className="relative px-6 md:px-10 pb-16 md:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.55, ease: EASE }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] flex items-center justify-center shrink-0">
                <UserCog className="w-5 h-5 text-[#00A86B]" />
              </div>
              <h2 className="text-[18px] md:text-[20px] font-bold text-[#0F172A] tracking-tight">
                Grievance Officer
              </h2>
            </div>

            <div className="bg-[#F8FAFC] rounded-2xl border border-[#E0EDE8] p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div>
                  <h3 className="text-[15.5px] font-bold text-[#0F172A]">{GRIEVANCE_OFFICER.name}</h3>
                  <p className="text-[12.5px] text-[#00A86B] font-semibold mt-0.5">{GRIEVANCE_OFFICER.designation}</p>
                </div>

                <div className="space-y-3 md:min-w-[280px]">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
                    <span className="text-[12.5px] text-[#475569] leading-relaxed">{GRIEVANCE_OFFICER.address}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-[#94A3B8] shrink-0" />
                    <a href={`mailto:${GRIEVANCE_OFFICER.email}`} className="text-[12.5px] font-semibold text-[#00A86B] hover:underline">
                      {GRIEVANCE_OFFICER.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-[#94A3B8] shrink-0" />
                    <span className="text-[12.5px] text-[#475569]">{GRIEVANCE_OFFICER.hours}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
