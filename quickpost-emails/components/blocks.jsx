import React from "react";
import { colors, font, img } from "../theme";

const P = (props) => (
  <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0" {...props} />
);

/* Tone system shared by StatusBadge, Heading and InfoTable/Notice —
   keeps every "this is good / this needs attention / this failed" signal
   consistent across all 11 templates instead of everything defaulting to ink black. */
const TONE = {
  success: { text: colors.primaryDark, bg: colors.primaryTint, border: colors.primary },
  warning: { text: colors.warningDark, bg: colors.warningTint, border: colors.warning },
  danger: { text: colors.dangerDark, bg: colors.dangerTint, border: colors.danger },
  info: { text: colors.info, bg: colors.infoTint, border: colors.info },
  neutral: { text: colors.ink, bg: colors.surface, border: colors.border },
};

/* ── Hero illustration (600×400 file, shown at 300×200) ──
   Sits on a soft brand-tinted panel with a rounded top, matching how
   Shiprocket/NimbusPost/Delhivery frame their hero art instead of
   floating it on plain white with no visual anchor. */
export function Hero({ file, alt = "", tone = "success" }) {
  const t = TONE[tone] || TONE.success;
  return (
    <P>
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              padding: "28px 0 24px",
              backgroundColor: t.bg,
              borderRadius: 16,
            }}
          >
            <img
              src={img(file)}
              width="280"
              height="187"
              alt={alt}
              style={{ display: "block", width: 280, maxWidth: "80%", height: "auto", margin: "0 auto" }}
            />
          </td>
        </tr>
      </tbody>
    </P>
  );
}

/* ── Status badge (eyebrow pill above the headline) ──
   The single biggest thing missing from a "read at a glance" transactional
   email: a colored status chip a recipient's eye lands on before the
   headline, e.g. DELIVERED / OUT FOR DELIVERY / ACTION REQUIRED. */
