# Greenbone Post-Remediation Security Review — July 2026

## Review metadata

- **Target:** `https://ahmedaziz-portfolio.vercel.app`
- **Greenbone report date:** 2026-07-13
- **Follow-up review date:** 2026-07-14
- **Remediation reference:** commit `e66954e` (`security: harden app and Supabase configuration`)
- **Application-changing publication commit:** `e2c242f` (`security: add post-remediation verification`)
- **Scanner summary:** 0 Critical, 0 High, 0 Medium, 2 Low, 54 informational/log findings

Production behavior matches the remediation: the live site has the hardened CSP, no `X-Powered-By`, the expected HSTS value, POST-only logout behavior, the published `security.txt` and `X-Permitted-Cross-Domain-Policies: none`. Vercel deployment metadata ties the application-changing follow-up to commit `e2c242f`. The follow-up also restricts the production origin allowlist to non-loopback/non-localhost HTTPS origins, adds a read-only verifier and corrects stale setup documentation.

No authentication architecture, authentication route, Supabase migration or database object was changed. During the review phase, no SQL, migration, login attempt, contact submission, commit, push or deployment was performed. A later explicit owner request authorized committing and pushing the reviewed files to `main`; Vercel then completed its configured Git-triggered production deployment. No Supabase SQL or manual platform-setting mutation was needed.

## Outcome

The Greenbone report does not demonstrate a current application-layer Critical, High or Medium vulnerability. Its two Low findings are the same TCP timestamp observation on two Vercel edge addresses. They are accepted as a low-severity, platform-managed residual risk. The informational entries are a mixture of already-remediated behavior, expected Vercel architecture, modern TLS behavior, obsolete header recommendations and generic service guesses.

Two narrow application-controlled improvements were identified:

1. Add `X-Permitted-Cross-Domain-Policies: none` through the existing `next.config.js` header list. No Flash, Silverlight, Acrobat policy file or other legacy cross-domain dependency exists in the repository.
2. Restrict `getAllowedOrigins()` to valid, credential-free, non-loopback/non-localhost HTTPS origins whenever `NODE_ENV=production`, including values supplied through environment configuration. Local development retains its automatic loopback origins. The code deliberately does not resolve trusted DNS names or reject explicitly configured private-network addresses.

## Changed-file inventory

Literal `git diff --name-only` output at the end of the review:

```text
.env.example
docs/VERCEL_SETUP.md
lib/supabase/config.ts
next.config.js
package.json
```

New untracked files, which `git diff --name-only` does not list:

```text
docs/security-scan-greenbone-follow-up-2026-07.md
scripts/security/verify-production-security.mjs
```

## Finding classification

