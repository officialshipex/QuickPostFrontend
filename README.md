<div align="center">

# 📦 QuickPost — Seller & Admin Console

**Ship anything, anywhere in India — parcels with QuickPost B2C, pallets and multi-box loads with QuickPost Cargo.**

React 19 · TypeScript · Vite · Tailwind CSS v4 · Framer Motion

</div>

---

QuickPost is a multi-courier shipping platform. Sellers create orders, compare live courier rates, ship, track,
handle NDRs and weight disputes, and get COD remitted — all from one console. Admins run the platform from the
same app: sellers, couriers, rate cards, KYC, support and white-label companies.

## ✨ What's inside

| For sellers | For admins |
| --- | --- |
| 🏠 Home & dashboard with live shipment insights | 🏢 White-label **Companies** (own domain, branding, DB) |
| 🛒 Orders → compare rates → ship in one modal | 👥 Seller accounts, employees & role-based permissions |
| 🚚 **B2C ⇄ Cargo switch** — Cargo opens in its own tab | 🧾 Rate cards, courier setup, EDD / EPD mapping |
| 🔁 NDR actions, weight-discrepancy disputes | 🪪 KYC review, audit logs, announcements |
| 💰 Wallet, COD remittance, invoices | 📊 Internal CRM: shipments, leads, escalations |
| 🛡️ RTO risk on every order, branded tracking page | 🎫 Support tickets across all sellers |

Every page is built **desktop + mobile** — mobile layouts are first-class, not a squeezed desktop.

## 🚀 Getting started

```bash
npm install
npm run dev        # http://localhost:5173 (exposed on your LAN via --host)
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) and production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint (incl. React Hooks + React Compiler rules) |

### Environment

Create a `.env` in the project root:

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Backend base URL, e.g. `https://api.example.com/api/v1` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay key for wallet recharges |
| `VITE_BRANDED_TRACKING_API` | Backend for the public branded tracking page |

> Never commit `.env` — it's per-environment.

## 🗂️ Project map

```
src/
├── pages/
│   ├── admin/        # Seller (/user/*) and admin (/admin/*) pages — one component serves both panels
│   ├── cargo/        # QuickPost Cargo pages (separate files, same UI, Cargo data source)
│   └── *.tsx         # Public pages: landing, login, tracking, policies
├── components/
│   ├── admin/        # Layout (shell, header, sidebar), orders, dashboard, companies…
│   └── ui/           # Shared building blocks: dropdowns, date filter, toasts, loaders…
├── config/           # Feature switches you edit, not code you rewrite (see below)
├── context/          # Auth/user, dashboard filters, B2C ⇄ Cargo mode
├── hooks/            # Filters, pagination, toasts…
├── services/         # apiClient (B2C) and cargoApiClient (Cargo)
└── utils/            # Session, permissions, clipboard, domain helpers
```

## 🧠 How a few things work

<details>
<summary><b>🚚 B2C ⇄ Cargo</b></summary>

- The **B2C / Cargo** switch lives on the seller Home navbar. Picking Cargo plays a short branded transition and
  opens Cargo **in a new tab** — the B2C tab stays B2C.
- Mode is stored **per tab** and tied to the login session: refresh keeps it, a fresh login starts in B2C.
- Cargo has its own page files in `src/pages/cargo/` (Home, Dashboard, Orders, NDR, Weight Discrepancy,
  Rate Calculator), routed through `ModeRoute` on the same URLs as B2C.
- Cargo pages talk only to `cargoApiClient` (`/cargo/...`). Until the Cargo backend ships,
  `CARGO_BACKEND_READY = false` keeps every request local and pages show their empty states.
- Which sections appear in Cargo: **`src/config/cargo.ts`** → `CARGO_ALLOWED_PATHS`.

</details>

<details>
<summary><b>📣 "What's New" announcements</b></summary>

A small card that slides in on Home, Dashboard, Orders (and page-specific ones, e.g. Channels).
Add an entry to **`src/config/announcements.ts`** with a new `id` — that's it. Use `pages` to target a page,
and `ANNOUNCEMENT_EVERY_LOGIN` to choose between "every login" and "once per seller".

</details>

<details>
<summary><b>📅 Filters that remember</b></summary>

- On the seller side, a date range picked on any page (Orders, NDR, Weight Discrepancy, Wallet, COD…) is shared
  across all of them until logout, Clear All, or switching back to the default *Last 7 days*.
- Filter bars show **Apply Filters** only while there are unapplied changes, then **Clear All** once applied.

</details>

<details>
<summary><b>🔐 Panels & permissions</b></summary>

- `/user/*` is the seller panel, `/admin/*` the admin panel; most page components serve both and read the
  panel from the URL.
- Employees get per-module **View / Edit / Delete** rights, defined once in `src/utils/permissions.ts` and
  shared by the sidebar, route guard and the Employees screen.

</details>

## 🎨 UI conventions

- **Brand green** `#00A86B` (hover `#009B63`), text `#0F172A` / `#475569` / `#64748B`, surfaces `#F8FAFC`.
- Inputs and buttons are pill-shaped (`rounded-full`, `h-10`); cards are `rounded-2xl` with a soft shadow.
- Every new screen ships with its mobile layout (`md:` breakpoints, bottom sheets on phones).
- Empty states get an illustration + one clear line; progress uses the thin green top bar.

## ☁️ Deployment

Deployed on **Vercel** (`vercel.json`): SPA rewrites to `index.html`, and `quickpost.in` / `www.quickpost.in`
redirect to `app.quickpost.in`.

---

<div align="center">
<sub>Built with care for Indian e-commerce sellers 🇮🇳 · Move bigger. Grow faster.</sub>
</div>
