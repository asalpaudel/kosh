# Kosh security hardening report

**Assessment date:** 2026-08-11 (Asia/Kathmandu)  
**Branch:** `makeitsecure`  
**Assessed revision:** `150d021ab4cb6452614e1fec4a75e8a5bb938773` plus this report  
**Scope:** React/Vite frontend, Spring Boot API, PostgreSQL/Flyway schema, authentication, authorization, financial workflows, uploads, dependencies, tests, and deployment configuration.

## Executive decision

The application is materially safer than the starting revision and all 13 requested implementation phases are complete. The hardened branch has strict server-side role and tenant boundaries, session-bound authentication challenges, CSRF protection, validated uploads, idempotent financial writes, an append-only double-entry ledger, runtime-validated frontend data, strict TypeScript, dependency gates, and substantially expanded security tests.

**Release decision: conditionally blocked for production use with real money or real identity documents.** Code-level gates pass, but the five PostgreSQL invariant tests were skipped because `KOSH_TEST_DB` was not configured. Production release also requires a real SMTP authentication test, manual three-role/tenant smoke test, and infrastructure review covering TLS termination, CSP on the frontend document, database privileges, backups, secrets, and monitoring. This report is evidence of the work performed, not a claim that the system is completely secure or formally ASVS certified.

## Scope and architecture

```text
Browser (React/Vite)
  -> HTTPS JSON or multipart requests + session/CSRF cookies
Spring Boot REST API
  -> Spring Security session authentication and role checks
  -> service/controller tenant and ownership checks
  -> Spring Data JPA + Flyway
PostgreSQL
  -> members, cooperatives, applications, transactions, journal, audit history, uploads
Spring Mail
  -> login OTP, password recovery, and transactional email
```

Trust boundaries are the public browser/API boundary, authenticated role boundary, cooperative tenant boundary, API/database boundary, API/SMTP boundary, and deployment secret/TLS boundary. Actors are anonymous visitors, members, cooperative administrators, platform super-administrators, the runtime database role, migration database role, SMTP provider, and infrastructure operators.

Sensitive data includes passwords and password-reset tokens, session identifiers, OTP challenges, identity documents, signatures, profile data, cooperative registration documents, account/application data, balances, journal entries, and audit events.

## Starting state and resulting state

| Area | Previous state | Hardened state | Why |
| --- | --- | --- | --- |
| Production configuration | Development fallbacks could reach deployment; localhost/wildcard mistakes were easier to ship | `prod` requires database/mail values, secure cookies, 2FA, exact HTTPS CORS origins, and optional BCrypt-only super-admin bootstrap | Fail closed instead of silently deploying unsafe defaults |
| Authentication | Client data influenced authentication flow; challenges and recovery state were not consistently session-bound | Challenges are server-issued and server-session-bound; login throttling, OTP expiry/attempt limits, password reset, session rotation, logout, and revocation tests were added | Prevent challenge swapping, fixation, brute force, and client-side trust |
| Authorization | Several screens filtered broad responses client-side and some controller paths needed explicit tenant/ownership checks | Spring Security denies unmatched routes; controllers scope member/admin data to the authenticated identity and cooperative; frontend consumes server-authorized views | Client filtering is not authorization and enables IDOR/tenant leakage |
| CSRF/CORS | Cookie-authenticated mutations did not have one enforced CSRF boundary | CSRF cookie/header flow is installed globally; all mutations are protected; credentialed CORS uses exact configured origins | Stop cross-site state-changing requests |
| Financial writes | Retry duplication, floating-point DTOs, repeat approvals, and mutable transaction-like UI weakened integrity | UUID idempotency keys and fingerprints, `BigDecimal`, state locks, one-time reviews, double-entry posting, reversal-only ledger corrections, and database constraints | Preserve cents, stop duplicate posting and race-driven double approval |
| Ledger/audit | Transaction/history records did not provide sufficient immutable accounting guarantees | Balanced journal constraints, hash-linked cooperative sequences, append-only journal triggers, append-only activity log trigger, and reversal workflow | Detect tampering and prevent ordinary edit/delete of accounting evidence |
| Uploads | Extension/content-type checks were insufficient | Size limits, filename normalization, magic-byte/type validation, safe response types, and authorized access paths | Stop disguised active content and oversized payload abuse |
| Frontend trust | 76 JavaScript/JSX files, implicit types, optimistic parsing, local role assumptions, fake controls/status/history, debug logging, and report HTML composition | All migrated; repository now has 85 TS/TSX source files and zero JS/JSX source files; strict typecheck and runtime parsers; dead/fake controls removed; report data goes through structured PDF APIs | Make trust assumptions visible and remove misleading or injection-prone behavior |
| API origin | Production could fall back to HTTP localhost | Production defaults to same-origin `/api` and rejects configured `http://` origins | Avoid insecure credential transport and broken production routing |
| Dependencies | Vulnerable/outdated packages and no enforced backend vulnerability threshold | Packages upgraded; npm audit clean; OWASP Dependency-Check 12.2.2 runs during `verify` and fails at CVSS 7 | Make known-vulnerability review repeatable and release-blocking |
| Tests | Limited authorization and financial invariant coverage | 105 backend tests cover role matrix, tenancy, authentication, production validation, files, serialization, idempotency, ledger and loan logic; strict frontend lint/type/build gates | Convert security expectations into executable regression controls |