| Finding | Scanner severity | Actual classification | Ownership | Action | Verification | Residual risk |
| --- | --- | --- | --- | --- | --- | --- |
| TCP timestamps on `64.29.17.3` | Low, CVSS 2.6 | Platform-controlled residual risk | Vercel edge network | Accepted; no application or fake OS fix | RFC 7323 operates below HTTP; Vercel terminates TCP at its ingress layer | Potential uptime/fingerprinting signal; the scan does not show that timestamps map directly to host uptime |
| TCP timestamps on `216.198.79.3` | Low, CVSS 2.6; duplicate | Duplicate of the same platform-controlled finding | Vercel edge network | Accepted with the first finding | Same hostname, behavior and ownership as the first result | Same single residual risk; not counted as a separate defect |
| `X-Powered-By: Next.js` | Informational | Remediated | Application | Keep `poweredByHeader: false` | Absent on the live HTTPS homepage | None identified |
| `Server: Vercel` | Informational | Expected platform disclosure | Vercel | Accepted; do not proxy or disrupt routing to hide it | Present live while `X-Powered-By` is absent | Hosting provider remains identifiable |
| HPKP / `Public-Key-Pins` missing | Informational | Deprecated and hazardous recommendation | Browser standard | Intentionally not implemented | HPKP is obsolete and removed from modern browsers | None; omission avoids pinning lockout risk |
| `Expect-CT` missing | Informational | Obsolete | Browser standard | Intentionally not implemented | Chromium enforces Certificate Transparency for public sites and deprecated `Expect-CT`; Chrome reports that no other browser implemented it | None identified |
| `Feature-Policy` missing | Informational | Replaced by `Permissions-Policy` | Application/browser standard | No action | `Permissions-Policy` is present live | None identified |
| `Sec-Fetch-*` headers missing from responses | Informational | Scanner interpretation issue; these are browser request headers | User agent | Do not emit them as response headers | Fetch Metadata specification defines them as request metadata | Existing origin checks remain authoritative |
| `Cross-Origin-Embedder-Policy` missing | Informational | Not required by this application | Application | Not added; COEP could block noncompliant cross-origin subresources, while the COOP configuration needed for full isolation can affect OAuth popup relationships | No `SharedArrayBuffer` or cross-origin-isolation requirement found | Isolation-gated capabilities remain unavailable or restricted, which is acceptable because the app does not use them |
| `Document-Policy` missing | Informational | Optional/experimental, not a baseline security header | Application/browser standard | No action without a concrete feature requirement | Repository has no dependency on Document Policy | None identified |
| `X-XSS-Protection` missing | Informational | Obsolete legacy filter | Browser standard | Intentionally not added | CSP, React escaping and server validation are the relevant controls | Legacy browsers do not receive this obsolete filter |
| `X-Permitted-Cross-Domain-Policies` missing | Informational | Optional defense in depth | Application | Added centrally as `none` and deployed | Repository contains no legacy policy file or technology; the post-deploy verifier confirms the header | None identified |
| `Cross-Origin-Resource-Policy: same-origin` | Informational/present | Current deliberate policy | Application | Retained | Present live; a sampled same-origin JavaScript chunk and public image returned 200 | Cross-origin embedding remains intentionally restricted |
| AES-GCM suites labelled “Medium” | Informational | Currently accepted modern suites; no weak suite evidence | Vercel edge TLS | No application change | TLS 1.2 and 1.3 handshakes succeeded; Vercel lists the same six forward-secret suites | Vercel controls future cipher policy |
| Ports 80 and 443 | Informational | Expected web-service exposure | Vercel | Accepted | Port 80 returns an immediate 308 HTTPS redirect; port 443 serves HTTPS | Normal public web exposure |
| HSTS | Informational/present | Passed | Application configuration / Vercel CDN | Retain one coherent value | Live value is `max-age=63072000; includeSubDomains; preload`, emitted once | The config emits the header globally; browsers ignore HSTS received over plain HTTP |
| TLS 1.2 and TLS 1.3 | Informational/present | Passed | Vercel edge TLS | No action | Read-only forced handshakes succeeded for both versions | Protocol lifecycle remains Vercel-managed |
| Perfect Forward Secrecy | Informational/present | Passed | Vercel edge TLS | No action | The TLS 1.2 suites explicitly use ECDHE; Vercel documents its supported configuration as forward-secret, and the scanner independently reported PFS | Platform-controlled |
| Wildcard certificate details | Informational | Valid managed certificate | Vercel certificate automation | Do not pin, commit or manually renew certificates | Validated live handshake: `CN=*.vercel.app`, Google Trust Services issuer, valid 2026-06-28 through 2026-09-26 | Renewal remains Vercel-managed |
| Security headers missing on port 80 | Informational | Low-risk platform redirect behavior | Vercel ingress | No complex routing added | Redirect is immediate, sets no cookie and returns no application content | Redirect response may omit content-only headers such as CSP |
| PHP/ASP/CGI capability guesses | Informational | False positive / generic heuristic | Scanner | No action | No PHP, ASP, ASPX or CGI files or deployed source endpoints were found | None identified |
| Sensitive/source-file path guesses | Informational | No exposure found | Application/Vercel | Keep verifier coverage | All tested paths returned a non-success response; no source content was retrieved | Recheck after routing or hosting changes |
| `security.txt` previously missing | Informational | Remediated | Application | Retain public text file | Live endpoint returns 200 and `text/plain; charset=utf-8` | Expiry/contact metadata must be maintained |
| Private API CORS and caching | Follow-up control | Passed | Application | Retain explicit same-origin and private/no-store behavior | Unauthenticated admin endpoints are denied, have no wildcard CORS, and denial responses are not shared-cacheable | Authenticated functional testing remains manual |

Greenbone “Log” results with CVSS 0.0 are informational observations. They are not vulnerabilities by themselves and do not justify adding obsolete or compatibility-breaking controls.

## TCP timestamp residual-risk decision

