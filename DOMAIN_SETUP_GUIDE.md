# Pilgrim's Nest — Domain Connection & Setup Guide
**Domain:** `pilgrimsnest.org`  
**Live Site:** https://nembahe.github.io/pilgrimsnest/  
**GitHub Repository:** https://github.com/Nembahe/pilgrimsnest  
**Local Project Folder:** `z:\AgentsWorkspace\pilgrimsnest`  

---

## ✅ Current Status — LIVE

**The cutover completed on 2026-09-13.** `pilgrimsnest.org` now serves this repo over HTTPS.

| | |
| :--- | :--- |
| `https://pilgrimsnest.org` | Live, HTTPS enforced |
| `https://www.pilgrimsnest.org` | Redirects to the apex |
| TLS certificate | Issued and approved for both names |
| Google Workspace email | Unaffected — MX, SPF and DKIM verified after the change |
| Squarespace parking | Removed, including the `HTTPS`/SVCB record |

Verified live DNS:

| Type | Name | Data |
| :--- | :--- | :--- |
| A | `@` | `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` … `8003::153` |
| CNAME | `www` | `nembahe.github.io` |
| HTTPS | `@` | *(none — deliberately)* |
| MX | `@` | `smtp.google.com` |
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` |
| TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=MIIBIj…` |

The custom domain is set by the [`CNAME`](CNAME) file in this repo, not by hand in the
GitHub UI. Deleting that file drops the custom domain.

> The steps below are kept as the record of how this was done, and as the procedure to
> follow if the domain is ever moved again. **They have already been carried out — do not
> re-run them against the live domain.**

---

## 🚀 How to Connect `pilgrimsnest.org` to Your Live Website

### Step 0: Pre-Checks (do these before changing anything)

1. Log into **https://account.squarespace.com/domains** → `pilgrimsnest.org` → **DNS Settings**.
2. **Screenshot the entire current record list.** This is your rollback source.
3. Note that the parking records sit in a **Squarespace Defaults** preset card with a single
   red trash control — they are not individually editable rows.
4. Confirm the domain is **not attached to a Squarespace site or trial**. If it is, stop —
   Squarespace may re-add the parking records, and it has to be disconnected first.
5. Confirm the MX and TXT records listed in the warning below are present, so you can tell
   afterwards that they are untouched.

---

### Step 1: Open Squarespace Domains DNS Settings
1. Go to your browser and log into:  
   👉 **https://account.squarespace.com/domains**
2. Click on **pilgrimsnest.org**.
3. In the left or top menu, click **DNS Settings** (or **Manage Domain Records**).

---

### Step 2a: Remove the Squarespace Defaults preset — do this FIRST

Order matters. `www` already holds a CNAME to `ext-sq.squarespace.com`, and a hostname can
only hold one CNAME, so the GitHub `www` record cannot be added until the preset is gone.
Adding the apex `A` records first is no better — they would coexist with the four `198.*`
ones and visitors would land on whichever answered.

1. On **DNS Settings**, find the card headed **Squarespace Defaults**.
2. Click the **red trash icon at the top-right of that card**, level with the heading.
   Preset rows have no per-row delete buttons — the whole block is removed in one action.
3. Confirm the dialog, then **hard-refresh the page** (`Ctrl+Shift+R`) and check the card
   is actually gone. If it reappears, the delete did not commit — see *If the block comes
   back* below.
4. Do **not** touch the **Custom records** card underneath. That is your email.

The domain serves nothing at all between this step and the next. That is expected and
harmless — all it was serving was the parking page. Email keeps flowing throughout, because
MX, SPF and DKIM live in Custom records and are never involved.

> ### ⚠️ STOP — READ BEFORE DELETING ANYTHING
>
> This domain carries **live Google Workspace email**. Deleting the wrong record bounces your mail.
>
> **🚫 NEVER delete or edit these:**
>
> | Type | Host | Value |
> | :--- | :--- | :--- |
> | MX | `@` | `smtp.google.com` |
> | TXT | `@` | `v=spf1 include:_spf.google.com ~all` |
> | TXT | `google._domainkey` | `v=DKIM1; k=rsa; p=MIIBIjANBgkq...` (long key) |
>
> **✅ Delete ONLY the Squarespace preset block.** On this domain those rows sit together
> under **Squarespace Defaults** and come out in one action — use the block's own
> **Remove**/trash control rather than deleting rows one at a time. The block contains:
>
> | Type | Host | Value |
> | :--- | :--- | :--- |
> | A | `@` | `198.185.159.144` |
> | A | `@` | `198.185.159.145` |
> | A | `@` | `198.49.23.144` |
> | A | `@` | `198.49.23.145` |
> | CNAME | `www` | `ext-sq.squarespace.com` |
> | HTTPS | `@` | `1 . alpn="h2,http/1.1" ipv4hint="198.185.159.144,…"` |
>
> Leaving any of them behind makes the site flicker between GitHub and the Squarespace
> parking page, and can block the SSL certificate from being issued.
>
> **The `HTTPS` row is the one that will fool you.** It is an SVCB record (type 65).
> Browsers read its `ipv4hint` and connect to those Squarespace IPs *even when the `A`
> records already point at GitHub* — so the site keeps showing the parking page while
> `nslookup -type=A` returns a perfectly correct answer. Delete it with the rest.
>
> Leave `_domainconnect` alone. It is harmless and unrelated to hosting.
>
> **Screenshot the full record list before you change anything.** The captured state for
> this domain is already written down in
> [`dns-rollback-snapshot-2026-09-13.md`](dns-rollback-snapshot-2026-09-13.md).