## Phase status and evidence

| Phase | Status | Main result | Representative commits |
| --- | --- | --- | --- |
| 1. Inventory and threat model | Complete | Actors, data, endpoints, trust boundaries, tenant and financial threats identified | `cf9466f`, this report |
| 2. Production configuration and secrets | Complete | Fail-closed prod validation, secure cookie/CORS requirements, no committed live secret found | `cf9466f` |
| 3. Authentication and sessions | Complete | Server-bound challenges, 2FA/OTP, throttling, reset controls, session authentication | `5157aed`, `fc2b40e`, `f7f3ba3`, `bcb7898` |
| 4. Authorization and tenant isolation | Complete | Deny-by-default route policy and server-side cooperative/ownership scoping | `cf9466f`, `d3142fb`, `bccaf7c`, `920b61d` |
| 5. CSRF, CORS and browser headers | Complete | CSRF on every mutation, exact credentialed origins, HSTS and API security headers | `42abcbe`, `cf9466f` |
| 6. Input, output and upload safety | Complete | Explicit request models, unknown-field rejection, runtime parsers, magic-byte validation | `5f0aa6e`, `60de9d1`, `98da8d2`, `c546934` |
| 7. Financial and concurrency integrity | Complete | Exact money, idempotency, locked reviews, double-entry ledger and reversal model | `e7a958f`, `9172918`, `f93659c` |
| 8. Auditability and sensitive data | Complete | Append-only activity history, reduced sensitive serialization, fake evidence removed | `ca73a1e`, `c90bdfd`, `e51861d`, `88e808f` |
| 9. Dependency and supply-chain controls | Complete | Dependency upgrades and CVSS-gated Maven scan; npm audit clean | `764f769`, `e128396` |
| 10. Frontend migration foundation | Complete | Strict compiler/linter boundary and typed shared components/routes | `ee7ca70` through `bcb7898` |
| 11. Member/public frontend migration | Complete | Typed and runtime-validated member, registration, package and report flows | `a44f429` through `98da8d2` |
| 12. Admin/super-admin migration | Complete | Typed dashboards, networks, users, packages, applications, analytics and transactions | `6361a87` through `11998a0` |
| 13. Final red-test, strict enforcement and report | Complete | Zero JS/JSX, full gates, dead status action and browser auth copies removed, findings and residual risks recorded | `c1460d5`, `88e808f`, `150d021`, this report |