- **Finding:** TCP Timestamps Information Disclosure
- **Status:** **Accepted — platform-managed, Low severity, no application-layer remediation**
- **CVSS:** 2.6
- **Affected hostname:** `ahmedaziz-portfolio.vercel.app`
- **Scanner-observed Vercel IPs:** `64.29.17.3`, `216.198.79.3`
- **Technical explanation:** TCP timestamps are handled at Vercel's TCP termination layer, below the application's HTTP boundary. Next.js handlers, serverless functions, build commands and repository configuration cannot configure that layer. RFC 7323 describes performance and reliability uses for timestamps and notes that a naïve uptime-derived clock may leak uptime; timestamp support alone does not demonstrate that implementation.
- **Impact:** A network observer may derive a low-confidence uptime estimate. The report contains no evidence of access to application data, authentication material or sessions.
- **Compensating controls:** HTTPS-only application delivery, immediate HTTP-to-HTTPS redirect, HSTS, current TLS 1.2/1.3 configuration, forward-secret cipher suites, application authentication and authorization, minimal exposed services, Vercel-managed infrastructure, private/no-store API responses, monitoring and endpoint-level abuse controls where relevant.
- **Residual risk:** Low and accepted. Reassess if Vercel changes its networking controls, if the finding's impact materially changes, or during the next infrastructure review.
- **Review date:** 2026-07-14

No `sysctl`, Docker, `netsh`, firewall, shell-build or serverless pseudo-fix was added. Moving away from Vercel solely for this Low finding is not justified.

## Verification evidence

| Area | Result |
| --- | --- |
| Repository state before follow-up edits | `main` was clean and synchronized with `origin/main` at `e66954e`; the requested status, diff and ten-commit history were inspected |
| Deployment freshness | Vercel reports a READY production Git deployment for application-changing commit `e2c242f`; live headers and routes match it |
| HTTPS homepage | 200 through the read-only verifier; HSTS, CSP, `nosniff`, Referrer-Policy, Permissions-Policy, COOP and CORP present |
| Production CSP | `unsafe-eval` absent; `object-src 'none'`, `frame-ancestors 'none'` and `script-src-attr 'none'` present |
| Development CSP | `unsafe-eval` remains development-only; `upgrade-insecure-requests` remains production-only |
| HTTP port 80 | 308 direct redirect to HTTPS; no cookie and no application body |
| Logout | Repository exposes only a POST route; production GET returns 405 and does not change cookies |
| Admin APIs | Content, messages, resumes, settings and whoami deny unauthenticated access; upload GET is unavailable/safely denied; no wildcard CORS |
| API cache policy | Authentication denial responses use `Cache-Control: private, no-store, max-age=0`; shared caching is prevented |
| TLS | Forced TLS 1.2 and TLS 1.3 handshakes succeeded; a validated default handshake negotiated TLS 1.3/AES-128 |
| Certificate | Live wildcard certificate matched the hostname and validated to Google Trust Services |
| Repository service inventory | No unexpected PHP, ASP, ASPX, CGI, backup, dump or tracked private environment file; expected SQL is confined to Supabase migrations/seed files |
| Production source maps | Discovered same-origin JavaScript chunks were probed for adjacent `.map` files; none returned success |
| Sampled assets | One same-origin production JavaScript chunk and one same-origin public image returned 200 with the expected content types |
| Browser automation | Headless Chrome reached a Vercel browser-verification challenge rather than application content; no attempt was made to bypass it, so UI and application-console verification remain manual |
| Automated verifier | Post-deploy production: `75 passed, 2 warnings, 0 failures`; final script against the local production build: `69 passed, 3 warnings, 0 failures` |
| TypeScript | `npm run type-check` passed |
| ESLint | `npm run lint` passed |
| Production build | `npm run build` passed after the sandbox-restricted worker spawn was rerun with normal worker permissions |
| Unit tests | Not run because `package.json` defines no `test` script |

The two post-deploy verifier warnings are non-regressions: `/robots.txt` and `/sitemap.xml` return 404.

The latter two are discoverability metadata, not sensitive resources or security controls.

During review, a burst of curl and headless-browser probes received Vercel's browser-verification response. The protection was not bypassed. After the owner-authorized Git deployment, the final stricter script completed successfully against production.

### Sensitive paths tested

The following production paths were requested using unauthenticated GET requests and manual redirect handling:

`/.env`, `/.env.local`, `/.git/config`, `/package.json`, `/package-lock.json`, `/next.config.js`, `/next.config.ts`, `/vercel.json`, `/supabase/schema.sql`, `/backup.zip`, `/database.sql`, `/dump.sql`, `/phpinfo.php`, `/server-status`.

