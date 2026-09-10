# ✦ Luxury Tattoo Studio Booking Portal & Visitor Telemetry App

A bespoke, editorial tattoo consultation web application designed for high-end tattoo artists. Replaces clunky forms with an inviting studio welcome page, live visitor alerts, and a 5-step guided consultation experience.

---

## 🌟 Key Features

1. **Welcoming Hero & Studio Philosophy (Intro Page)**:
   - Welcomes clients with warmth and clarity before they start the form.
   - Highlights 3 core studio pillars: *Custom Designs*, *Private Studio Sanctuary (No walk-ins)*, and *Transparent $200 Deposit Policy*.
   - Includes studio FAQ drawer (rescheduling terms, design drafts, bringing guests).

2. **Real-time Owner Notifications (Visitor Telemetry)**:
   - **Page View Alert**: Get notified instantly on your phone (via Discord webhook or email) when someone opens your booking link.
   - **Form Start Alert**: Get pinged when a visitor clicks *"Begin Booking Request"*.
   - **Full Consultation Submission**: Instant rich embed delivered with all client details, style preferences, placement, sizing, budget, selected schedule slots, and deposit method.

3. **Sophisticated 5-Step Consultation Flow**:
   - **Step 1: Contact & Eligibility**: Formatted phone, Instagram handle, 18+ gatekeeper check, local vs. traveling status.
   - **Step 2: Tattoo Vision & Creative Freedom**: Visual style selector cards, pure black & grey vs. color accents, 3-level creative liberty rating, guided description prompts.
   - **Step 3: Placement, Scale & Smart Media Uploads**: Interactive body placement chips, visual size guide, conditional cover-up flow (asks for existing tattoo age and laser history), drag-and-drop multi-file reference previewer with live thumbnail removal.
   - **Step 4: Scheduling & Availability**: Timeline selector, date range window, interactive Days $	imes$ Time Slots matrix (Mon/Tue/Thu/Fri/Sat $	imes$ 11:30 AM, 2:30 PM, 4:30 PM).
   - **Step 5: Investment & Studio Agreements**: Tiered budget chips, numbing cream preference, deposit payment method (Zelle, Apple Pay, Venmo, PayPal, Cash App, E-Transfer), and 4 mandatory studio policy checkboxes ($200 deposit terms, 72h reschedule window, private studio rule, 18+ ID requirement).

4. **Confirmation Receipt**:
   - Personalized receipt summary card for the client with a *"Save / Print Request Copy"* button and next steps roadmap.

---

## 🚀 How to Set Up Discord Notifications (Free & Instant)

1. In your Discord app, open any private server/channel (e.g. `#tattoo-leads`).
2. Go to **Channel Settings (⚙️) > Integrations > Webhooks > New Webhook**.
3. Name it **"Studio Booking Bot"** and click **Copy Webhook URL**.
4. Open the booking web page in your browser.
5. Click the **⚙️ (Settings)** icon in the top right header (or footer link).
6. Paste your Discord Webhook URL and click **"⚡ Send Test Ping"** followed by **"Save Settings"**.
   *(Alternatively, you can paste the URL directly into `config.js` under `notifications.discordWebhookUrl`).*

---

## 📂 File Structure

```
tattoo-booking-app/
├── index.html       # Semantic multi-step HTML5 markup
├── styles.css       # Obsidian & champagne gold luxury dark theme
├── app.js           # Form validation, image dropzone, multi-step engine, webhook service
├── config.js        # Studio name, artist handle, available slots, payment methods
└── README.md        # Documentation and deployment guide
```

---

## 🌐 Free 1-Click Deployment Options

You can host this static web app for free on any modern hosting provider:

- **GitHub Pages**: Push this folder to a GitHub repository and turn on Pages under Settings.
- **Vercel / Netlify**: Drag-and-drop this folder onto [netlify.com/drop](https://app.netlify.com/drop) or deploy via Vercel CLI.
- **Custom Website Embedding**:
  - Embed into Squarespace, Wix, or WordPress using an `<iframe>` or by uploading the HTML/CSS/JS assets to your site.
