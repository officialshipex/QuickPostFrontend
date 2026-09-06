import React from "react";

/**
 * Welcome + email-verification transactional email.
 *
 * Design system note: every visual element here is pulled from QuickPost's
 * actual product, not invented for this email —
 *   - Logo:        the real /logo-color.png mark used in the app header/footer
 *   - Hero photo:  the same delivery-courier photograph used on the
 *                  login/signup hero (src/assets/hero-image.png), framed in
 *                  the same circular crop MobileAuthHero.tsx uses for it
 *   - Feature icons: the real Lucide/Tabler-style outline icon paths this
 *                  app already uses for these exact concepts — Zap (used for
 *                  "Fast Delivery"/wallet speed contexts), MapPin (the same
 *                  icon Features.tsx uses for "Real-Time Tracking"), and
 *                  ShieldCheck (the icon this app uses everywhere for
 *                  verification/security, e.g. the KYC pages) — reproduced
 *                  as raw <path> data so they render without any JS/font
 *                  dependency in an email client
 *   - Social icons: the same inline LinkedIn/Instagram/X/YouTube outline
 *                  SVGs as Footer.tsx, at the same stroke weight
 *
 * There is intentionally no "download our app" section: QuickPost has no
 * mobile app and no App Store/Play Store assets anywhere in the product, so
 * fabricating badge graphics here would be dishonest to what the product is.
 *
 * All images are referenced by absolute URL (`assetBaseUrl` + path) since a
 * received email can never load a bundler-relative or local filesystem
 * path — point `assetBaseUrl` at wherever these three files are hosted
 * (the app's own public/ origin, or a CDN mirror of it).
 */

export interface WelcomeEmailProps {
  firstName: string;
  verifyUrl: string;
  supportEmail?: string;
  /**
   * Origin the three image assets below are served from, e.g.
   * "https://app.quickpost.in". Combined with each asset's path
   * (see ASSET_PATHS) to build the absolute <img src> the email needs.
   */
  assetBaseUrl?: string;
}

const BRAND = "#009d64";
const BRAND_DARK = "#00794d";
const INK = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e6ece9";
const SURFACE = "#f4faf7";

/** Real asset paths already served by the app — see file header for provenance. */
const ASSET_PATHS = {
  logo: "/logo-color.png",
  heroPhoto: "/assets/hero-image.png",
};

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com/company/quickpost" },
  { label: "Instagram", href: "https://instagram.com/quickpost" },
  { label: "X", href: "https://x.com/quickpost" },
  { label: "YouTube", href: "https://youtube.com/@quickpost" },
];

/** Tabler/Lucide-style 24x24 outline icon, stroke-only — matches the app's own icon language exactly. */
function OutlineIcon({
  d,
  size = 18,
  color = "#ffffff",
}: {
  d: string | string[];
  size?: number;
  color?: string;
}) {
  const paths = Array.isArray(d) ? d : [d];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((p, i) => (
        <path key={i} d={p} />
      ))}
    </svg>
  );
}

// Real icon path data lifted verbatim from this app's own icon set.
const ICON_PATHS = {
  // lucide-react "zap" — same icon this app uses for speed/fast-action contexts
  zap: "M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",
  // Features.tsx's own MapPin icon, used there for "Real-Time Tracking"
  mapPin: ["M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z", "M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0"],
  // lucide-react "shield-check" — the icon this app uses everywhere for verification/security (KYC pages)
  shieldCheck: [
    "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    "m9 12 2 2 4-4",
  ],
  linkedIn: [
    "M4 4m0 2a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z",
    "M8 11l0 5",
    "M8 8l0 .01",
    "M12 16l0 -5",
    "M16 16v-3a2 2 0 0 0 -4 0",
  ],
  instagram: [
    "M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z",
    "M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
    "M16.5 7.5l0 .01",
  ],
  x: ["M4 4l11.733 16h4.267l-11.733 -16z", "M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"],
  youTube: ["M2 8a4 4 0 0 1 4 -4h12a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4v-8z", "M10 9l5 3l-5 3z"],
};

const SOCIAL_ICON_PATHS: Record<string, string | string[]> = {
  LinkedIn: ICON_PATHS.linkedIn,
  Instagram: ICON_PATHS.instagram,
  X: ICON_PATHS.x,
  YouTube: ICON_PATHS.youTube,
};

