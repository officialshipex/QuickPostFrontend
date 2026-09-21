# Quickpost Email Images: Dimensions & Prompts

## Rules for every image

1. **Format:** PNG. (Gmail and Outlook block SVG, and WebP isn't supported everywhere.)
2. **Size:** Every image is created at **2× its display size** so it stays sharp on phones and Retina screens. The code already shrinks it to the right display size.
3. **ChatGPT can't output odd sizes directly.** It generates 1536×1024 (landscape 3:2) or 1024×1024 (square). Generate at the size given below, then resize to the exact final size (Photoshop, Canva, or squoosh.app). The ratios already match, so nothing gets cropped.
4. **File names must match exactly**. The code looks for these names.
5. **Hosting:** Upload all images to your CDN/S3 bucket and set `IMAGE_BASE_URL` in `theme.js`. Email clients can't read images from your local project folder.
6. **Keep each file under 150 KB** (compress with tinypng.com). Heavy emails get clipped by Gmail.

## Step 1: Paste this style prompt first (same chat, every time)

Attach your Quickpost logo, then send this once at the start of the ChatGPT conversation so every image looks like part of one family:

```
I'm creating a set of email illustrations for Quickpost, an Indian courier and logistics company. The attached image is the Quickpost logo. For every image I ask for in this chat, follow this style:

- Clean 3D illustration, soft matte clay render, rounded friendly shapes
- Brand colours: Quickpost green #178A4A, darker green #0F6B38 for shading, white and light grey accents. Use red #D93A3A or amber #F5A524 only where I ask for it
- Soft studio lighting, one subtle soft shadow under the main object
- Main object centred with about 15% empty space on every side
- Place the attached Quickpost logo exactly as provided (same shape, colours and lettering, do not redraw or misspell it) in the spot I describe
- No other text, words, numbers or watermarks unless I ask for them
- Same camera angle (slightly from above, 3/4 view) for every image

Reply "ready" and I'll send the images one by one.
```

**If ChatGPT distorts the logo** (common with AI image tools): ask it to leave that area as a plain green or white panel, then paste your real logo on top in Canva or Photoshop. That gives the cleanest result.

---

## Step 2: Hero illustrations

**Generate at 1536×1024 → resize to 600×400** (displayed at 300×200). **Background: transparent.**

These images sit on the green city backdrop (`hero-backdrop.png`) at the top of each email. Any white or off-white background around the object shows up as an ugly box, so the background must be transparent.

**Already generated them with a white background?** Don't regenerate. Upload each one to **remove.bg**, download the result (it's a transparent PNG), and resize it back to 600×400 with the same file name.

| # | File name | Used in |
|---|---|---|
| 1 | `hero-otp.png` | Email Verification OTP |
| 2 | `hero-password.png` | Forgot Password |
| 3 | `hero-notification.png` | Notifications & Updates |
| 5 | `hero-cod.png` | COD Remittance |
| 6 | `hero-weight.png` | Weight Discrepancy |
| 7 | `hero-ndr.png` | NDR Shipment Action |
| 8 | `hero-booked.png` | Order Booked |
| 9 | `hero-shipped.png` | Order Shipped |
| 10 | `hero-out-for-delivery.png` | Out for Delivery |
| 11 | `hero-delivered.png` | Order Delivered |

(The MIS Report has no hero. Its stat cards are the visual.)

**hero-otp.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A green smartphone standing slightly tilted, its screen showing a large white padlock icon. Beside the phone, a floating white rounded card showing six empty code boxes (no digits). A small round green badge with a white checkmark at the bottom right of the phone. Place the Quickpost logo small at the top of the phone screen, above the padlock.
```

**hero-password.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. An open green envelope with a white letter sliding out of it. A round green badge with a white padlock overlapping the front right corner of the envelope. Place the Quickpost logo on the top of the white letter.
```

**hero-notification.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A glossy green notification bell, slightly tilted, with a small red #D93A3A circular badge containing the white number "1" at its top right. Two small curved motion lines on each side showing it ringing. Place the Quickpost logo in white on the front of the bell.
```

**hero-cod.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A green leather-style wallet, half open, with light green Indian rupee banknotes sticking out of the top (no readable text on the notes). A round white badge with a green checkmark overlapping the bottom right of the wallet. Place the Quickpost logo in white on the front flap of the wallet.
```

**hero-weight.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A green parcel weighing scale with a round dial, with a cardboard-brown shipping box sitting on the scale platform. A small amber #F5A524 warning triangle with a white exclamation mark floating at the top right. Place the Quickpost logo on the side of the box facing the camera.
```

**hero-ndr.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A closed green shipping box, taped on top, seen at a 3/4 angle. A round red #D93A3A badge with a white X overlapping its bottom right corner. Place the Quickpost logo in white on the front face of the box.
```

**hero-booked.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A green clipboard holding a white sheet with three short grey checklist lines (no readable text). A round green badge with a white checkmark overlapping its bottom right corner. Place the Quickpost logo at the top of the white sheet, just under the clip.
```

**hero-shipped.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A green delivery truck in side view, driving from left to right, with three soft grey speed lines behind it and a tiny dust puff under the rear wheel. Place the Quickpost logo large and clear in white on the side of the cargo box.
```