#### If the block comes back

A preset that reappears after a refresh is almost always Squarespace re-adding it because
the domain is still **attached to a Squarespace site or trial**. Check
**Domains → pilgrimsnest.org → Website**. If a site is connected there, disconnect it first;
otherwise the preset will keep returning no matter how often you delete it.

---

### Step 2b: Add the GitHub Pages records

Only once Step 2a is confirmed gone. In **Custom records**, click **ADD RECORD** for each
row below — nine records in total.

#### A Records (Points the root domain `pilgrimsnest.org`):
| Type | Host | Points To / Data / Value | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `185.199.108.153` | 1 Hour (or 3600) |
| **A** | `@` | `185.199.109.153` | 1 Hour (or 3600) |
| **A** | `@` | `185.199.110.153` | 1 Hour (or 3600) |
| **A** | `@` | `185.199.111.153` | 1 Hour (or 3600) |

#### AAAA Records (optional but recommended — IPv6 visitors):
| Type | Host | Points To / Data / Value | TTL |
| :--- | :--- | :--- | :--- |
| **AAAA** | `@` | `2606:50c0:8000::153` | 1 Hour (or 3600) |
| **AAAA** | `@` | `2606:50c0:8001::153` | 1 Hour (or 3600) |
| **AAAA** | `@` | `2606:50c0:8002::153` | 1 Hour (or 3600) |
| **AAAA** | `@` | `2606:50c0:8003::153` | 1 Hour (or 3600) |

#### CNAME Record (Points `www.pilgrimsnest.org`):
| Type | Host | Points To / Data / Value | TTL |
| :--- | :--- | :--- | :--- |
| **CNAME** | `www` | `nembahe.github.io` | 1 Hour (or 3600) |

Do **not** re-create an `HTTPS` record. GitHub Pages does not need one, and a stale
`ipv4hint` is exactly what sent browsers back to Squarespace.

---

### Step 3: Link Custom Domain in GitHub

**Do Steps 2a and 2b first and confirm they resolved.** If you set the custom domain while
DNS still points at Squarespace, GitHub starts redirecting `nembahe.github.io/pilgrimsnest/`
to `pilgrimsnest.org` — which is not serving yet — and *both* addresses go dark until DNS
catches up.

Check first:

```
nslookup -type=A pilgrimsnest.org 1.1.1.1
```

Only continue once that returns the four `185.199.*` addresses and none of the `198.*` ones.
A local resolver may still be serving cache; https://dns.google/resolve?name=pilgrimsnest.org&type=A
and the Cloudflare equivalent are the second opinion.

#### Route taken: the `CNAME` file (done)

GitHub Pages reads the custom domain from a file named `CNAME` at the repo root. Committing
it yourself is equivalent to typing the domain into Settings → Pages, and avoids GitHub
auto-committing to `main` behind your back:

```
printf 'pilgrimsnest.org
' > CNAME
git add CNAME && git commit -m "Set custom domain" && git push
```

The file holds the bare apex domain — no `https://`, no `www`, no trailing path, one
trailing newline. Settings → Pages will show `pilgrimsnest.org` in **Custom domain** within
a minute of the push.

#### Alternative route: the GitHub UI

1. Open **https://github.com/Nembahe/pilgrimsnest/settings/pages**
2. Under **Custom domain**, type `pilgrimsnest.org`.
3. Click **Save**. GitHub commits a `CNAME` file to `main` for you, so run `git pull`
   locally before your next push or it will be rejected. (Never resolve that with a
   force-push — it deletes `CNAME` and drops the custom domain.)

#### Then, either way

**Enforce HTTPS will be greyed out at first.** That is normal, not a failure. GitHub has to
issue the Let's Encrypt certificate first — usually minutes, occasionally up to 24 hours.
Come back later and tick it once it becomes clickable. Until it is ticked, `http://` works
but does not redirect to `https://`.

If Pages reports *"Domain does not resolve to the GitHub Pages server"*, it is reading a
cached answer. Wait for the old 4-hour TTL to expire and click **Check again**.

Once DNS propagates (usually within 15–60 minutes), typing `pilgrimsnest.org` or
`www.pilgrimsnest.org` in any browser will display your new website!

---

## 🌐 Alternative: If You Prefer Google Sites Instead