None returned a 2xx response or source-file contents. No route was created merely to change a scanner result.

## Supabase follow-up

The remote migration list was inspected read-only and includes:

- `202606270001_security_hardening`
- `202607040001_admin_mfa_recovery`
- `20260714093312_security_advisor_hardening`

The current Security Advisor reports one informational item (`site_settings` has RLS enabled without a client policy) and one dashboard warning (leaked-password protection is disabled). The former preserves default-deny access and did not justify a schema change in this review. The project is on the Free plan, while leaked-password protection is available on Pro and above; it is not fixed with application SQL. The local/remote migration ledgers have historical differences, so an apply-all or automatic `db push` remains inappropriate.

No SQL or migration was executed or modified during this follow-up.

## Functional regression boundaries

Read-only production checks covered HTTP responses, headers, a sampled public image and JavaScript asset, route protection and TLS. Headless Chrome was intercepted by Vercel's browser-verification challenge, so this review does not claim visual animation, application console or browser-network verification. The challenge itself is platform protection, not an application failure, and it was not bypassed. The contact form was not submitted. Email/password login, GitHub OAuth, callback completion, MFA, remembered devices, password reset, live administrator sessions, CMS save/edit/delete, uploads, Media Library, messages, settings and archive restoration require owner credentials and potentially mutate production data, so they were not automated in this review.

For future application changes, deploy an owner-controlled preview and run:

```powershell
$env:SECURITY_TARGET_URL = "https://your-preview.vercel.app"
npm run security:verify
```

Then perform the credentialed Auth and CMS regression checklist with a dedicated test account and test content. Confirm that no CSP console error blocks required Supabase, OAuth, analytics, image, media or resume requests.

## Manual Vercel owner checklist

Codex did not change any of these settings:

- [x] Confirm the intended production deployment and production branch (`main`).
- [x] Deploy the follow-up through the configured Git workflow and rerun `security:verify` against production.
- [ ] Use an owner-controlled preview and rerun the verifier before future production changes.
- [ ] Enable or review Deployment Protection for preview environments when available and appropriate.
- [ ] Scope production secrets to Production; do not expose them to Preview or Development without a concrete need.
- [ ] Remove localhost values from the deployed `ALLOWED_ORIGINS`; the code now filters them in production as defense in depth.
- [ ] Review team membership and least-privilege project access.
- [ ] Review Git integration permissions and installed-app access.
- [ ] Review function logs for accidental personal data, tokens or message contents.
- [ ] Review available Firewall/WAF and rate-limiting controls for exposed endpoints; paid features are optional, not assumed mandatory.
- [ ] Remove unused custom domains and stale preview aliases.
- [ ] Keep Vercel-managed certificate renewal enabled; do not upload or pin the current wildcard certificate.
- [ ] In Supabase Auth settings, review leaked-password protection and trusted redirect URLs.

TCP timestamp behavior is not expected to be configurable in the Vercel project dashboard.

## Standards and platform references

- [RFC 7323 — TCP Extensions for High Performance](https://www.rfc-editor.org/rfc/rfc7323.html)
- [Vercel CDN ingress architecture](https://vercel.com/docs/how-vercel-cdn-works#ingress-layer)
- [Vercel encryption and supported TLS suites](https://vercel.com/docs/cdn-security/encryption)
- [Vercel-managed SSL certificates](https://vercel.com/docs/domains/working-with-ssl)
- [RFC 9325 — Recommendations for Secure Use of TLS and DTLS](https://www.rfc-editor.org/rfc/rfc9325.html#section-4.2)
- [RFC 8446 — TLS 1.3 implementation requirements](https://www.rfc-editor.org/rfc/rfc8446.html#section-9.1)
- [RFC 7905 — ChaCha20-Poly1305 cipher suites for TLS](https://www.rfc-editor.org/rfc/rfc7905.html)
- [Chrome removal of HPKP](https://developer.chrome.com/blog/chrome-67-deps-rems#deprecate-http-based-public-key-pinning)
- [Chrome deprecation of Expect-CT](https://developer.chrome.com/blog/chrome-107-beta#expect-ct)
- [MDN Permissions Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Permissions_Policy)
- [W3C Fetch Metadata request headers](https://www.w3.org/TR/fetch-metadata/)
- [MDN Cross-Origin-Embedder-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)
- [MDN X-Permitted-Cross-Domain-Policies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Permitted-Cross-Domain-Policies)
