// ─────────────────────────────────────────────────────────────
// Quickpost email theme – change these values in ONE place.
// ─────────────────────────────────────────────────────────────

// Email clients can't load images from your local project.
// Upload everything in /email-images to a CDN/S3 bucket and put that URL here.
export const IMAGE_BASE_URL = "https://cdn.quickpost.com/email";
export const img = (file) => `${IMAGE_BASE_URL}/${file}`;

export const colors = {
  primary: "#178A4A",
  primaryDark: "#0F6B38",
  primaryTint: "#EAF6EF",
  canvas: "#F3F6F4",
  white: "#FFFFFF",
  surface: "#F8FAF9",
  ink: "#16231C",
  body: "#3F4B45",
  muted: "#6B7771",
  border: "#E3E9E5",
  danger: "#D93A3A",
  dangerDark: "#8C1E1E",
  dangerTint: "#FDEDED",
  warning: "#B86E00",
  warningDark: "#7A4400",
  warningTint: "#FFF5E5",
  info: "#1D4ED8",
  infoTint: "#EAF1FE",
};

export const font =
  "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Helvetica, Arial, sans-serif";

export const brand = {
  name: "Quickpost",
  website: "https://www.quickpost.in/",
  dashboardUrl: "https://app.quickpost.com",
  supportEmail: "support@quickpost.com",
  supportPhone: "+91 98765 43210",
  privacyUrl: "https://quickpost.com/privacy",
  termsUrl: "https://quickpost.com/terms",
  appStoreUrl: "https://apps.apple.com/",
  playStoreUrl: "https://play.google.com/store",
  social: [
    { name: "Facebook", icon: "social-facebook.png", url: "https://facebook.com/quickpost" },
    { name: "X", icon: "social-x.png", url: "https://x.com/quickpost" },
    { name: "Instagram", icon: "social-instagram.png", url: "https://instagram.com/quickpost" },
    { name: "LinkedIn", icon: "social-linkedin.png", url: "https://linkedin.com/company/quickpost" },
  ],
};