**hero-out-for-delivery.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A friendly stylised delivery rider in a green uniform and green helmet riding a green scooter from left to right, with a green delivery box mounted on the back seat. Simple, faceless-cartoon style (no detailed facial features). Place the Quickpost logo in white on the side of the delivery box.
```

**hero-delivered.png**
```
Landscape 1536x1024. The background must be fully transparent PNG, not white. A closed green shipping box resting on a light grey doormat in front of a partial white door frame. A round green badge with a white checkmark overlapping the top right of the box. Place the Quickpost logo in white on the front of the box.
```

---

## Step 2b: The city backdrop (already made for you)

**`hero-backdrop.png` · 1200×624** (displayed at 600×312), included in the `quickpost-emails` folder. Upload it with your other images. You don't need to generate it.

It's the mint-green city scene behind the logo and main image: soft sky, a dotted delivery route between two map pins, a two-layer skyline, trees and a road. The centre of the skyline is kept low so the main image stands out. The Quickpost logo isn't in it because the logo already sits on top of this scene, and a second logo right behind it would look cluttered.

In Outlook for Windows, which can't show background images, the header shows plain mint green (`#EAF6EF`) instead. Everything still looks clean.

## Step 3: Footer truck (appears in every email)

**`footer-truck.png` · Generate at 1536×1024 → resize to 360×240** (displayed at 180×120)

```
Landscape 1536x1024, TRANSPARENT background (no background colour at all). A green delivery truck in side view facing left, parked. Behind it, a very faint light grey city skyline silhouette at 30% opacity. Place the Quickpost logo large and clear in white on the side of the cargo box.
```

If ChatGPT won't give a transparent background, ask for a solid `#EAF6EF` background instead. That's the exact colour of the footer strip, so it blends in.

---

## Step 4: Small icons

**About the logo on these:** these icons appear at 16–40 pixels in the email. A logo at that size becomes an unreadable smudge and makes the icon look blurry, so these prompts leave the logo out. The logo already appears at the top of every email and on every hero image and footer truck.

**Recommended:** instead of AI-generating tiny icons, download them free from **lucide.dev** or **tabler.io/icons**. Set colour to `#178A4A`, export PNG at the size below. They'll be crisper than AI output. If you prefer ChatGPT, use this prompt, replacing the subject:

```
Square 1024x1024, transparent background. A simple flat icon of [SUBJECT], solid Quickpost green #178A4A, rounded line style, 2px-equivalent stroke weight, centred with 20% padding, no text, no shadow, no 3D.
```

Generate at 1024×1024 → resize to the final size in the table.

### MIS report stat icons: final 80×80 (displayed 40×40)
Tip: these look best as a green icon inside a light green `#EAF6EF` rounded square.

| File | Subject for the prompt |
|---|---|
| `stat-total.png` | a stack of parcels |
| `stat-picked-up.png` | a hand holding a parcel |
| `stat-in-transit.png` | a delivery truck, side view |
| `stat-delivered.png` | a circle with a checkmark |
| `stat-rto.png` | a circle with an X, in red #D93A3A instead of green |
| `stat-cod.png` | an Indian rupee symbol inside a circle |

### Callout icons: final 48×48 (displayed 24×24)

| File | Subject | Used in |
|---|---|---|
| `icon-shield.png` | a shield with a checkmark | OTP |
| `icon-clock.png` | a clock | Forgot Password |
| `icon-info.png` | an "i" in a circle, in amber #B86E00 | Weight Discrepancy |
| `icon-phone-ring.png` | a phone handset with ringing waves | Out for Delivery |

### Info-table icons: final 36×36 (displayed 18×18)

| File | Subject | Used in |
|---|---|---|
| `icon-calendar.png` | a calendar | Notifications |
| `icon-reference.png` | a hash (#) symbol | Notifications |
| `icon-details.png` | a document with lines | Notifications |

### Footer contact icons: final 32×32 (displayed 16×16)

| File | Subject |
|---|---|
| `icon-phone.png` | a phone handset |
| `icon-mail.png` | an envelope |

---

## Step 5: Don't generate these, download the official versions

AI tools draw brand logos inaccurately, and Apple, Google and the social networks require their official artwork.

| File | Final size | Where to get it |
|---|---|---|
| `logo.png` | 320×80 (displayed 160×40) | Export your own Quickpost logo, transparent background |
| `social-facebook.png` | 64×64 | Facebook brand resources, or a green circle icon set from lucide/simple-icons |
| `social-x.png` | 64×64 | X brand toolkit |
| `social-instagram.png` | 64×64 | Instagram brand resources |
| `social-linkedin.png` | 64×64 | LinkedIn brand guidelines |
| `badge-app-store.png` | 240×80 (displayed 120×40) | developer.apple.com/app-store/marketing/guidelines |
| `badge-google-play.png` | 270×80 (displayed 135×40) | play.google.com/intl/en_us/badges |

For the green circular social icons like your sample: use white brand glyphs from simpleicons.org placed on a `#178A4A` circle.

---

## Checklist: 34 files total

- [ ] `hero-backdrop.png` (provided, just upload it)

- [ ] 10 hero illustrations (600×400, transparent background)
- [ ] 1 footer truck (360×240)
- [ ] 6 stat icons (80×80)
- [ ] 4 callout icons (48×48)
- [ ] 3 info-table icons (36×36)
- [ ] 2 contact icons (32×32)
- [ ] 1 logo (320×80)
- [ ] 4 social icons (64×64)
- [ ] 2 store badges
- [ ] All uploaded to CDN, `IMAGE_BASE_URL` updated in `theme.js`