> ⚠️ **This is an either/or, not an extra step.** It points `www` at
> `ghs.googlehosted.com` instead of GitHub. Doing any part of this section alongside
> Steps 1–3 breaks both setups. Use this section **only** if you are abandoning the
> GitHub Pages route.

If you still want to publish through **Google Sites** (as shown in your Google Workspace Admin settings):

1. Open **https://sites.google.com/new** in your browser.
2. In the right panel, click **Insert** &rarr; **Embed (`<>`)**.
3. Select the **Embed code** tab.
4. Copy and paste the entire content of [`z:\AgentsWorkspace\pilgrimsnest\google-sites-embed.html`](google-sites-embed.html).
5. Click **Next** &rarr; **Insert**.
6. Drag the edges to full screen and click **Publish**.
7. In Google Workspace Admin (`Apps > Google Workspace > Settings for Sites > Custom URL`), map `pilgrimsnest.org` to your Google Site, and point your Squarespace CNAME to `ghs.googlehosted.com`.

---

## ✅ Verification — Prove It Worked, and Prove Nothing Broke

**The site is up:**

```
nslookup -type=A pilgrimsnest.org 1.1.1.1
```
Returns exactly `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` — and no `198.*`.

```
nslookup -type=CNAME www.pilgrimsnest.org 1.1.1.1
```
Returns `nembahe.github.io`.

**The `HTTPS` record is gone** (skip this and the browser may still hit Squarespace):

```
nslookup -type=65 pilgrimsnest.org 1.1.1.1
```
Must return **no answer**. If it still shows `ipv4hint=198.…`, the `HTTPS` row is
still in Squarespace — go back and delete it.

`nslookup` reads whichever resolver it is told to; to see what the rest of the world sees,
open these in a browser instead — they query fresh and show the live TTL:

- https://dns.google/resolve?name=pilgrimsnest.org&type=A
- https://dns.google/resolve?name=pilgrimsnest.org&type=HTTPS
- https://dns.google/resolve?name=www.pilgrimsnest.org&type=CNAME

A `"TTL":14400` on a record you just deleted means it is **still live at Squarespace**, not
merely cached — a cached copy counts down from 14400, it does not sit at it.

- `https://pilgrimsnest.org` loads the site with a padlock and no certificate warning.
- `https://www.pilgrimsnest.org` loads or redirects to the apex, also with a padlock.
- Logo, fonts, starfield and countdown all render.

**Your email still works** (do not skip this):

```
nslookup -type=MX pilgrimsnest.org 1.1.1.1
```
Still returns `smtp.google.com`.

```
nslookup -type=TXT pilgrimsnest.org 1.1.1.1
```
Still returns `v=spf1 include:_spf.google.com ~all`.

```
nslookup -type=TXT google._domainkey.pilgrimsnest.org 1.1.1.1
```
Still returns the `v=DKIM1; k=rsa; p=...` key.

Then **send a real test email to and from an address on this domain.** That is the check
that actually matters.

---

## ↩️ Rollback

If anything goes wrong, in Squarespace DNS Settings:

1. Delete the four `185.199.*` A records (and any `AAAA` records you added).
2. Delete the `www` → `nembahe.github.io` CNAME.
3. Restore the Squarespace block: **DNS Settings → Add Preset → Squarespace Defaults**.
   That re-adds the four `A` records, the `www` CNAME **and the `HTTPS` record** in one step —
   re-adding the rows by hand will silently miss the `HTTPS` one. Cross-check the result
   against [`dns-rollback-snapshot-2026-09-13.md`](dns-rollback-snapshot-2026-09-13.md).

In the repo:

```
git rm CNAME && git commit -m "Revert custom domain" && git push
```

Then clear the **Custom domain** field at
`https://github.com/Nembahe/pilgrimsnest/settings/pages`. The site returns to
`https://nembahe.github.io/pilgrimsnest/`. Email is unaffected either way, because you never
touched the MX or TXT records.

---

## 🔒 Optional Hardening (after the site is live)

- **Verify the domain with GitHub.** Settings → Pages → *Verify domain*. It gives you a
  `_github-pages-challenge-Nembahe` TXT record to add in Squarespace. Without it, if this
  repo is ever deleted or made private, someone else could claim `pilgrimsnest.org` on their
  own Pages site.
- **Add a DMARC record.** The domain publishes SPF and DKIM but has no `_dmarc` policy.

---

## 📁 Local Files Inventory

- `index.html` — Full standalone website
- `styles.css` — Complete stylesheet with gold, dark celestial theme & animations
- `script.js` — Particle engine, countdown clock, waitlist & modal
- `logo.png` — 1024x1024 Pilgrim emblem
- `logo-512.png` — 512x512 Pilgrim emblem
- `favicon.png` — Browser tab icon
- `google-sites-embed.html` — 100% self-contained single-file version for Google Sites
- `CNAME` — Tells GitHub Pages which custom domain to serve (contains `pilgrimsnest.org`)
- `DOMAIN_SETUP_GUIDE.md` — This setup guide
