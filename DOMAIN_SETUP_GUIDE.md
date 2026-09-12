# Pilgrim's Nest — Domain Connection & Setup Guide
**Domain:** `pilgrimsnest.org`  
**Live Site:** https://nembahe.github.io/pilgrimsnest/  
**GitHub Repository:** https://github.com/Nembahe/pilgrimsnest  
**Local Project Folder:** `z:\AgentsWorkspace\pilgrimsnest`  

---

## 📌 Current Status Explained

1. **Your new website is already built, uploaded, and live online** at:  
   👉 **https://nembahe.github.io/pilgrimsnest/**  
   *(Featuring your official Pilgrim emblem, ambient ember/starlight canvas, countdown clock, roadmap, and responsive layout).*

2. **Why `pilgrimsnest.org` currently shows the "Under Construction" sand dunes picture:**  
   - Your domain was purchased/transferred through **Squarespace Domains** (formerly Google Domains).
   - Its DNS is currently pointed to Squarespace's default parking servers (`198.185.159.145`).
   - Until you tell Squarespace to point your domain to your new website, Squarespace will continue displaying that generic placeholder screen.

---

## 🚀 How to Connect `pilgrimsnest.org` to Your Live Website

### Step 1: Open Squarespace Domains DNS Settings
1. Go to your browser and log into:  
   👉 **https://account.squarespace.com/domains**
2. Click on **pilgrimsnest.org**.
3. In the left or top menu, click **DNS Settings** (or **Manage Domain Records**).

---

### Step 2: Add GitHub Pages DNS Records
In Squarespace DNS Settings, scroll down to **Custom Records** and add the following records:

#### A Records (Points the root domain `pilgrimsnest.org`):
| Type | Host | Points To / Data / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `185.199.108.153` | 1 Hour (or 3600) |
| **A** | `@` | `185.199.109.153` | 1 Hour (or 3600) |
| **A** | `@` | `185.199.110.153` | 1 Hour (or 3600) |
| **A** | `@` | `185.199.111.153` | 1 Hour (or 3600) |

#### CNAME Record (Points `www.pilgrimsnest.org`):
| Type | Host | Points To / Data / Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `www` | `nembahe.github.io` | 1 Hour (or 3600) |

*(Note: If Squarespace has existing default parking A records pointing to `198.185.159.144` or `198.49.23.144`, remove or delete them so only the GitHub records remain).*

---

### Step 3: Link Custom Domain in GitHub
1. Open your repository settings page:  
   👉 **https://github.com/Nembahe/pilgrimsnest/settings/pages**
2. Under **Custom domain**, type: `pilgrimsnest.org`
3. Click **Save**.
4. Check the box for **Enforce HTTPS** (this generates your free automated SSL certificate).

Once DNS propagates (usually within 15–60 minutes), typing `pilgrimsnest.org` or `www.pilgrimsnest.org` in any browser will display your new website!

---

## 🌐 Alternative: If You Prefer Google Sites Instead

If you still want to publish through **Google Sites** (as shown in your Google Workspace Admin settings):

1. Open **https://sites.google.com/new** in your browser.
2. In the right panel, click **Insert** &rarr; **Embed (`<>`)**.
3. Select the **Embed code** tab.
4. Copy and paste the entire content of [`z:\AgentsWorkspace\pilgrimsnest\google-sites-embed.html`](google-sites-embed.html).
5. Click **Next** &rarr; **Insert**.
6. Drag the edges to full screen and click **Publish**.
7. In Google Workspace Admin (`Apps > Google Workspace > Settings for Sites > Custom URL`), map `pilgrimsnest.org` to your Google Site, and point your Squarespace CNAME to `ghs.googlehosted.com`.

---

## 📁 Local Files Inventory

- `index.html` — Full standalone website
- `styles.css` — Complete stylesheet with gold, dark celestial theme & animations
- `script.js` — Particle engine, countdown clock, waitlist & modal
- `logo.png` — 1024x1024 Pilgrim emblem
- `logo-512.png` — 512x512 Pilgrim emblem
- `favicon.png` — Browser tab icon
- `google-sites-embed.html` — 100% self-contained single-file version for Google Sites
- `DOMAIN_SETUP_GUIDE.md` — This setup guide