## Authentication and session controls

- Passwords use BCrypt and sensitive authentication fields are excluded from API serialization.
- Member login uses a password plus email 2FA in production. Super-admin login supports a configured BCrypt bootstrap secret and OTP policy; an unset identity closes that bootstrap path.
- OTP and login challenges are generated server-side, expire, have attempt limits, and are associated with the current server session rather than browser-provided identity claims.
- Successful authentication rotates the session identifier. Logout invalidates the session. Password changes/resets revoke relevant session/trusted-device state.
- Login throttling and recovery maps are currently process-local. A horizontally scaled deployment needs a shared, atomic store such as Redis or database-backed counters.
- Session cookies are `HttpOnly`, `Secure`, `SameSite=Lax`, and have a configurable 30-minute idle timeout. Production startup refuses a non-secure session cookie.
- The trusted-device design supports one verifier per user and needs product review if multiple concurrent trusted devices are required.

## Authorization matrix

The table describes the outer Spring Security boundary. Controllers additionally verify authenticated user ownership, cooperative identity, application ownership/state, and server-derived IDs. All unlisted endpoints are denied.

| Endpoint family | Anonymous | Member | Cooperative admin | Super-admin |
| --- | --- | --- | --- | --- |
| `GET /api/csrf` | Allow | Allow | Allow | Allow |
| Auth login/verify/recovery and `POST /api/users` registration | Allow | Allow | Allow | Allow |
| `GET /api/networks` and public network logos | Allow | Allow | Allow | Allow |
| Session, logout, `/users/me/**`, password change | No | Own identity | Own identity | Authenticated where applicable |
| `GET /api/users` | No | No | Own cooperative | Platform scope |
| User approve/reject/delete | No | No | Own cooperative | Platform scope where allowed |
| Super-admin user mutation | No | No | No | Allow |
| Network create/update/delete, platform stats/documents | No | No | No | Allow |
| Single network details | No | Authenticated and controller-scoped | Authenticated and controller-scoped | Allow |
| Finance product reads | No | Authenticated/controller-scoped | Own cooperative | Platform-authenticated where applicable |
| Finance product mutations | No | No | Own cooperative | No by outer route policy |
| Application create and member lists | No | Own applications | No | No |
| Application network review/list | No | No | Own cooperative | No by outer route policy |
| `POST /api/transactions` | No | No | Own cooperative | No |
| `GET /api/transactions` | No | Own records | Authorized records | Authorized records where controller permits |
| `GET /api/transactions/sahakari` | No | No | Own cooperative | No |
| Ledger read/reverse/opening balance | No | No | Own cooperative | No |
| Admin analytics/history | No | No | Own cooperative | No |
| Platform analytics/history | No | No | No | Allow |

## Financial integrity

- Publicly supplied monetary values cross explicit DTO boundaries and use `BigDecimal`; PostgreSQL stores money as `numeric(18,2)`.
- Transaction submissions require a client-generated UUID idempotency key. The server fingerprints the request and PostgreSQL enforces uniqueness per cooperative. A replay with the same payload returns the existing result; a conflicting replay is rejected.
- Financial application review locks the row and permits a single valid state transition, preventing repeat approvals and double disbursement under ordinary concurrent requests.
- Journal entries contain at least two one-sided lines. A deferred PostgreSQL constraint checks total debits equal total credits at commit.
- Posted journal entries and lines cannot be updated or deleted through the database triggers. Corrections use a reversing entry.
- Each cooperative journal sequence is hash-linked. This detects a rewrite but is not an externally anchored or independently signed audit trail.
- The runtime database role should still have `UPDATE`/`DELETE` revoked from journal and audit tables. This privilege configuration is deployment-owned and was not verifiable from source.
- Maker-checker approval, recent re-authentication for high-risk posting, transaction limits, reconciliation, and external general-ledger review remain product-level requirements before real-money operation.

## Upload and output handling