export function StatusBadge({ children, tone = "success" }) {
  const t = TONE[tone] || TONE.success;
  return (
    <table role="presentation" cellPadding="0" cellSpacing="0" border="0" align="center" style={{ margin: "0 auto" }}>
      <tbody>
        <tr>
          <td
            style={{
              backgroundColor: t.bg,
              border: `1px solid ${t.border}`,
              borderRadius: 999,
              padding: "6px 16px",
              fontFamily: font,
              fontSize: 11.5,
              fontWeight: 700,
              letterSpacing: "0.6px",
              textTransform: "uppercase",
              color: t.text,
              whiteSpace: "nowrap",
            }}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ── Headline ──
   Optional `badge` (see StatusBadge) sits above it and `tone` tints the
   headline itself slightly toward that same status colour, so a
   "Delivered" headline and a "Weight discrepancy" headline no longer
   look visually identical apart from their words. */
export function Heading({ children, sub, badge, tone = "neutral" }) {
  const t = TONE[tone] || TONE.neutral;
  const headingColor = tone === "neutral" ? colors.ink : t.text;
  return (
    <div style={{ textAlign: "center", margin: "0 0 28px" }}>
      {badge ? (
        <div style={{ marginBottom: 14 }}>
          <StatusBadge tone={tone}>{badge}</StatusBadge>
        </div>
      ) : null}
      <h1
        className="qp-h1"
        style={{
          margin: 0,
          fontFamily: font,
          fontSize: 27,
          lineHeight: "34px",
          fontWeight: 800,
          color: headingColor,
          letterSpacing: "-0.4px",
        }}
      >
        {children}
      </h1>
      {sub ? (
        <div style={{ marginTop: 10, fontFamily: font, fontSize: 14, color: colors.muted }}>{sub}</div>
      ) : null}
    </div>
  );
}

/* ── Paragraph ── */
export function Text({ children, muted, center, style }) {
  return (
    <p
      style={{
        margin: "0 0 16px",
        fontFamily: font,
        fontSize: 15,
        lineHeight: "24px",
        color: muted ? colors.muted : colors.body,
        textAlign: center ? "center" : "left",
        ...style,
      }}
    >
      {children}
    </p>
  );
}

export function Greeting({ name = "{{FirstName}}" }) {
  return (
    <Text style={{ color: colors.ink, fontWeight: 600 }}>Hi {name},</Text>
  );
}

/* ── Bulletproof button (works in Outlook) ── */
export function Button({ href = "#", children }) {
  return (
    <table
      role="presentation"
      cellPadding="0"
      cellSpacing="0"
      border="0"
      align="center"
      style={{ margin: "28px auto 8px" }}
    >
      <tbody>
        <tr>
          <td align="center" style={{ backgroundColor: colors.primary, borderRadius: 10 }}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-block",
                padding: "14px 36px",
                fontFamily: font,
                fontSize: 15,
                fontWeight: 600,
                lineHeight: "20px",
                color: "#FFFFFF",
                textDecoration: "none",
                borderRadius: 10,
              }}
            >
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ── Label / value table ──
   rows: [{ label, value, icon?, tone?, mono?, highlight? }]
   - `mono`      renders the value as a tracking/ID code (monospace, letter-spaced)
   - `highlight` makes that one row the visual anchor of the table — larger
     value text on a tinted background, like the "what matters most" line
     on a real courier's tracking receipt (expected delivery date, amount, etc.) */
export function InfoTable({ rows }) {
  const toneColor = { danger: colors.dangerDark, warning: colors.warningDark, success: colors.primaryDark, info: colors.info };
  const toneBg = { danger: colors.dangerTint, warning: colors.warningTint, success: colors.primaryTint, info: colors.infoTint };
  return (
    <P
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        borderCollapse: "separate",
        margin: "8px 0 24px",
      }}
    >
      <tbody>
        {rows.map((r, i) => (
          <tr key={r.label}>
            <td
              style={{
                padding: r.highlight ? "16px 0 16px 20px" : "14px 0 14px 20px",
                borderTop: i === 0 ? "none" : `1px solid ${colors.border}`,
                backgroundColor: r.highlight && r.tone ? toneBg[r.tone] : "transparent",
                fontFamily: font,
                fontSize: 13,
                lineHeight: "20px",
                fontWeight: r.highlight ? 600 : 400,
                color: r.highlight ? colors.ink : colors.muted,
                width: "42%",
                verticalAlign: "middle",
              }}
            >
              {r.icon ? (
                <img
                  src={img(r.icon)}
                  width="18"
                  height="18"
                  alt=""
                  style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }}
                />
              ) : null}
              <span style={{ verticalAlign: "middle" }}>{r.label}</span>
            </td>
            <td
              style={{
                padding: r.highlight ? "16px 20px 16px 12px" : "14px 20px 14px 12px",
                borderTop: i === 0 ? "none" : `1px solid ${colors.border}`,
                backgroundColor: r.highlight && r.tone ? toneBg[r.tone] : "transparent",
                fontFamily: r.mono ? "'Courier New', Courier, monospace" : font,
                fontSize: r.highlight ? 16 : 14,
                lineHeight: r.highlight ? "22px" : "20px",
                fontWeight: 700,
                letterSpacing: r.mono ? "0.4px" : "normal",
                color: r.tone ? toneColor[r.tone] : colors.ink,
                textAlign: "right",
                verticalAlign: "middle",
                wordBreak: "break-word",
              }}
            >
              {r.value}
            </td>
          </tr>
        ))}
      </tbody>
    </P>
  );
}

/* ── Large amount display (money deserves more weight than a table row) ── */
export function AmountDisplay({ label = "Amount", value, tone = "success" }) {
  const t = TONE[tone] || TONE.success;
  return (
    <P style={{ margin: "8px 0 20px" }}>
      <tbody>
        <tr>
          <td
            align="center"
            style={{
              backgroundColor: t.bg,
              border: `1px solid ${t.border}`,
              borderRadius: 14,
              padding: "22px 20px",
            }}
          >
            <div style={{ fontFamily: font, fontSize: 12.5, fontWeight: 600, color: colors.muted, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              {label}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: font,
                fontSize: 36,
                lineHeight: "42px",
                fontWeight: 800,
                color: t.text,
                letterSpacing: "-0.5px",
              }}
            >
              {value}
            </div>
          </td>
        </tr>
      </tbody>
    </P>
  );
}

/* ── Callout box with icon ── */
export function Notice({ icon, tone = "success", children }) {
  const t = TONE[tone] || TONE.success;
  return (
    <P style={{ backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: 12, borderCollapse: "separate", margin: "8px 0 24px" }}>
      <tbody>
        <tr>
          {icon ? (
            <td style={{ width: 24, padding: "14px 0 14px 18px", verticalAlign: "top" }}>
              <img src={img(icon)} width="24" height="24" alt="" style={{ display: "block" }} />
            </td>
          ) : null}
          <td
            style={{
              padding: "14px 18px 14px 12px",
              fontFamily: font,
              fontSize: 13,
              lineHeight: "20px",
              fontWeight: 500,
              color: colors.body,
              verticalAlign: "middle",
            }}
          >
            {children}
          </td>
        </tr>
      </tbody>
    </P>
  );
}

