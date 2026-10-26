import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight, Briefcase, MapPin, Clock, ChevronDown, Mail, Rocket, Users, Target, GraduationCap,
  Check, Send, MessageSquare, UserCheck, BadgeCheck, Copy, Wallet, Trophy,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { copyToClipboard } from '../utils/clipboard';

const EASE = [0.16, 1, 0.3, 1] as const;
const CAREERS_EMAIL = 'tech@shipexindia.com';

interface Role {
  id: string;
  title: string;
  team: string;
  location: string;
  type: string;
  stipend: string;
  summary: string;
  responsibilities: string[];
  requirements: string[];
  gains: string[];
}

const ROLES: Role[] = [
  {
    id: 'sales-intern',
    title: 'Sales Intern',
    team: 'Sales',
    location: 'Remote · India',
    type: 'Internship',
    stipend: 'Competitive stipend',
    summary:
      'Work with our sales team to bring new D2C brands and online sellers onto QuickPost. You will talk to business owners every day, understand how they ship, and show them how QuickPost can make it simpler and cheaper.',
    responsibilities: [
      'Reach out to online sellers and D2C brands over calls, WhatsApp and email',
      'Explain QuickPost’s shipping platform and help sellers get started',
      'Follow up with leads and keep the CRM up to date',
      'Help new sellers complete onboarding and ship their first orders',
      'Share seller feedback with the product and operations teams',
    ],
    requirements: [
      'Strong communication in English and Hindi',
      'Comfortable speaking with business owners on the phone',
      'Curious, organised and quick to learn',
      'Interest in e-commerce, logistics or startups',
      'Final-year students and recent graduates are welcome',
    ],
    gains: [
      'Stipend competitive with the market',
      'Exciting monthly prizes for top performers',
      'Hands-on B2B sales experience in a fast-growing logistics company',
      'Mentorship from the founding and sales team',
      'Internship certificate and letter of recommendation',
      'Opportunity for a full-time role based on performance',
    ],
  },
];

const VALUES = [
  { icon: Rocket, title: 'Ship fast', desc: 'We move quickly, learn from real sellers and improve every week.' },
  { icon: Target, title: 'Own the outcome', desc: 'Everyone owns their work end to end — from idea to impact.' },
  { icon: Users, title: 'Sellers first', desc: 'Every decision starts with what makes shipping easier for our sellers.' },
  { icon: GraduationCap, title: 'Learn every day', desc: 'Work closely with experienced people and grow faster than anywhere else.' },
];

const STEPS = [
  { icon: Send, title: 'Apply', desc: `Email your resume to ${CAREERS_EMAIL}` },
  { icon: MessageSquare, title: 'Intro call', desc: 'A short conversation with our team' },
  { icon: UserCheck, title: 'Interview', desc: 'Meet the people you will work with' },
  { icon: BadgeCheck, title: 'Offer', desc: 'Welcome to QuickPost' },
];