const fontStack =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export default function WelcomeEmail({
  firstName,
  verifyUrl,
  supportEmail = "support@quickpost.in",
  assetBaseUrl = "https://app.quickpost.in",
}: WelcomeEmailProps) {
  const logoSrc = `${assetBaseUrl}${ASSET_PATHS.logo}`;
  const heroSrc = `${assetBaseUrl}${ASSET_PATHS.heroPhoto}`;

  return (
    <div
      style={{
        margin: 0,
        padding: "40px 16px",
        backgroundColor: SURFACE,
        fontFamily: fontStack,
        color: INK,
      }}
    >
      <table
        width="100%"
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={{ borderCollapse: "collapse" }}
      >
        <tbody>
          <tr>
            <td align="center">
              {/* MAIN CONTAINER */}
              <table
                width={600}
                cellPadding={0}
                cellSpacing={0}
                role="presentation"
                style={{
                  width: "100%",
                  maxWidth: 600,
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  backgroundColor: "#ffffff",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 16,
                  overflow: "hidden",
                }}
              >
                <tbody>
                  {/* ============ HEADER / LOGO ============ */}
                  <tr>
                    <td align="center" style={{ padding: "36px 32px 8px" }}>
                      <img
                        src={logoSrc}
                        alt="QuickPost"
                        width={168}
                        style={{
                          display: "block",
                          width: 168,
                          maxWidth: "60%",
                          height: "auto",
                          margin: "0 auto",
                        }}
                      />
                    </td>
                  </tr>

                  {/* ============ HERO ============ */}
                  <tr>
                    <td style={{ padding: "20px 40px 8px" }}>
                      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                        <tbody>
                          <tr>
                            <td align="center" style={{ paddingBottom: 24 }}>
                              <table cellPadding={0} cellSpacing={0} role="presentation">
                                <tbody>
                                  <tr>
                                    <td
                                      style={{
                                        width: 104,
                                        height: 104,
                                        borderRadius: "50%",
                                        backgroundColor: BRAND,
                                        padding: 4,
                                      }}
                                    >
                                      <img
                                        src={heroSrc}
                                        width={96}
                                        height={96}
                                        alt="QuickPost delivery courier"
                                        style={{
                                          display: "block",
                                          width: 96,
                                          height: 96,
                                          borderRadius: "50%",
                                          objectFit: "cover",
                                          border: "3px solid #ffffff",
                                        }}
                                      />
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>

                          <tr>
                            <td align="center">
                              <h1
                                style={{
                                  margin: 0,
                                  fontSize: 28,
                                  lineHeight: "36px",
                                  fontWeight: 800,
                                  letterSpacing: "-0.5px",
                                  color: INK,
                                }}
                              >
                                Welcome to <span style={{ color: BRAND }}>QuickPost!</span>
                              </h1>

                              <p
                                style={{
                                  margin: "14px auto 0",
                                  maxWidth: 440,
                                  fontSize: 14,
                                  lineHeight: "23px",
                                  color: MUTED,
                                }}
                              >
                                We&rsquo;re excited to have you on board. Your journey to faster,
                                smarter and more reliable deliveries starts now.
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* ============ VERIFICATION CARD ============ */}
                  <tr>
                    <td style={{ padding: "8px 24px 8px" }}>
                      <table
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        role="presentation"
                        style={{
                          backgroundColor: SURFACE,
                          border: `1px solid ${BORDER}`,
                          borderRadius: 14,
                        }}
                      >
                        <tbody>
                          <tr>
                            <td align="center" style={{ padding: "30px 24px" }}>
                              <table cellPadding={0} cellSpacing={0} role="presentation">
                                <tbody>
                                  <tr>
                                    <td
                                      align="center"
                                      valign="middle"
                                      style={{
                                        width: 48,
                                        height: 48,
                                        borderRadius: "50%",
                                        backgroundColor: BRAND,
                                      }}
                                    >
                                      <OutlineIcon d={ICON_PATHS.shieldCheck} size={22} color="#ffffff" />
                                    </td>
                                  </tr>
                                </tbody>
                              </table>

                              <h2
                                style={{
                                  margin: "16px 0 0",
                                  fontSize: 19,
                                  lineHeight: "27px",
                                  fontWeight: 700,
                                  color: INK,
                                }}
                              >
                                Hi {firstName},
                              </h2>

                              <p
                                style={{
                                  margin: "8px auto 22px",
                                  maxWidth: 420,
                                  fontSize: 13,
                                  lineHeight: "21px",
                                  color: MUTED,
                                }}
                              >
                                Your QuickPost account has been created successfully. Please
                                verify your email address to get started.
                              </p>

                              <table cellPadding={0} cellSpacing={0} role="presentation">
                                <tbody>
                                  <tr>
                                    <td
                                      align="center"
                                      style={{ borderRadius: 8, backgroundColor: BRAND }}
                                    >
                                      <a
                                        href={verifyUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                          display: "inline-block",
                                          padding: "14px 30px",
                                          fontSize: 13,
                                          lineHeight: "18px",
                                          fontWeight: 700,
                                          color: "#ffffff",
                                          textDecoration: "none",
                                          borderRadius: 8,
                                        }}
                                      >
                                        Verify Email Address&nbsp;&nbsp;&rarr;
                                      </a>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>

                              <p style={{ margin: "16px 0 0", fontSize: 11, color: "#9aa5b1" }}>
                                This verification link will expire in 24 hours.
                              </p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* ============ FEATURES ============ */}
                  <tr>
                    <td style={{ padding: "36px 32px 16px" }}>
                      <h2
                        style={{
                          margin: 0,
                          textAlign: "center",
                          fontSize: 17,
                          lineHeight: "25px",
                          fontWeight: 700,
                          color: INK,
                        }}
                      >
                        Everything you need. <span style={{ color: BRAND }}>Delivered better.</span>
                      </h2>

                      <table
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        role="presentation"
                        style={{ marginTop: 24 }}
                      >
                        <tbody>
                          <tr>
                            {[
                              { icon: ICON_PATHS.zap, title: "Fast Delivery", desc: "Get your parcels delivered quickly and securely." },
                              { icon: ICON_PATHS.mapPin, title: "Real-time Tracking", desc: "Track your shipments in real time, every step." },
                              { icon: ICON_PATHS.shieldCheck, title: "Secure & Reliable", desc: "We ensure your parcels are always safe." },
                            ].map((feature) => (
                              <td key={feature.title} width="33.33%" align="center" valign="top" style={{ padding: "0 8px" }}>
                                <table cellPadding={0} cellSpacing={0} role="presentation">
                                  <tbody>
                                    <tr>
                                      <td
                                        align="center"
                                        valign="middle"
                                        style={{
                                          width: 44,
                                          height: 44,
                                          margin: "0 auto",
                                          borderRadius: "50%",
                                          backgroundColor: SURFACE,
                                        }}
                                      >
                                        <OutlineIcon d={feature.icon} size={19} color={BRAND} />
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>

                                <div
                                  style={{
                                    marginTop: 10,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: INK,
                                  }}
                                >
                                  {feature.title}
                                </div>
                                <div
                                  style={{
                                    marginTop: 5,
                                    fontSize: 11,
                                    lineHeight: "16px",
                                    color: MUTED,
                                  }}
                                >
                                  {feature.desc}
                                </div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>

                  {/* ============ SUPPORT ============ */}
                  <tr>
                    <td style={{ padding: "8px 24px 32px" }}>
                      <table
                        width="100%"
                        cellPadding={0}
                        cellSpacing={0}
                        role="presentation"
                        style={{ backgroundColor: BRAND, borderRadius: 12 }}
                      >
                        <tbody>
                          <tr>
                            <td style={{ padding: "20px 22px" }}>
                              <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
                                <tbody>
                                  <tr>
                                    <td width="62%">
                                      <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                                        Need help?
                                      </div>
                                      <div
                                        style={{
                                          marginTop: 5,
                                          fontSize: 11,
                                          lineHeight: "17px",
                                          color: "rgba(255,255,255,0.85)",
                                        }}
                                      >
                                        Our support team is here for you, whenever you need us.
                                      </div>
                                    </td>
                                    <td width="38%" align="right">
                                      <a
                                        href={`mailto:${supportEmail}`}
                                        style={{
                                          display: "inline-block",
                                          padding: "9px 14px",
                                          backgroundColor: "#ffffff",
                                          color: BRAND_DARK,
                                          fontSize: 11,
                                          fontWeight: 700,
                                          textDecoration: "none",
                                          borderRadius: 999,
                                          whiteSpace: "nowrap",
                                        }}
                                      >
                                        {supportEmail}
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

                  {/* ============ FOOTER ============ */}
                  <tr>
                    <td
                      align="center"
                      style={{
                        padding: "24px 25px 28px",
                        borderTop: `1px solid ${BORDER}`,
                      }}
                    >
                      <table cellPadding={0} cellSpacing={0} role="presentation">
                        <tbody>
                          <tr>
                            {socialLinks.map((social) => (
                              <td key={social.label} style={{ padding: "0 5px" }}>
                                <a href={social.href} target="_blank" rel="noreferrer">
                                  <table cellPadding={0} cellSpacing={0} role="presentation">
                                    <tbody>
                                      <tr>
                                        <td
                                          align="center"
                                          valign="middle"
                                          style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: "50%",
                                            backgroundColor: SURFACE,
                                            border: `1px solid ${BORDER}`,
                                          }}
                                        >
                                          <OutlineIcon
                                            d={SOCIAL_ICON_PATHS[social.label]}
                                            size={15}
                                            color={BRAND}
                                          />
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </a>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>

                      <p style={{ margin: "16px 0 6px", fontSize: 11, color: MUTED }}>
                        Thank you for choosing{" "}
                        <strong style={{ color: BRAND }}>QuickPost.</strong>
                      </p>

                      <p style={{ margin: 0, fontSize: 9, lineHeight: "15px", color: "#9aa5b1" }}>
                        &copy; {new Date().getFullYear()} QuickPost. All rights reserved.
                      </p>

                      <p style={{ margin: "3px 0 0", fontSize: 9, color: "#b0b4b8" }}>
                        You received this email because you signed up for QuickPost.
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
