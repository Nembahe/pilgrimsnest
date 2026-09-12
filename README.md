# Pilgrim's Nest — Landing Page & Under Construction Website
**Domain:** `pilgrimsnest.org`  
**Theme:** *The Lantern in the Night* — A Sanctuary for Wayfarers, Rest, and Community  

---

## 📁 File Structure

```text
z:\AgentsWorkspace\pilgrimsnest\
├── index.html               # Main standalone landing page & under construction site
├── styles.css               # Complete stylesheet with bespoke tokens, animations & responsive layout
├── script.js                # Ambient canvas particles, real-time countdown, waitlist, reflection rotator & modal
├── favicon.svg              # Vector brand icon of the Pilgrim's Nest hearth & guiding star
├── google-sites-embed.html  # 100% self-contained single-file edition for Google Sites "Embed Code"
└── README.md                # Deployment & configuration instructions
```

---

## 🚀 Deployment Options

### Option 1: Deploy with Google Sites (Recommended for Google Workspace)

Based on your Google Workspace Admin settings (`Apps > Google Workspace > Settings for Sites` for `pilgrimsnest.org`), you can publish directly via Google Sites:

1. **Create Site**:
   - Go to [sites.google.com](https://sites.google.com) while signed in to your `pilgrimsnest.org` Google Workspace account.
   - Click **Blank site** to create a new site.
   - Delete default header or set Header Type to **Title only / Cover** as desired.

2. **Embed the Landing Page**:
   - In the right-hand panel, click **Insert** > **Embed** (`<>`).
   - Select the **Embed code** tab.
   - Open [`google-sites-embed.html`](google-sites-embed.html), copy the entire content, and paste it into the Embed Code box.
   - Click **Next** > **Insert**.
   - Drag the edges of the embedded box to expand it to the full width and desired height.

3. **Publish & Connect Custom Domain**:
   - Click the blue **Publish** button in the top right.
   - Enter a web address slug (e.g. `home`).
   - Click the **Gear icon (Settings)** > **Custom domains** > **Start setup**.
   - Enter your domain: `www.pilgrimsnest.org` (or `pilgrimsnest.org`).
   - Follow Google's DNS verification prompt (typically adding a `CNAME` record pointing `www` to `ghs.googlehosted.com`).
   - In your Google Workspace Admin console (`Apps > Google Workspace > Settings for Sites > Custom URL`), confirm the custom URL mapping.

---

### Option 2: Standalone Static Hosting (Cloudflare Pages, Vercel, or GitHub Pages)

If you prefer full control over DNS, zero iframe sandboxing, and ultra-fast global CDN:

#### Cloudflare Pages (Free, automated SSL, custom domain):
1. Create a free account at [dash.cloudflare.com](https://dash.cloudflare.com).
2. Go to **Workers & Pages** > **Create application** > **Pages** > **Upload assets**.
3. Upload the files inside `z:\AgentsWorkspace\pilgrimsnest\`.
4. Go to **Custom domains** and bind `pilgrimsnest.org`.

#### GitHub Pages:
1. Initialize git and push the folder to a GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial Pilgrim's Nest Under Construction launch"
   git branch -M main
   git remote add origin https://github.com/<your-username>/pilgrimsnest.git
   git push -u origin main
   ```
2. In your repo, go to **Settings** > **Pages** > Source: `Deploy from branch (main)`.
3. Add custom domain `pilgrimsnest.org`.

---

## 💻 Local Preview & Testing

To preview the website locally in your browser:

### Using Python:
```powershell
cd "z:\AgentsWorkspace\pilgrimsnest"
python -m http.server 8080
```
Then open your browser to `http://localhost:8080`.

Or double-click [`index.html`](index.html) to open directly in Chrome/Edge/Firefox.

---

## ✨ Features Included

- **Celestial & Hearth Particles**: Interactive HTML5 Canvas ambient ember/starlight system with mouse proximity reactivity.
- **Live Countdown Clock**: Dynamic real-time calculation to target welcoming date (Autumn 2026).
- **Milestone Progress Tracker**: Visual progress bar (78% complete) with four distinct phases from ground vision to inaugural welcoming.
- **Four Sacred Pillars**: The Haven (Quiet Rest), The Hearth (Shared Table), The Path (Mindful Walks), and The Circle (Community Fellowship).
- **Wayfarer's Contemplations**: Interactive wisdom quote rotator with quotes on journey, stillness, and sanctuary.
- **Founding Circle Waitlist**: Email collection form with validation and local persistence.
- **Inquiries & Contact Modal**: Accessible popup dialog for retreat inquiries, volunteering, and collaborations.
- **Fully Responsive**: Designed with mobile-first fluidity, accessible contrasts, and `prefers-reduced-motion` compliance.
