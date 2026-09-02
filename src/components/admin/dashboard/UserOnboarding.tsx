import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User, IdCard, Landmark, PenTool, Warehouse, Building2, Wallet,
  PackagePlus, Share2, Phone, Mail, ShieldCheck, X, Check, ArrowRight, ChevronRight,
} from 'lucide-react';

/* ─── types ───────────────────────────────────────────────────────── */
export interface OnboardingStatus {
  personalDone: boolean;
  kycDone: boolean;
  bankDone: boolean;
  contractDone: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
}

/* ─── top step cards ──────────────────────────────────────────────── */
function StepCard({
  icon: Icon, title, subtitle, to, cta, done,
}: {
  icon: any; title: string; subtitle: string; to: string; cta: string; done: boolean;
}) {
  return (
    <Link
      to={to}
      className="group relative bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm flex items-start gap-3 min-w-0 transition-all duration-200 hover:shadow-md hover:border-[#00A86B]/30 hover:-translate-y-0.5"
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105 ${
          done ? 'bg-[#00A86B]/10 text-[#00A86B]' : 'bg-[#1D4ED8]/10 text-[#1D4ED8]'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[16px] font-bold text-[#0F172A] truncate pr-16">{title}</h3>
        <p className="text-[14px] text-[#64748B] mt-0.5 truncate">{subtitle}</p>
        {!done && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-[#00A86B] group-hover:text-[#009960] transition-colors">
            {cta} <ArrowRight className="w-3 h-3 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        )}
      </div>

      {done && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-gradient-to-r from-[#00A86B] to-[#00C27D] px-2 py-1 pl-1.5 rounded-full shrink-0 shadow-[0_2px_8px_rgba(0,168,107,0.35)] ring-1 ring-white/40 animate-[badgePop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
          <span className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3.5]" />
          </span>
          Completed
        </span>
      )}
    </Link>
  );
}

/* ─── courier onboarding rows ─────────────────────────────────────── */
function OnboardingRow({
  icon: Icon, title, subtitle, to,
}: {
  icon: any; title: string; subtitle: string; to: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-start gap-3 p-3 rounded-xl bg-[#F8FAFC] hover:bg-white border border-transparent hover:border-[#00A86B]/30 hover:shadow-md transition-all duration-200 min-w-0"
    >
      <div className="w-10 h-10 rounded-lg bg-[#00A86B]/10 text-[#00A86B] flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105">
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[16px] font-bold text-[#0F172A]">{title}</h4>
        <p className="text-[14px] text-[#64748B] mt-0.5">{subtitle}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-[#00A86B] shrink-0 self-center opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
    </Link>
  );
}

/* ─── checklist rows ──────────────────────────────────────────────── */
function ChecklistRow({
  icon: Icon, label, done, doneLabel, pendingLabel, last = false,
}: {
  icon: any; label: string; done: boolean; doneLabel: string; pendingLabel: string; last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 py-3 px-1.5 -mx-1.5 rounded-lg transition-colors duration-150 hover:bg-[#F8FAFC] ${
        last ? '' : 'border-b border-dashed border-[#E2E8F0]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className="w-4 h-4 text-[#1D4ED8] shrink-0" />
        <span className="text-[15px] text-[#0F172A] truncate">{label}</span>
      </div>
      {done ? (
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-1 pl-1.5 rounded-full bg-gradient-to-r from-[#00A86B] to-[#00C27D] shadow-[0_2px_6px_rgba(0,168,107,0.3)] ring-1 ring-white/40">
          <span className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center">
            <Check className="w-2.5 h-2.5 stroke-[3.5]" />
          </span>
          {doneLabel}
        </span>
      ) : (
        <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200">
          <X className="w-3 h-3 stroke-[3]" />
          {pendingLabel}
        </span>
      )}
    </div>
  );
}

/* ─── main ────────────────────────────────────────────────────────── */
export function UserOnboarding({ status }: { status: OnboardingStatus }) {
  const [showNotice, setShowNotice] = useState(true);

  const checklist = [
    { icon: Phone,       label: 'Phone Number',       done: status.phoneVerified, doneLabel: 'Verified',  pendingLabel: 'Not verified' },
    { icon: Mail,        label: 'Email Address',      done: status.emailVerified, doneLabel: 'Verified',  pendingLabel: 'Not verified' },
    { icon: IdCard,      label: 'KYC Verification',   done: status.kycDone,       doneLabel: 'Completed', pendingLabel: 'Pending'   },
    { icon: Landmark,    label: 'Bank Details',       done: status.bankDone,      doneLabel: 'Completed', pendingLabel: 'Pending'   },
    { icon: ShieldCheck, label: 'Contract Acceptance', done: status.contractDone, doneLabel: 'Completed', pendingLabel: 'Pending'   },
  ];

  const completed = checklist.filter(c => c.done).length;
  const pct = Math.round((completed / checklist.length) * 100);

  return (
    <div className="max-w-[1400px] mx-auto text-[#0F172A] pb-10 min-w-0 overflow-x-hidden">

      {/* Heading */}
      <h1 className="text-lg md:text-xl font-bold text-[#0F172A]">
        Complete your account to start shipping
      </h1>
      <p className="text-[12px] text-[#64748B] mt-1">
        To ensure a smooth shipping experience, please complete your account by providing the necessary details.
      </p>

      {/* Notice banner */}
      {showNotice && (
        <div className="mt-5 bg-[#E9BE2E] rounded-xl px-4 py-3 flex items-start gap-3 shadow-sm">
          <div className="w-6 h-6 rounded-full bg-[#0F172A]/10 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0F172A]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-bold text-[#0F172A]">Dear Customers,</p>
            <p className="text-[11px] text-[#0F172A]/80 font-medium mt-0.5">
              Your account&apos;s Operations POC details have been updated in the system. For any escalation,
              please contact your POC or raise a ticket for faster resolution.
            </p>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            aria-label="Dismiss notice"
            className="shrink-0 text-[#0F172A]/60 hover:text-[#0F172A] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
        <StepCard
          icon={User} title="Personal Details" subtitle="Verify profile details"
          to="/user/profile" cta="Add Details" done={status.personalDone}
        />
        <StepCard
          icon={IdCard} title="Complete KYC" subtitle="Verify your identity documents"
          to="/user/kyc" cta="Verify KYC" done={status.kycDone}
        />
        <StepCard
          icon={Landmark} title="Bank" subtitle="To receive COD remittance"
          to="/user/kyc" cta="Add Details" done={status.bankDone}
        />
        <StepCard
          icon={PenTool} title="Contract Acceptance" subtitle="Contract agreement signed"
          to="/user/settings/agreement" cta="Accept Contract" done={status.contractDone}
        />
      </div>

      {/* Courier onboarding + checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_460px] gap-5 mt-5 items-stretch">

        <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 shadow-sm min-w-0 flex flex-col">
          <h2 className="text-[16px] font-bold text-[#0F172A] mb-3">Courier Onboarding</h2>
          <div className="flex flex-col gap-2.5 flex-1 justify-between">
            <OnboardingRow
              icon={Warehouse} title="Warehouse Addon"
              subtitle="Manage your inventory with the Warehouse Addon."
              to="/user/settings/pickup-address"
            />
            <OnboardingRow
              icon={Building2} title="Company & Invoices"
              subtitle="Add your company details to generate GST invoices."
              to="/user/settings/invoice"
            />
            <OnboardingRow
              icon={Wallet} title="Recharge the wallet"
              subtitle="Start shipping by recharging your wallet with maximum bonus amount."
              to="/user/wallet"
            />
            <OnboardingRow
              icon={PackagePlus} title="Create First Order"
              subtitle="Start shipping by creating your first order."
              to="/user/add-order"
            />
            <OnboardingRow
              icon={Share2} title="Channels Addon"
              subtitle="Ecom channels (like Shopify, WooCommerce, Amazon, etc.) to manage orders seamlessly."
              to="/user/channels"
            />
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-[#E2E8F0] shadow-sm bg-white min-w-0 flex flex-col transition-shadow duration-200 hover:shadow-md">
          <div className="bg-gradient-to-br from-[#00A86B] to-[#007047] px-4 pt-4 pb-8">
            <h2 className="text-[16px] font-bold text-white">Account Setup Checklist</h2>
            <div className="mt-3 h-2.5 rounded-full bg-white/25 overflow-hidden">
              <div
                className="relative h-full rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] transition-all duration-700 ease-out overflow-hidden"
                style={{ width: `${pct}%` }}
              >
                <div className="absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-[#00A86B]/40 to-transparent animate-[progressShimmer_1.8s_ease-in-out_infinite]" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-1.5 text-[15px] font-semibold text-white/90">
              <span>{pct}%</span>
              <span>{completed} of {checklist.length} completed</span>
            </div>
          </div>

          <div className="px-4 -mt-5">
            <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-sm px-4 py-3">
              <p className="text-[15px] text-[#475569]">
                Complete the above steps to start shipping.
              </p>
            </div>
          </div>

          <div className="px-4 pt-2 pb-3 flex-1 flex flex-col justify-between">
            {checklist.map((c, i) => (
              <ChecklistRow
                key={c.label}
                icon={c.icon}
                label={c.label}
                done={c.done}
                doneLabel={c.doneLabel}
                pendingLabel={c.pendingLabel}
                last={i === checklist.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
