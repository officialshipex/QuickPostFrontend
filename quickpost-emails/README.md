# Quickpost Email Templates (React)

11 transactional email templates plus a shared layout and footer, built for real email clients (Gmail, Outlook, Apple Mail, Yahoo): table-based layout, inline styles, Outlook-safe buttons, 600px wide, stacks on mobile.

## Folder structure

```
quickpost-emails/
├── theme.js              ← brand colours, support contact, social links, IMAGE_BASE_URL
├── render.js             ← renderEmail(Component, props) → HTML string
├── index.js              ← all templates + subjects in one map
├── export-html.jsx       ← writes every template to /html for preview
├── IMAGE_GUIDE.md        ← every image: file name, dimensions, ChatGPT prompt
├── components/
│   ├── EmailLayout.jsx   ← shell: green strip, logo, body, footer
│   ├── Footer.jsx        ← common footer (compact / full)
│   └── blocks.jsx        ← Hero, Heading, Text, Button, InfoTable, Notice,
│                            OtpCode, StatusTracker, StatGrid
└── templates/            ← the 11 emails
```

## Setup

1. Copy the `quickpost-emails` folder into your project (e.g. `src/emails/`).
2. Needs `react` and `react-dom` only (v17+). No other packages.
3. Upload images (see IMAGE_GUIDE.md) and set `IMAGE_BASE_URL` in `theme.js`.
4. Update phone, email and social URLs in `theme.js`.

## Usage

**Option A: fill values in React (e.g. in your Node backend):**
```js
import { templates, renderEmail } from "./emails";

const { component, subject } = templates.outForDelivery;
const html = renderEmail(component, {
  firstName: "Ravi",
  shipmentId: "QP1029384",
  trackingId: "TRK88213",
  expectedDate: "19 Sep 2026",
  trackingLink: "https://app.quickpost.com/track/TRK88213",
});
// send `html` with Nodemailer / SES / SendGrid
```

**Option B: keep {{placeholders}}:** call `renderEmail(component)` with no props. The HTML keeps `{{FirstName}}`, `{{ShipmentID}}` etc., ready for your template engine or for pasting into Quickpost's template editor. `{{current_year}}` in the footer is always a placeholder.

## Preview in a browser

```bash
npx esbuild export-html.jsx --bundle --platform=node --outfile=.export.cjs --loader:.js=jsx
node .export.cjs     # → html/*.html
```

## Templates & variables

| Template | Props |
|---|---|
| EmailVerificationOtp | firstName, otp, expiryMinutes |
| ForgotPassword | firstName, resetLink, expiryMinutes |
| NotificationUpdate | firstName, title, message, dateTime, referenceId, details, dashboardLink |
| ShipmentMisReport | firstName, reportDate, totalShipments, pickedUp, inTransit, delivered, rtoNdr, codCollected, reportLink |
| CodRemittance | firstName, remittanceId, settlementDate, amount, bankRefNo, remittanceLink |
| WeightDiscrepancy | firstName, shipmentId, bookedWeight, actualWeight, difference, shipmentLink |
| NdrShipmentAction | firstName, shipmentId, reason, date, actionLink |
| OrderBooked | firstName, orderId, bookingDate, pickupDate, orderLink |
| OrderShipped | firstName, shipmentId, trackingId, pickupDate, trackingLink |
| OutForDelivery | firstName, shipmentId, trackingId, expectedDate, trackingLink |
| OrderDelivered | firstName, shipmentId, deliveredDate, receiverName, feedbackLink |

Each template file also exports a suggested `subject` line.

## Footer variants

All templates use the compact footer. To show the app-download block (design #12), pass `footer="full"` to `<EmailLayout>` in any template.

## Before going live

- Send test emails to Gmail (web + app), Outlook desktop and iPhone Mail.
- Keep total HTML under 100 KB or Gmail clips the email (these are about 13 KB each).
