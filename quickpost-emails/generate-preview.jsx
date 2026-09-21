// Generates every template with realistic sample data into public/email-preview/,
// served by the app's own dev server at /email-preview/<name>.html, with images
// pointed at this app's own /email/ static folder (public/email/) instead of the
// production CDN placeholder — so `npm run dev` shows a fully working preview
// with no external dependency. Dev tooling only; not part of the production bundle.
//
// Run:  npx esbuild generate-preview.jsx --bundle --platform=node --outfile=.preview.cjs --loader:.js=jsx
//       node .preview.cjs
import fs from "fs";
import path from "path";
import { templates, renderEmail } from "./index";

const OUT_DIR = path.resolve("../public/email-preview");
fs.mkdirSync(OUT_DIR, { recursive: true });

const now = new Date();
const fmtDate = (d) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const inDays = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return fmtDate(d); };

// Realistic sample props per template — same shape the real backend will pass in.
const SAMPLE_PROPS = {
  emailVerificationOtp: { firstName: "Ravi", otp: "482913", expiryMinutes: "10" },
  forgotPassword: { firstName: "Ravi", resetLink: "https://app.quickpost.in/reset-password?token=sample", expiryMinutes: "30" },
  notificationUpdate: {
    firstName: "Ravi",
    title: "New feature: bulk label download",
    message: "You can now download shipping labels for up to 500 orders at once from the Orders page.",
    dateTime: fmtDate(now),
    referenceId: "NTF-58213",
    details: "Available on all plans, no action needed.",
  },
  shipmentMisReport: {
    firstName: "Ravi",
    reportDate: fmtDate(now),
    totalShipments: "184",
    pickedUp: "162",
    inTransit: "97",
    delivered: "138",
    rtoNdr: "9",
    codCollected: "₹1,42,380",
    reportLink: "https://app.quickpost.in/reports/daily",
  },
  codRemittance: {
    firstName: "Ravi",
    remittanceId: "RMT-990231",
    settlementDate: fmtDate(now),
    amount: "₹28,450.00",
    bankRefNo: "UTR2409180023841",
    remittanceLink: "https://app.quickpost.in/wallet/remittance/RMT-990231",
  },
  weightDiscrepancy: {
    firstName: "Ravi",
    shipmentId: "QP1029384",
    bookedWeight: "0.5 kg",
    actualWeight: "1.2 kg",
    difference: "+0.7 kg",
    shipmentLink: "https://app.quickpost.in/orders/QP1029384",
  },
  ndrShipmentAction: {
    firstName: "Ravi",
    shipmentId: "QP1029384",
    reason: "Customer not available",
    date: fmtDate(now),
    actionLink: "https://app.quickpost.in/ndr/QP1029384",
  },
  orderBooked: {
    firstName: "Ravi",
    orderId: "QP1029384",
    bookingDate: fmtDate(now),
    pickupDate: inDays(1),
    orderLink: "https://app.quickpost.in/orders/QP1029384",
  },
  orderShipped: {
    firstName: "Ravi",
    shipmentId: "QP1029384",
    trackingId: "TRK88213",
    pickupDate: fmtDate(now),
    trackingLink: "https://app.quickpost.in/track/TRK88213",
  },
  outForDelivery: {
    firstName: "Ravi",
    shipmentId: "QP1029384",
    trackingId: "TRK88213",
    expectedDate: fmtDate(now),
    trackingLink: "https://app.quickpost.in/track/TRK88213",
  },
  orderDelivered: {
    firstName: "Ravi",
    shipmentId: "QP1029384",
    deliveredDate: fmtDate(now),
    receiverName: "Ravi Kumar",
    feedbackLink: "https://app.quickpost.in/feedback/QP1029384",
  },
};

// Subject placeholders don't always match the prop name's casing 1:1
// (e.g. {{OTP}} -> otp, {{ShipmentID}} -> shipmentId, {{OrderID}} -> orderId,
// {{NotificationTitle}} -> title) — this is just for a readable preview list,
// not the real placeholder-filling logic sendEmail() will need.
const PLACEHOLDER_TO_PROP = {
  OTP: "otp",
  ShipmentID: "shipmentId",
  OrderID: "orderId",
  NotificationTitle: "title",
  ReportDate: "reportDate",
  Amount: "amount",
};

const manifest = [];
for (const [key, { component, subject }] of Object.entries(templates)) {
  const props = SAMPLE_PROPS[key] || {};
  const html = renderEmail(component, props);
  fs.writeFileSync(path.join(OUT_DIR, `${key}.html`), html);
  const filledSubject = subject.replace(/\{\{(\w+)\}\}/g, (_, k) => {
    const propKey = PLACEHOLDER_TO_PROP[k] || (k.charAt(0).toLowerCase() + k.slice(1));
    return props[propKey] ?? `{{${k}}}`;
  });
  manifest.push({ key, subject: filledSubject });
  console.log("✓ email-preview/" + key + ".html");
}

fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("✓ email-preview/manifest.json");
