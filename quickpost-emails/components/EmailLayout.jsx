import React from "react";
import { colors, font, img, brand } from "../theme";
import Footer from "./Footer";

const responsiveCss = `
  body{margin:0;padding:0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table{border-collapse:collapse}
  img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic}
  a{color:${colors.primary}}
  @media only screen and (max-width:620px){
    .qp-container{width:100%!important;border-radius:0!important}
    .qp-px{padding-left:20px!important;padding-right:20px!important}
    .qp-col{display:block!important;width:100%!important;text-align:center!important}
    .qp-col-pad{padding:24px 20px 0 20px!important}
    .qp-col-pad table{margin-left:auto!important;margin-right:auto!important}
    .qp-h1{font-size:22px!important;line-height:30px!important}
    .qp-otp{font-size:28px!important;letter-spacing:8px!important}
    .qp-stat-value{font-size:20px!important}
    .qp-hero{width:240px!important}
  }
`;

/**
 * Shared shell for every Quickpost email.
 * @param preview  Hidden inbox preview text (shown after the subject line).
 * @param footer   "compact" (default) or "full" (adds the app-download block).
 * @param hero     { file, alt } main image shown on the green city backdrop, or null.
 */
export default function EmailLayout({ preview = "", footer = "compact", hero = null, children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <title>{brand.name}</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: responsiveCss }} />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: colors.canvas, fontFamily: font }}>
        {preview ? (
          <div
            style={{
              display: "none",
              maxHeight: 0,
              overflow: "hidden",
              opacity: 0,
              fontSize: 1,
              lineHeight: "1px",
              color: colors.canvas,
            }}
          >
            {preview}
          </div>
        ) : null}

        <table
          role="presentation"
          width="100%"
          cellPadding="0"
          cellSpacing="0"
          border="0"
          style={{ backgroundColor: colors.canvas }}
        >
          <tbody>
            <tr>
              <td align="center" style={{ padding: "32px 12px" }}>
                <table
                  role="presentation"
                  className="qp-container"
                  width="600"
                  cellPadding="0"
                  cellSpacing="0"
                  border="0"
                  style={{
                    width: 600,
                    maxWidth: "100%",
                    backgroundColor: colors.white,
                    borderRadius: 16,
                    overflow: "hidden",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <tbody>
                    {/* brand strip */}
                    <tr>
                      <td
                        style={{
                          height: 4,
                          lineHeight: "4px",
                          fontSize: 0,
                          backgroundColor: colors.primary,
                        }}
                      >
                        {"\u00A0"}
                      </td>
                    </tr>
                    {hero ? (
                      /* header scene: logo + main image on the green city backdrop */
                      <tr>
                        <td
                          align="center"
                          background={img("hero-backdrop.png")}
                          style={{
                            backgroundColor: colors.primaryTint,
                            backgroundImage: `url(${img("hero-backdrop.png")})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center bottom",
                            backgroundRepeat: "no-repeat",
                            padding: "28px 20px 22px",
                          }}
                        >
                          <a href={brand.website} target="_blank" rel="noreferrer">
                            <img
                              src={img("logo.png")}
                              width="160"
                              height="40"
                              alt="Quickpost"
                              style={{ display: "block", width: 160, height: 40, margin: "0 auto" }}
                            />
                          </a>
                          <img
                            className="qp-hero"
                            src={img(hero.file)}
                            width="300"
                            height="200"
                            alt={hero.alt || ""}
                            style={{
                              display: "block",
                              width: 300,
                              maxWidth: "100%",
                              height: "auto",
                              margin: "18px auto 0",
                            }}
                          />
                        </td>
                      </tr>
                    ) : (
                      /* plain logo header (templates without a main image) */
                      <tr>
                        <td align="center" style={{ padding: "28px 40px 4px" }}>
                          <a href={brand.website} target="_blank" rel="noreferrer">
                            <img
                              src={img("logo.png")}
                              width="160"
                              height="40"
                              alt="Quickpost"
                              style={{ display: "block", width: 160, height: 40 }}
                            />
                          </a>
                        </td>
                      </tr>
                    )}
                    {/* body */}
                    <tr>
                      <td
                        className="qp-px"
                        style={{
                          padding: hero ? "32px 48px 40px" : "8px 48px 40px",
                          fontFamily: font,
                          color: colors.body,
                        }}
                      >
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Footer variant={footer} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
