import React from "react";
import { colors, font, img, brand } from "../theme";

const small = { fontFamily: font, fontSize: 13, lineHeight: "20px", color: colors.body };

function ContactLine({ icon, alt, href, children }) {
  return (
    <table role="presentation" cellPadding="0" cellSpacing="0" border="0" style={{ marginTop: 6 }}>
      <tbody>
        <tr>
          <td style={{ width: 24, verticalAlign: "middle" }}>
            <img src={img(icon)} width="16" height="16" alt={alt} style={{ display: "block" }} />
          </td>
          <td style={{ ...small, verticalAlign: "middle" }}>
            <a href={href} style={{ color: colors.body, textDecoration: "none" }}>
              {children}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function AppPromo() {
  return (
    <tr>
      <td className="qp-px" style={{ padding: "24px 48px 8px" }}>
        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{ border: `1px solid ${colors.border}`, borderRadius: 12, borderCollapse: "separate" }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "20px 24px", fontFamily: font }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.ink }}>
                  Take Quickpost with you
                </div>
                <div style={{ ...small, color: colors.muted, marginTop: 4 }}>
                  Track, manage and deliver on the go.
                </div>
                <table role="presentation" cellPadding="0" cellSpacing="0" border="0" style={{ marginTop: 14 }}>
                  <tbody>
                    <tr>
                      <td style={{ paddingRight: 10 }}>
                        <a href={brand.appStoreUrl}>
                          <img src={img("badge-app-store.png")} width="120" height="40" alt="Download on the App Store" style={{ display: "block" }} />
                        </a>
                      </td>
                      <td>
                        <a href={brand.playStoreUrl}>
                          <img src={img("badge-google-play.png")} width="135" height="40" alt="Get it on Google Play" style={{ display: "block" }} />
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/**
 * Common footer for all Quickpost emails.
 * variant="compact" → help strip + social + legal (used by every template)
 * variant="full"    → also shows the app-download block (template 12 in the design)
 */
export default function Footer({ variant = "compact" }) {
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0">
      <tbody>
        {/* help strip with truck */}
        <tr>
          <td style={{ backgroundColor: colors.primaryTint }}>
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border="0">
              <tbody>
                <tr>
                  <td
                    className="qp-col qp-col-pad"
                    style={{ padding: "22px 0 22px 48px", verticalAlign: "middle" }}
                  >
                    <div style={{ fontFamily: font, fontSize: 15, fontWeight: 600, color: colors.ink }}>
                      Need help?
                    </div>
                    <div style={{ ...small, color: colors.muted, marginBottom: 4 }}>
                      Our support team is here for you.
                    </div>
                    <ContactLine icon="icon-phone.png" alt="Phone" href={`tel:${brand.supportPhone.replace(/\s/g, "")}`}>
                      {brand.supportPhone}
                    </ContactLine>
                    <ContactLine icon="icon-mail.png" alt="Email" href={`mailto:${brand.supportEmail}`}>
                      {brand.supportEmail}
                    </ContactLine>
                  </td>
                  <td
                    className="qp-col"
                    align="right"
                    width="212"
                    style={{ padding: "12px 32px 0 0", verticalAlign: "bottom" }}
                  >
                    <img
                      src={img("footer-truck.png")}
                      width="180"
                      height="120"
                      alt=""
                      style={{ display: "inline-block", width: 180, height: 120 }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {variant === "full" ? <AppPromo /> : null}

        {/* social */}
        <tr>
          <td align="center" style={{ padding: "24px 24px 12px" }}>
            <table role="presentation" cellPadding="0" cellSpacing="0" border="0">
              <tbody>
                <tr>
                  {brand.social.map((s) => (
                    <td key={s.name} style={{ padding: "0 6px" }}>
                      <a href={s.url} target="_blank" rel="noreferrer">
                        <img src={img(s.icon)} width="32" height="32" alt={s.name} style={{ display: "block" }} />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </td>
        </tr>

        {/* legal */}
        <tr>
          <td
            align="center"
            style={{ padding: "4px 24px 28px", fontFamily: font, fontSize: 12, lineHeight: "20px", color: colors.muted }}
          >
            © {"{{current_year}}"} Quickpost. All rights reserved.
            <br />
            <a href={brand.privacyUrl} style={{ color: colors.primary, textDecoration: "none" }}>
              Privacy Policy
            </a>
            <span style={{ color: colors.border }}>{"\u00A0\u00A0|\u00A0\u00A0"}</span>
            <a href={brand.termsUrl} style={{ color: colors.primary, textDecoration: "none" }}>
              Terms of Service
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