- Global request/file limits are 24 MB and 8 MB respectively; endpoint validators impose accepted file families and inspect magic bytes rather than trusting names or browser MIME declarations.
- Filenames are treated as metadata and normalized. Retrieval routes apply ownership/role checks and safe content types.
- Upload blobs remain stored in PostgreSQL. Malware scanning, quarantine, encryption-at-rest evidence, retention/deletion policy, and legal handling of identity documents were not available in this repository.
- Analytics and transaction exports use structured jsPDF/AutoTable data. Untrusted data is no longer assembled into executable report HTML.
- React continues to escape rendered strings. No application use of `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, or `eval` was found in the final source scan.

## Dependency review

Final dependency evidence:

- `npm audit --audit-level=low`: **0 vulnerabilities**.
- `./mvnw clean verify`: OWASP Dependency-Check completed with **0 unsuppressed vulnerabilities** and a build threshold of CVSS 7.
- Reviewed backend versions include Spring Boot 3.5.16, Jackson 2.21.5, Log4j 2.26.1, PostgreSQL JDBC 42.7.13, and embedded Tomcat 10.1.57.
- One narrow suppression rule documents `CVE-2026-66299`: it applies to Tomcat's WebSocket chat example, which is absent from the inspected embedded jars. Remove the rule when Tomcat 10.1.58 or a later compatible version is adopted. A suppression is an accepted review decision, not proof of zero risk.
- Sonatype OSS Index was not active because current authentication credentials were unavailable. NVD and KEV-backed Dependency-Check analysis completed.

## Verification record

Executed on 2026-08-11 in Asia/Kathmandu:

| Command | Result |
| --- | --- |
| `cd frontend && npm run typecheck` | Pass; strict TypeScript, no emit |
| `cd frontend && npm run lint` | Pass; zero lint errors |
| `cd frontend && npm run build` | Pass; 3,123 modules transformed |
| `cd frontend && npm audit --audit-level=low` | Pass; 0 vulnerabilities |
| Source inventory for `*.js` and `*.jsx` under `frontend/src` | Pass; 0 files |
| Source inventory for `*.ts` and `*.tsx` under `frontend/src` | 85 files |
| `cd backend && ./mvnw clean verify` | Pass; build success |
| Backend tests | 105 run, 0 failures, 0 errors, 5 skipped |
| OWASP Dependency-Check JSON review | 0 unsuppressed findings |
| `git diff --check` | Pass |

The production frontend bundle has a roughly 2.33 MB minified main chunk (about 660 KB gzip), exceeding Vite's 500 KB warning threshold. This is a performance and availability hardening concern, not evidence of a direct vulnerability.

## Security test coverage

Automated backend tests cover:

- anonymous/member/admin/super-admin route authorization and CSRF denial;
- controller tenant isolation and cross-cooperative access attempts;
- member and super-admin login behavior, session authentication, and production configuration refusal;
- OTP/token properties and login throttling;
- upload content validation and sensitive serialization;
- exact ledger reports, postings, balances, reversals and loan repayment allocation;
- PostgreSQL migration structure and transaction idempotency behavior.

The five skipped tests are the live PostgreSQL ledger invariant tests. They require a disposable PostgreSQL database supplied through `KOSH_TEST_DB`; H2 or mocked persistence is not considered an equivalent substitute for trigger/constraint behavior.

## OWASP ASVS 5 family mapping

This is a practical control map, not formal ASVS certification.

| ASVS family | Status | Evidence / limitation |
| --- | --- | --- |
| V1 Encoding and sanitization | Implemented and tested in source gates | React escaping, structured PDF generation, no raw HTML sinks found; no browser DAST performed |
| V2 Validation and business logic | Substantially implemented | Explicit request DTOs, unknown-field failure, state transitions, idempotency, exact money; maker-checker and transaction limits remain |
| V3 Web frontend security | Substantially implemented | Strict TS/runtime parsing, no client authorization assumptions, CSRF bootstrap; frontend-document CSP depends on proxy/static host |
| V4 API and web service | Implemented at route/controller layers | Deny-all fallback, role matrix, tenant checks, safe errors; external API fuzzing not performed |
| V5 File handling | Partially implemented | Limits and magic-byte validation; malware scanning/quarantine/retention not implemented |
| V6 Authentication | Substantially implemented | BCrypt, OTP/2FA, throttling, session-bound challenges, reset flow; shared distributed throttling absent |
| V7 Session management | Substantially implemented | Secure cookie flags, rotation, expiry, logout/revocation; multi-node session strategy not assessed |
| V8 Authorization | Substantially implemented and tested | Role boundary, controller ownership and tenant tests; manual end-to-end matrix remains |
| V9 Self-contained tokens | Not applicable / limited | Primary authentication is server session based; opaque recovery/trusted-device tokens are hashed and expiring |
| V10 OAuth/OIDC | Not applicable | No OAuth/OIDC identity provider is used |
| V11 Cryptography | Partially implemented | BCrypt and secure random tokens; deployment key management and data-at-rest encryption not demonstrated |
| V12 Secure communication | Deployment dependent | Production config demands HTTPS origins and Secure cookies; edge TLS/certificates/HSTS delivery were not observed live |
| V13 Configuration | Substantially implemented | Fail-closed prod validator, safe errors, Flyway validation; runtime infrastructure remains external |
| V14 Data protection | Partially implemented | Sensitive serialization controls and scoped reads; identity-document encryption/retention/DLP not established |
| V15 Secure coding and architecture | Substantially implemented | Strict typing, runtime boundaries, layered checks, immutable ledger; independent architecture review still advised |
| V16 Security logging and error handling | Partially implemented | Append-only activity log and generic client errors; centralized alerting, tamper-evident external log storage and runbooks absent |

## Findings register

### Fixed and verified

| Finding | Prior exploit/impact | Root cause | Fix and verification |
| --- | --- | --- | --- |
| Client-influenced auth/role state | Challenge swapping, route confusion, privilege-display mismatch | Browser state treated as identity context | Server session challenges and role-derived navigation; auth/authorization tests pass |
| Cross-tenant data exposure paths | IDOR could expose another cooperative's users, applications or documents | Broad repository/controller queries plus UI filtering | Server ownership/tenant checks and scoped endpoints; tenant isolation tests pass |
| Missing CSRF boundary | Cross-site mutation with ambient session cookie | Cookie auth without universal anti-CSRF token | Cookie token + header bootstrap on every mutation; CSRF tests pass |
| Duplicate financial posting/review | Retry/race could double-post or double-approve | No unique operation key or locked state transition | Fingerprinted idempotency and database unique index; locked one-time review; tests pass |
| Inexact money transport | Rounding or overflow could corrupt amounts | Floating-point/loose frontend values | `BigDecimal`, `numeric(18,2)`, finite frontend parsing; tests pass |
| Mutable accounting/audit evidence | Ordinary updates/deletes could conceal history | Transaction log without database immutability | Append-only journal/activity triggers, reversal-only correction, hash links; migration/unit tests pass |
| Disguised uploads | Active or unexpected files could be stored/served | Trust in extension/MIME metadata | Magic-byte/type/size validation; file security tests pass |
| Report HTML injection and fake UI evidence | Untrusted text could enter generated HTML; users could rely on fabricated history/signature/status controls | String-built HTML and prototype placeholders | Structured PDF generation and removal of fake/dead controls; lint/type/build pass |
| Weak frontend type boundary | Malformed API responses caused unsafe assumptions | JavaScript and implicit object shapes | Complete TS/TSX migration, strict compiler, parsers for `unknown`; gates pass |
| Known dependency exposure | Public CVEs in old packages | Stale versions/no enforced scan | Upgrades plus npm and Maven vulnerability gates; final scans pass |

### Fixed but not live-integration verified

- Production startup refusal, secure cookie delivery, exact CORS origins, forwarded headers, SMTP OTP delivery, and proxy behavior are covered by configuration/unit tests but were not exercised in the real production environment.
- PostgreSQL migration SQL is structurally tested, while the five live trigger/constraint tests were skipped without `KOSH_TEST_DB`.
- Browser role workflows compile and build, but there is no frontend unit/e2e test framework or real-browser DAST evidence.

### Unresolved or accepted residual risk

- Authentication throttles, OTP challenges, reset state, and trusted-device state use process memory and are unsuitable for uncoordinated multi-instance scaling.
- Identity files lack an integrated malware scanner, quarantine pipeline, explicit encryption layer, and documented retention/erasure process.
- The journal hash chain is database-local and not externally anchored; a database owner could disable triggers or rewrite evidence.
- No maker-checker approval, high-value limit engine, recent-auth requirement, fraud analytics, or independent reconciliation is present.
- Frontend code splitting is needed to reduce the large main bundle and improve resilience on constrained clients.
- No CI workflow in the repository guarantees these gates run on every pull request.

### Not assessable from this repository

- Cloud/network firewall policy, WAF and rate limits, TLS protocol/cipher/certificate configuration, DNS security, container/host hardening, and availability controls.
- Production database grants, migration/runtime role separation in the deployed instance, encryption at rest, backups, restore drills, point-in-time recovery, and disaster recovery.
- Secret-manager configuration, credential rotation cadence, SMTP provider security, monitoring/SIEM alerts, incident response, privacy/legal compliance, and operator access reviews.
- Whether previously exposed credentials were fully revoked outside Git history.

## Production completion checklist

Before approving production with real data:

1. Create a disposable PostgreSQL test database, set `KOSH_TEST_DB`, rerun `./mvnw clean verify`, and require all 110 tests to execute with zero skips/failures.
2. Run a browser/API matrix as anonymous, member, admin, and super-admin, including cross-cooperative IDs, document access, CSRF failures, logout/session reuse, and concurrent application/transaction retries.
3. Validate real SMTP OTP and password-recovery delivery without logging secrets or tokens.
4. Serve the frontend and API only through HTTPS; verify Secure/HttpOnly/SameSite cookies, HSTS, exact CORS, proxy forwarding, and a frontend-document CSP. The backend CSP currently protects API responses, not automatically the separately hosted HTML document.
5. Store credentials in a secret manager; rotate database, SMTP, super-admin and deployment credentials; enable automated secret scanning.
6. Use separate least-privileged Flyway and runtime database roles. Revoke journal/audit mutation rights from runtime and prove backup/restore and point-in-time recovery.
7. Add shared atomic auth throttling/session state before horizontal scaling.
8. Add malware scanning/quarantine and an approved encryption/retention/erasure policy for identity documents.
9. Add CI gates for frontend typecheck/lint/build/audit, backend verify/dependency-check, migration tests, and secret scanning.
10. Obtain an independent penetration test and accounting/control review before processing real money.

## Branch change ledger

The branch contains 46 modular security commits before this report. Each commit uses a one-line human-readable message and contains no co-author trailer. The sequence is available with:

```bash
git log --oneline --reverse origin/main..makeitsecure
```

Major commit groups are:

- Backend security and integrity: `cf9466f` through `60de9d1`, plus `e128396`.
- Frontend strict migration and trust-boundary hardening: `ee7ca70` through `c1460d5`.
- Final red-test corrections: `88e808f`, `150d021`.

## Conclusion

All requested code and documentation phases are complete on `makeitsecure`, and the available automated gates pass. The branch should be treated as a hardened release candidate. It must not be represented as production-ready for real-money or real-identity workloads until the explicitly blocked database, live role, SMTP, TLS/infrastructure, secrets, backup, and independent review items above are closed with evidence.
