# DNS Rollback Snapshot — pilgrimsnest.org

**Captured:** 2026-09-13, from Squarespace DNS Settings
(`https://account.squarespace.com/domains/managed/pilgrimsnest.org/dns/dns-settings`)

This is the pre-change state. Use it to restore if the GitHub Pages cutover goes wrong.

Nameservers: `nsd1.squarespacedns.com` … `nsd4.squarespacedns.com`
Squarespace banner on the page: *"This domain is managed by Google Workspace."*

---

## Squarespace Defaults (preset block — removed during cutover)

| Type | Name | Priority | TTL | Data |
| :--- | :--- | :--- | :--- | :--- |
| A | `@` | N/A | 4 hrs | `198.185.159.144` |
| A | `@` | N/A | 4 hrs | `198.185.159.145` |
| A | `@` | N/A | 4 hrs | `198.49.23.144` |
| A | `@` | N/A | 4 hrs | `198.49.23.145` |
| CNAME | `www` | N/A | 4 hrs | `ext-sq.squarespace.com` |
| HTTPS | `@` | N/A | 4 hrs | `1 . alpn="h2,http/1.1" ipv4hint="198.185.159.144,198.185.159.145,198.49.23.144,198.49.23.145"` |

**To restore:** DNS Settings → **Add Preset** → *Squarespace Defaults*.

> The `HTTPS` (SVCB, type 65) record is the non-obvious one. Modern browsers read its
> `ipv4hint` and connect to those IPs even when the `A` records point elsewhere. Leaving it in
> place would have kept serving the Squarespace parking page while `nslookup -type=A` showed
> a perfectly correct result.

---

## Squarespace Domain Connect (left untouched)

| Type | Name | Priority | TTL | Data |
| :--- | :--- | :--- | :--- | :--- |
| CNAME | `_domainconnect` | N/A | 1 hr | `_domainconnect.domains.squarespace.com` |

---

## Custom records — GOOGLE WORKSPACE EMAIL (never touched)

| Type | Name | Priority | TTL | Data |
| :--- | :--- | :--- | :--- | :--- |
| MX | `@` | 1 | 1 hr | `smtp.google.com` |
| TXT | `@` | N/A | 1 hr | `v=spf1 include:_spf.google.com ~all` |
| TXT | `google._domainkey` | N/A | 1 hr | `v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA6yLc5lxM+0PwVv/HZiljogM50skUvCefwd8VcyxhrQDHLdxoLuU0C9GJvVWOnmv+mHIhezmAlCRfXZqz1bbmJHi4iXTAqJTaiBmS65ZccrNQNk6Jul67ohNuny8vKhnoxRqfXv7v8NHbF/ctA6O4Boz+pSZ0jY3zLF8QFhqlYgwA5RorabwbFVAoms7KicN0FdAyNGC6516focERRjrkfiIztWq8f0ldpqO84DXXioihi+4ekMN3w6evbtJQcSnfSTH/tf2VV6jBhWHttm9pGgmTx3DUFmH0iy7hy9AWqW8lWiSyrkdopQo2y6jRQk0CDP3C33jic3Cvnxfw7XsBwwIDAQAB` |

These three carry all mail for the domain. They are in the **Custom records** section and are
the *only* rows on the page with delete/edit buttons — so they are also the easiest to delete by
accident. Do not.

---

## Target state after cutover

| Type | Name | TTL | Data |
| :--- | :--- | :--- | :--- |
| A | `@` | 1 hr | `185.199.108.153` |
| A | `@` | 1 hr | `185.199.109.153` |
| A | `@` | 1 hr | `185.199.110.153` |
| A | `@` | 1 hr | `185.199.111.153` |
| AAAA | `@` | 1 hr | `2606:50c0:8000::153` |
| AAAA | `@` | 1 hr | `2606:50c0:8001::153` |
| AAAA | `@` | 1 hr | `2606:50c0:8002::153` |
| AAAA | `@` | 1 hr | `2606:50c0:8003::153` |
| CNAME | `www` | 1 hr | `nembahe.github.io` |

Plus, unchanged: the MX/SPF/DKIM rows above, and `_domainconnect`.