/* ── OTP code box (works with a real code or a {{OTP}} placeholder) ── */
export function OtpCode({ code = "{{OTP}}" }) {
  return (
    <P style={{ margin: "8px 0 16px" }}>
      <tbody>
        <tr>
          <td align="center">
            <div
              className="qp-otp"
              style={{
                display: "inline-block",
                padding: "16px 20px 16px 32px",
                border: `2px dashed ${colors.primary}`,
                borderRadius: 12,
                backgroundColor: colors.primaryTint,
                fontFamily: "'Courier New', Courier, monospace",
                fontSize: 34,
                lineHeight: "40px",
                fontWeight: 700,
                letterSpacing: 12,
                color: colors.primaryDark,
              }}
            >
              {code}
            </div>
          </td>
        </tr>
      </tbody>
    </P>
  );
}

/* ── Shipment progress tracker ──
   current: 0 Booked · 1 Shipped · 2 Out for delivery · 3 Delivered
   failed:  true marks the current step red (used by NDR) */
const STEPS = ["Booked", "Shipped", "Out for delivery", "Delivered"];

export function StatusTracker({ current = 0, failed = false }) {
  return (
    <P style={{ margin: "4px 0 28px" }}>
      <tbody>
        <tr>
          {STEPS.map((label, i) => {
            const done = i < current;
            const active = i === current;
            const isFail = failed && active;
            const barColor = isFail ? colors.danger : i <= current ? colors.primary : colors.border;
            const textColor = isFail ? colors.dangerDark : active ? colors.primaryDark : done ? colors.body : colors.muted;
            return (
              <td key={label} width="25%" style={{ padding: "0 3px", verticalAlign: "top" }}>
                <P>
                  <tbody>
                    <tr>
                      <td
                        style={{
                          height: 8,
                          fontSize: 0,
                          lineHeight: "8px",
                          backgroundColor: barColor,
                          borderRadius: 4,
                        }}
                      >
                        {"\u00A0"}
                      </td>
                    </tr>
                  </tbody>
                </P>
                <div
                  style={{
                    marginTop: 10,
                    fontFamily: font,
                    fontSize: active || isFail ? 12.5 : 12,
                    lineHeight: "16px",
                    textAlign: "center",
                    fontWeight: active || isFail ? 700 : 500,
                    color: textColor,
                  }}
                >
                  {done ? "✓ " : ""}
                  {isFail ? "Attempt failed" : label}
                </div>
              </td>
            );
          })}
        </tr>
      </tbody>
    </P>
  );
}

/* ── 3-column stat grid for reports ──
   stats: [{ icon, label, value, tone? }] */
export function StatGrid({ stats }) {
  const rows = [];
  for (let i = 0; i < stats.length; i += 3) rows.push(stats.slice(i, i + 3));
  return (
    <P style={{ margin: "8px 0 16px", tableLayout: "fixed" }}>
      <tbody>
        {rows.map((row, r) => (
          <tr key={r}>
            {row.map((s) => {
              const t = s.tone ? TONE[s.tone] : null;
              return (
                <td key={s.label} width="33%" style={{ padding: 5, verticalAlign: "top" }}>
                  <P
                    style={{
                      backgroundColor: t ? t.bg : colors.surface,
                      border: `1px solid ${t ? t.border : colors.border}`,
                      borderRadius: 12,
                      borderCollapse: "separate",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td align="center" style={{ padding: "18px 8px 16px", fontFamily: font }}>
                          <img src={img(s.icon)} width="40" height="40" alt="" style={{ display: "block", margin: "0 auto" }} />
                          <div
                            className="qp-stat-value"
                            style={{
                              marginTop: 10,
                              fontSize: 24,
                              lineHeight: "30px",
                              fontWeight: 800,
                              color: t ? t.text : colors.ink,
                              wordBreak: "break-word",
                            }}
                          >
                            {s.value}
                          </div>
                          <div style={{ marginTop: 2, fontSize: 12, lineHeight: "16px", fontWeight: 500, color: colors.muted }}>
                            {s.label}
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </P>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </P>
  );
}