const mailto = (role?: string) => {
  const subject = role ? `Application – ${role}` : 'Application – General';
  const body = `Hi QuickPost team,\n\nI would like to apply${role ? ` for the ${role} role` : ''}. Please find my resume attached.\n\nName:\nPhone:\nLinkedIn (optional):\n\nThanks,`;
  return `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
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

function RoleCard({ role, open, onToggle }: { role: Role; open: boolean; onToggle: () => void }) {
  const list = (title: string, items: string[]) => (
    <div>
      <h4 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[#0F172A]">{title}</h4>
      <ul className="mt-3 space-y-2.5">
        {items.map(t => (
          <li key={t} className="flex items-start gap-2.5 text-[14px] text-[#475569] leading-relaxed">
            <Check className="w-4 h-4 text-[#00A86B] shrink-0 mt-[3px]" strokeWidth={2.5} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-250 ${open ? 'border-[#00A86B]/30 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.18)]' : 'border-[#E0EDE8] hover:border-[#00A86B]/30 hover:shadow-lg hover:shadow-[#00A86B]/5'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="w-full text-left p-5 md:p-7 flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-[#00A86B]">{role.team}</span>
            <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
            <span className="text-[12px] font-medium text-[#64748B]">Now hiring</span>
          </div>
          <h3 className="mt-1.5 text-[20px] md:text-[22px] font-bold text-[#0F172A] tracking-tight">{role.title}</h3>
          <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-[#5F5E5A]">
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#94A3B8]" />{role.location}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-[#94A3B8]" />{role.type}</span>
            <span className="inline-flex items-center gap-1.5"><Wallet className="w-4 h-4 text-[#94A3B8]" />{role.stipend}</span>
            <span className="inline-flex items-center gap-1.5"><Trophy className="w-4 h-4 text-[#94A3B8]" />Monthly prizes</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#00A86B] shrink-0">
          {open ? 'Hide details' : 'View details'}
          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
            <div className="px-5 md:px-7 pb-6 md:pb-8 border-t border-[#F1F5F9] pt-6">
              <p className="text-[15px] text-[#334155] leading-relaxed max-w-[760px]">{role.summary}</p>
              <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-7 md:gap-8">
                {list('What you’ll do', role.responsibilities)}
                {list('What we’re looking for', role.requirements)}
                {list('What you’ll gain', role.gains)}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-4 md:p-5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="flex-1 text-[14px] text-[#475569]">
                  Send your resume to <a href={mailto(role.title)} className="font-semibold text-[#0F172A] hover:text-[#00A86B]">{CAREERS_EMAIL}</a> with the subject “Application – {role.title}”.
                </p>
                <a href={mailto(role.title)}
                  className="inline-flex items-center justify-center gap-2 h-11 px-6 rounded-[10px] bg-[#00A86B] hover:bg-[#00965F] text-white text-[14px] font-bold transition-colors shrink-0">
                  Apply by email <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Careers() {
  const [openRole, setOpenRole] = useState<string | null>(ROLES[0]?.id ?? null);
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    if (await copyToClipboard(CAREERS_EMAIL)) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const scrollToRoles = () => document.getElementById('open-roles')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-[#0F172A] selection:bg-[#00A86B]/20 selection:text-[#00A86B]" style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar />

      <main className="flex-1">
        {/* ═══════════════════════ HERO ═══════════════════════ */}
        <section className="relative overflow-hidden pt-[120px] pb-16 md:pt-[150px] md:pb-24 bg-[#F8FAFC]">
          <DotGrid />
          <div className="absolute top-16 -right-24 w-[360px] h-[360px] rounded-full bg-[#00A86B]/[0.05] blur-3xl pointer-events-none" />

          <div className="relative max-w-4xl mx-auto px-6 md:px-10 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B] bg-[#00A86B]/10 border border-[#00A86B]/20 px-4 py-1.5 rounded-full">
                <Briefcase className="w-3.5 h-3.5" />
                Careers
              </span>

              <h1 className="mt-5 text-[32px] leading-[1.12] md:text-[52px] md:leading-[1.08] font-bold text-[#0F172A] tracking-tight">
                Help India’s sellers <span className="text-[#00A86B]">ship smarter</span>
              </h1>

              <p className="mt-5 text-[15px] md:text-[17px] text-[#5F5E5A] leading-relaxed max-w-[640px] mx-auto">
                QuickPost makes shipping simple for thousands of online businesses. Join a small, focused team where
                your work reaches real sellers from day one.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button type="button" onClick={scrollToRoles}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[10px] bg-[#00A86B] hover:bg-[#00965F] text-white text-[15px] font-bold transition-colors">
                  View open roles <ArrowRight className="w-4 h-4" />
                </button>
                <a href={mailto()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-12 px-7 rounded-[10px] border border-[#CBD5E1] bg-white text-[#0F172A] text-[15px] font-semibold hover:border-[#00A86B] hover:text-[#00A86B] transition-colors">
                  <Mail className="w-4 h-4" /> Email your resume
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ VALUES ═══════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }} className="max-w-[620px]">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B]">Life at QuickPost</span>
              <h2 className="mt-3 text-[26px] md:text-[36px] font-bold text-[#0F172A] tracking-tight leading-tight">How we work</h2>
              <p className="mt-3 text-[15px] text-[#5F5E5A] leading-relaxed">A few principles that guide how we build, sell and support every day.</p>
            </motion.div>

            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {VALUES.map((v, i) => (
                <motion.div key={v.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
                  className="group bg-white rounded-2xl border border-[#E0EDE8] p-6 hover:border-[#00A86B]/30 hover:shadow-lg hover:shadow-[#00A86B]/5 hover:-translate-y-[2px] transition-all duration-250">
                  <div className="w-11 h-11 rounded-xl bg-[#F0FDF4] flex items-center justify-center group-hover:bg-[#00A86B] transition-colors duration-250">
                    <v.icon className="w-5 h-5 text-[#00A86B] group-hover:text-white transition-colors duration-250" />
                  </div>
                  <h3 className="mt-5 text-[17px] font-bold text-[#0F172A]">{v.title}</h3>
                  <p className="mt-2 text-[14px] text-[#5F5E5A] leading-relaxed">{v.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ OPEN ROLES ═══════════════════════ */}
        <section id="open-roles" className="relative py-16 md:py-24 bg-[#F8FAFC] scroll-mt-20 overflow-hidden">
          <DotGrid opacity={0.025} />
          <div className="relative max-w-5xl mx-auto px-6 md:px-10">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }} className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B]">Open roles</span>
                <h2 className="mt-3 text-[26px] md:text-[36px] font-bold text-[#0F172A] tracking-tight leading-tight">Join the team</h2>
              </div>
              <p className="text-[14px] text-[#64748B]">{ROLES.length} open {ROLES.length === 1 ? 'position' : 'positions'}</p>
            </motion.div>

            <div className="mt-8 space-y-4">
              {ROLES.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.06, ease: EASE }}>
                  <RoleCard role={r} open={openRole === r.id} onToggle={() => setOpenRole(o => (o === r.id ? null : r.id))} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ HIRING PROCESS ═══════════════════════ */}
        <section className="py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }} className="text-center max-w-[620px] mx-auto">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#00A86B]">Hiring process</span>
              <h2 className="mt-3 text-[26px] md:text-[36px] font-bold text-[#0F172A] tracking-tight leading-tight">Simple, quick and transparent</h2>
            </motion.div>

            <div className="mt-12 relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
              <div aria-hidden className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] border-t-2 border-dashed border-[#CBD5E1]" />
              {STEPS.map((s, i) => (
                <motion.div key={s.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
                  className="relative flex flex-col items-center text-center">
                  <div className="relative w-12 h-12 rounded-full bg-white border-2 border-[#00A86B] flex items-center justify-center shadow-[0_0_0_6px_#FFFFFF]">
                    <s.icon className="w-5 h-5 text-[#00A86B]" />
                  </div>
                  <span className="mt-4 text-[12px] font-semibold text-[#94A3B8]">Step {i + 1}</span>
                  <h3 className="mt-1 text-[16px] font-bold text-[#0F172A]">{s.title}</h3>
                  <p className="mt-1.5 text-[13.5px] text-[#5F5E5A] leading-relaxed max-w-[220px] break-words">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ GENERAL APPLICATION ═══════════════════════ */}
        <section className="pb-20 md:pb-28">
          <div className="max-w-5xl mx-auto px-6 md:px-10">
            <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.55, ease: EASE }}
              className="relative overflow-hidden rounded-3xl bg-[#0F172A] px-6 py-10 md:px-12 md:py-14 flex flex-col md:flex-row md:items-center gap-8">
              <div aria-hidden className="absolute -right-20 -top-20 w-[320px] h-[320px] rounded-full bg-[#00A86B]/20 blur-3xl" />
              <div className="relative flex-1">
                <h2 className="text-[24px] md:text-[30px] font-bold text-white tracking-tight leading-tight">Don’t see the right role?</h2>
                <p className="mt-3 text-[15px] text-white/65 leading-relaxed max-w-[520px]">
                  We’re always happy to meet good people. Send us your resume and tell us how you’d like to contribute.
                </p>
              </div>
              <div className="relative flex flex-col sm:flex-row gap-3 shrink-0">
                <a href={mailto()}
                  className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[10px] bg-[#00A86B] hover:bg-[#00965F] text-white text-[14.5px] font-bold transition-colors">
                  <Mail className="w-4 h-4" /> {CAREERS_EMAIL}
                </a>
                <button type="button" onClick={copyEmail}
                  className="inline-flex items-center justify-center gap-2 h-12 px-5 rounded-[10px] border border-white/20 text-white text-[14px] font-semibold hover:bg-white/10 transition-colors">
                  {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy email</>}
                </button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
