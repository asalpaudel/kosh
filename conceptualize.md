# Kosh — Session Handoff (Phase 0 complete, Phase 1 in progress)

Written 2026-08-11. This file is the complete state of the work so a fresh session can pick
up without re-reading the codebase from scratch. `analysis.md` (the original audit) is still
in the repo root and remains the roadmap; this file records what has actually been done
against it, how it was verified, and exactly where to resume.

Note: `.gitignore` excludes `*.md` except `README.md`, so this file and `analysis.md` are
deliberately **not** tracked in git. They live on disk only.

---

## 1. Project shape

- **Repo**: `~/Desktop/kosh`, remote `https://github.com/asalpaudel/kosh.git`
- **Branch**: all work is on `main` and pushed. `restartingproj` was fast-forward merged into
  `main` at the start of this session (144 commits) and is no longer the working branch.
- **Backend**: Spring Boot 3.5, Java 17, PostgreSQL, Flyway, `ddl-auto=validate`
- **Frontend**: React 19 + Vite 7
- **Product**: multi-tenant SaaS for Nepali savings-and-credit cooperatives (*sahakari*).
  Three roles: `member`, `admin` (per cooperative), `superadmin` (platform).
  A cooperative is a `Network`; a user's tenant is `users.sahakari_id`, held in the session
  as the `sahakariId` attribute.

### Local development

```bash
cd ~/Desktop/kosh/backend
./mvnw -o test                    # 78 tests, 5 skipped without a DB (see below)
./mvnw -o spring-boot:run         # needs DB_URL / DB_USERNAME / DB_PASSWORD
```

PostgreSQL runs locally (socket `/tmp:5432`, superuser role `asal`, no password).
Existing databases include `kosh_dev`. Scratch databases used during this session
(`kosh_e2e`, `kosh_ledgertest`, `kosh_migrationcheck`) were dropped at the end.

**Running the app against a seeded scratch database** (this is how everything was verified):

```bash
psql -d postgres -c "CREATE DATABASE kosh_e2e"
HASH=$(htpasswd -bnBC 10 "" 'DemoPass123!' | tr -d ':\n')   # bcrypt hash for the seed
DB_URL=jdbc:postgresql://localhost:5432/kosh_e2e \
DB_USERNAME=asal DB_PASSWORD="" \
SPRING_PROFILES_ACTIVE=dev SEED_PASSWORD_HASH="$HASH" \
./mvnw -o spring-boot:run -Dspring-boot.run.arguments=--server.port=8099
```

Seed accounts (dev profile, password `DemoPass123!` with the hash above):
`admin.himalayan@example.test` (admin, network 1), `aarav@example.test` and
`maya@example.test` (members). Dev profile disables 2FA and sets `cookie.secure=false`.

**Calling the API** — session cookie plus CSRF header:

```bash
curl -s -c cj -X POST localhost:8099/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin.himalayan@example.test","password":"DemoPass123!"}'
T=$(grep XSRF-TOKEN cj | awk '{print $7}')
curl -s -b cj -H "X-XSRF-TOKEN: $T" -X POST localhost:8099/api/transactions -d '...'
```

**DB-backed tests** are gated on an env var and skip without it:

```bash
psql -d postgres -c "CREATE DATABASE kosh_ledgertest"
KOSH_TEST_DB_URL=jdbc:postgresql://localhost:5432/kosh_ledgertest \
KOSH_TEST_DB_USER=asal ./mvnw -o test -Dtest=LedgerDatabaseInvariantTest
```

### Working agreements for this project

- Commit messages: **one short line, no trailers**, no `Co-Authored-By`, no "Generated with".
- Commit and push after each self-contained chunk of work.
- Never commit archives, large binaries, or PDFs.
- Response style is caveman (terse) prose; code, comments and docs stay normal English.
- Build the laziest thing that actually works; leave a `ponytail:` comment where a real
  corner was cut, naming the ceiling and the upgrade path.

---

## 2. Commits this session (all on `main`, all pushed)

```
1280a20 Split loan repayments between interest income and principal
eb523ae Derive cooperative liquidity from the ledger instead of a racy per-transaction snapshot
6110a27 Add trial balance, statements, chain verification, balance drift and opening balances
483e543 Post every money movement to the journal and fix bytea and voucher id defects it exposed
2d1afcb Add double-entry ledger with balanced-entry, append-only and hash-chain invariants
faf2da2 Require CSRF tokens on mutating requests and default session cookies to Secure
b7feae0 Add optimistic locking to member balance
d2d9850 Store and compute money as BigDecimal with numeric(18,2) columns
5028eae Generate OTPs with SecureRandom and expire reset codes after single use
d2c2d77 Enforce cooperative isolation on finance, application and transaction endpoints
82f25c5 Add session auth filter, tenant access service, Flyway baseline and auth tests
```

---

## 3. Phase 0 — done

All seven items from `analysis.md` §5 Phase 0 are complete except the service-layer
extraction, which was solved differently (see "deliberate deviations" below).

### 3.1 Tenant isolation (analysis 1.1–1.4)

`NetworkAccessService` gained `isForeign(Network, HttpSession)` alongside the existing
`canViewNetwork(Long, HttpSession)`. Both return false for a null network id; superadmin
passes.

Guards now sit on **every** endpoint that touches another cooperative's data:

- `FinanceController` — rewritten. All list / create / update / delete / banner endpoints for
  fixed deposits, saving accounts and loan packages take `HttpSession` and check ownership.
  `{id}`-keyed endpoints load the entity first and compare its network. `deleteById` was
  replaced with load-then-`delete` so the check cannot be skipped.
- `ApplicationController` — the three `/network/{networkId}` list endpoints, the three
  `/{id}/review` endpoints (checked against the loaded application's network), and the three
  member `apply` endpoints (checked against the product's network).
- `TransactionController` — target member's `sahakariId`, the package's network, and the
  linked application's network (`applicationBelongsToNetwork`).

Exit criterion met: `TenantIsolationTest` (11 tests) proves a coop-A actor gets 403 on every
coop-B resource **and** that no repository write is reached.

### 3.2 Transaction boundaries (analysis 1.5)

`@Transactional` on `TransactionController.addTransaction` and the three
`ApplicationController` review methods.

Because those methods catch exceptions and return `ResponseEntity`, a plain return would
commit dirty managed entities. Both controllers have a helper (`reject` / `rejected`) that
marks the transaction rollback-only before returning the error, guarded by
`TransactionSynchronizationManager.isActualTransactionActive()` so the methods stay unit
testable outside a transaction.

**Ordering bug fixed**: the insufficient-balance guard in `addTransaction` ran *after* an
`APPROVED` application row had already been written. The balance block now runs immediately
after the member is resolved, before any application is created.

### 3.3 Money as BigDecimal (analysis 1.6)

`V3__money_as_numeric.sql` converts all 20 money columns: amounts to `numeric(18,2)`, rates
to `numeric(5,2)`. Every `Double` in the model package became `BigDecimal` with explicit
`@Column(precision, scale)`.

`com.kosh.backend.service.Money` is the single source of the rules: `SCALE = 2`,
`ROUNDING = HALF_UP`, `ZERO`, `round()`, `orZero()`, and `of(Object)` which parses payload
values via their string form so a JSON double never becomes a balance.

`LoanService` EMI is now exact BigDecimal: rate arithmetic in a `MathContext(20, HALF_UP)`,
amounts rounded once at the end, final installment absorbs the remainder so the schedule
sums to exactly the principal. `LoanServiceTest` proves that.

### 3.4 SecureRandom OTP (analysis 1.8)

`OneTimeCode.generate()` — `SecureRandom`, full `000000`–`999999` range. Replaced
`new Random().nextInt(999999)` at all three sites (`EmailService`, `AuthController`,
`SuperAdminAuthController`).

`EmailService` password-reset codes now have a 10-minute TTL, are single-use (validation
consumes the code whatever the outcome), compared with `MessageDigest.isEqual`, and live in
a `ConcurrentHashMap`. Marked `ponytail:` — in-memory, single node only.

### 3.5 CSRF and cookies (analysis 1.9)

`SecurityConfig` uses `CookieCsrfTokenRepository.withHttpOnlyFalse()` plus
`CsrfTokenRequestAttributeHandler`. `CsrfCookieFilter` (added after `CsrfFilter`) reads the
token on every request so the cookie is always issued.

Exempt (no session exists yet, so there is nothing to ride): `/api/auth/login`,
`verify-2fa`, `forgot-password`, `reset-password`, `/api/superadmin-auth/login`,
`verify-otp`, and `POST /api/users` (registration).

`SESSION_COOKIE_SECURE` now defaults to **true**; `application-dev.properties` overrides it
to false for plain-HTTP local work. CORS origins moved to `app.cors.allowed-origins`
(`CORS_ALLOWED_ORIGINS` env var), `PATCH` added to allowed methods.

Frontend: `src/lib/csrf.js` exports `installCsrf()`, called once from `main.jsx`. It wraps
`window.fetch` and adds `X-XSRF-TOKEN` to every unsafe method. This was deliberate — 36
files call `fetch` directly, and one choke point cannot be forgotten the way a per-call
header can.

`spring-security-test` was added to `pom.xml` so `SecurityConfigAuthorizationTest` can use
`.with(csrf())`.

### 3.6 Optimistic locking (analysis 1.10, first half)

`V2__user_balance_optimistic_locking.sql` adds `users.version`; `User.version` carries
`@Version`. Concurrent balance writes now fail loudly instead of silently losing an update.

---

## 4. Phase 1 — ledger foundation done, accrual not started

### 4.1 Schema — `V4__double_entry_ledger.sql`

Three tables:

- `accounts` — chart of accounts per cooperative. `(network_id, code)` unique,
  `type IN (ASSET, LIABILITY, EQUITY, INCOME, EXPENSE)`.
- `journal_entries` — `network_id`, `sequence_no` (unique per network, starts at 1),
  `entry_date`, `narration`, `voucher_ref`, `source_type`, `source_id`, `posted_at`,
  `posted_by`, `reverses_entry_id`, `previous_hash`, `entry_hash`.
- `journal_lines` — `entry_id`, `account_id`, `member_id` (nullable), `debit`, `credit`,
  `line_memo`. CHECK constraints force non-negative amounts and exactly one side per line.

Three invariants enforced **in the database**, not just in Java:

1. `journal_lines_balance_ck` — a `DEFERRABLE INITIALLY DEFERRED` constraint trigger that
   fires at commit and requires ≥2 lines and `SUM(debit) = SUM(credit)` per entry.
2. `journal_entries_append_only` / `journal_lines_append_only` — `BEFORE UPDATE OR DELETE`
   triggers that raise. Corrections happen by reversal only. Production should *also* revoke
   UPDATE/DELETE from the runtime role; the trigger holds regardless of role.
3. Hash chain — each entry stores the previous entry's hash for its cooperative.

`V5__repayment_allocation.sql` adds `repayment_schedules.interest_paid` and
`principal_paid`, and back-fills rows already marked `PAID`.

### 4.2 Java — package `com.kosh.backend.ledger`

- **`Accounts`** — default chart, as code constants. `1000` Cash, `1010` Bank,
  `1100` Loans Receivable, `2000` Member Savings, `2100` Fixed Deposits, `3000` Share
  Capital, `3100` Reserve Fund, `3800` Opening Balance Equity, `3900` Retained Earnings,
  `4000` Interest Income, `4100` Fee Income, `5000` Interest Expense, `5100` Operating
  Expense. **Codes are stable identifiers — never renumber them.**
- **`LedgerLine`** — record `(accountCode, member, debit, credit, memo)` with
  `debit/credit/memberDebit/memberCredit` factories and `mirrored()`.
- **`LedgerService`** — the only posting path.
  - `post(...)` and `reverse(...)` are `@Transactional(propagation = MANDATORY)`, so a
    ledger write can only happen inside the caller's transaction.
  - `write()` validates balance in Java, calls `ensureChartOfAccounts`, then
    `networkRepo.lockForPosting(networkId)` (`SELECT id … FOR UPDATE`) to serialise posting
    per cooperative before reading the chain tip.
  - `ensureChartOfAccounts` **tops up** missing accounts rather than all-or-nothing, so
    cooperatives created before an account existed pick it up.
  - `hash()` / `canonicalForm()` — SHA-256 over network id, sequence, date, narration,
    voucher, source, reversal target, sorted line tuples, and the previous hash.
  - `GENESIS_HASH` = 64 zeros.
- **`LedgerPostings`** — pure translation from operational vocabulary to debits and credits.
  Member heads are exactly `Savings`, `Fixed Deposit`, `Loan` (the UI's `userProduct`
  select). Network heads are free text prefixed `Income:` or `Expense:`. Cheque/transfer/bank
  settle through `1010`, everything else through `1000`. **Refuses anything unrecognised**
  rather than mis-posting. Also has `savingsToFixedDeposit`, `loanDisbursedToSavings`,
  and `loanRepayment(member, principal, interest, overpayment, …)`.
- **`LedgerReports`** — `trialBalance`, `incomeStatement`, `balanceSheet`, `verifyChain`,
  `accountBalance`, `liquidity`, `derivedSavingsBalance`, `balanceDrift`,
  `postOpeningBalances`.
- **`LedgerController`** — `/api/ledger/**`, admin-only, scoped to the session's own
  cooperative (never takes a network id from the caller):
  `GET accounts | journal | trial-balance | income-statement | balance-sheet | verify |
  balance-drift`, `POST opening-balances`, `POST entries/{id}/reverse`.

### 4.3 Where journal entries are written

| Path | Entry |
|---|---|
| `TransactionController.addTransaction` | via `journalLinesFor(tx, member)` |
| FD application approval | `savingsToFixedDeposit` |
| Savings application approval | member savings credit |
| Loan application approval | `loanDisbursedToSavings` |
| `POST /api/ledger/opening-balances` | Dr `3800` / Cr `2000` per member |

The legacy `transactions` table rows are still written — they remain the *operational*
record and drive the existing UI. The journal is the *accounting* record. Both are written
in the same database transaction, so they cannot diverge.

### 4.4 Reserve / liquidity — now derived

The old `networkReserve` was `(savings + FD) − loans + own funds`, recomputed from four
aggregates and stamped on each transaction row. Two tellers posting at once each wrote a
figure that ignored the other.

Replaced by `LedgerReports.liquidity(networkId)` = balance of Cash + Bank from the journal.
By the accounting identity this is the *same number*, with no race and no possibility of
drift. Verified numerically during e2e (`−12749.50` both ways).

Used in three places: `TransactionController` (stamped after posting, inside the serialised
transaction), `ApplicationController` loan approval (the 70 % rule), and
`AnalyticsController` (dashboard — savings, FD, loans, reserve and pool are all now read
from the ledger).

### 4.5 Loan repayment interest split

`RepaymentAllocation.allocate(schedule, payment)` settles installments oldest first and,
within each, interest before principal. Returns `(interest, principal, unallocated, touched)`
and mutates the installments, setting status `PAID` / `PARTIAL`.

`TransactionController.journalLinesFor` detects a loan repayment (head `Loan`, direction
`Credit`, `applicationType == "loan"`, `applicationId` present), allocates, saves the
touched installments, and posts Dr Cash / Cr Loans Receivable (principal) / Cr Interest
Income (interest) / Cr Member Savings (any overpayment).

Allocation order is fixed and marked `ponytail:` — make it configurable per cooperative
only when one actually asks.

---

## 5. Bugs found and fixed along the way

These were pre-existing, not introduced by this work. They were found by running the app for
real rather than by reading it.

1. **`@Lob byte[]` mapped to Postgres OID.** Every `users` UPDATE failed with
   *"column citizenship_data is of type bytea but expression is of type oid"*, which means
   **member deposits were broken app-wide**. Removed `@Lob` from all byte[] fields in
   `User`, `Network`, `FixedDeposit`, `SavingAccount`, `SavingAccount`, `LoanPackage`; the
   columns are plain `bytea` and `columnDefinition` already said so.
2. **Network-mode transactions could never be saved.** The UI sends `voucherId: null` for
   cooperative income/expense, against a `NOT NULL` column. Now auto-generates
   `NET-XXXXXXXX` when blank.
3. **Dev seed inconsistency.** Installments marked `PAID` had no paid amounts, so allocation
   started from installment 1 instead of 11. Seed now settles them.
4. **Double reversal returned 500 instead of 409.** The service's `IllegalStateException`
   crossed the transaction proxy and marked the request rollback-only. The controller now
   checks `existsByReversesEntryId` before calling.
5. **Dead code.** `ApplicationController` had a private duplicate of
   `generateRepaymentSchedule` shadowed by `LoanService`. Deleted.

---

## 6. How it was verified

78 tests, 5 skipped without a database. Test classes added this session:

| Class | Covers |
|---|---|
| `TenantIsolationTest` (11) | Phase 0 exit criterion — coop-A gets 403 on every coop-B resource, no repo write reached |
| `OtpTest` (3) | code range/distribution, single use, rejection paths |
| `LoanServiceTest` (4) | EMI sums to exactly the principal, scale 2, zero-rate case |
| `LedgerServiceTest` (9) | balance refusal, chain linkage, tamper changes hash, reversal mirroring, no double reversal |
| `LedgerPostingsTest` (6) | every mapping balances, correct accounts/sides, unknown input refused |
| `LedgerReportsTest` (6) | normal-side balances, unbalanced detection, balance sheet folds surplus, chain break detection (edited entry, removed entry) |
| `RepaymentAllocationTest` (7) | interest-before-principal, spillover, resumption, overpayment, full settlement |
| `LedgerDatabaseInvariantTest` (5, DB-gated) | the invariants hold **in Postgres**: balanced-at-commit, ≥2 lines, single-side CHECK, UPDATE and DELETE both refused |

**Live verification against a real Postgres** (not mocks):

- All migrations V1–V5 applied to a scratch DB; app booted with `ddl-auto=validate` passing.
- CSRF: POST without token → 403; with token → 401 (past CSRF, hits auth); login → 200.
- Posted savings deposit, cheque withdrawal, rent expense, fee income → trial balance
  `19250.50 / 19250.50`, balanced. Balance sheet balanced.
- **Tamper test**: disabled the append-only trigger (as a DB-level attacker would), added
  50000 to a posted credit → `verify` returned
  `{intact: false, brokenAtSequence: 1, "Stored hash does not match the entry's contents"}`
  and the trial balance went unbalanced. Restored → intact again.
- Reversal → new entry, mirrored lines, `reversesEntryId` set. Second attempt → 409.
- Member calling `/api/ledger/trial-balance` → 403.
- `opening-balances` → 2 entries, 125500.00 recognised, drift 2 → 0; re-run → 0 entries.
- Loan repayment of 8884.88 → Dr Cash 8884.88 / Cr Loans Receivable 8709.82 / Cr Interest
  Income 175.06; installment 11 marked `PAID`; income statement surplus 175.06; drift 0;
  chain intact.

---

## 7. Deliberate deviations from `analysis.md`

- **No service-layer extraction.** Phase 0 item 1 asked for one. Instead `@Transactional`
  went on the controller methods and the ledger logic went into its own package. The
  transactional guarantee is real, but business rules still live in controllers.
  `UserController` is 926 lines, `ApplicationController` ~700. This is the largest
  outstanding structural debt and is the right thing to do before Phase 2 piles on.
- **No PostgreSQL row-level security.** Explicit tenant checks are in place everywhere and
  proven by test; RLS as defence-in-depth was not added.
- **Reserve semantics changed** from the four-aggregate formula to Cash + Bank. Numerically
  identical by the accounting identity, and verified as such, but worth knowing if a number
  on a dashboard is ever questioned.

---

## 8. What to do next

### Immediately next — finish Phase 1 (analysis §5 items 12–13, partially done)

1. **Interest accrual.** Daily or monthly accrual on savings balances, posted as journal
   entries: Dr `5000` Interest Expense / Cr `2000` Member Savings. Nothing exists yet.
2. **FD maturity processing.** Interest posting at term, auto-renewal or payout.
   `FixedDepositApplication` already stores `maturityDate` and `maturityAmount`.
3. **Penalty interest on overdue installments.** `RepaymentAllocation` currently orders
   interest → principal; the intended order is penalty → interest → principal, so a penalty
   bucket needs adding to `RepaymentSchedule` and to the allocator.
4. **Idempotent day-end / month-end close.** A processing-date lock table so running it twice
   cannot double-post. This is the piece that makes accrual safe to automate.
5. **Demote `User.balance` to a pure cache.** It is now *checkable* (`/api/ledger/balance-drift`
   returns 0) but is still authoritative in the money paths. Make the ledger authoritative,
   keep the column as a maintained cache, and alarm on drift on a schedule.

### Then Phase 2 (sellable product), roughly in this order

Share capital and dividends (this is what makes it a cooperative rather than a small bank),
collateral and guarantors, delinquency classification, **Bikram Sambat dates and fiscal year
Shrawan–Asar**, Nepali UI, SMS instead of email for OTP and alerts, teller/auditor/board
roles, maker–checker, CSV import, regulatory report pack.

### Known gaps not yet touched

- Raw JPA entities are still returned from many endpoints (denylist via `@JsonIgnore`
  rather than purpose-built DTOs).
- `UserRepository extends JpaRepository<User, Integer>` while `User.id` is `Long`, hence
  `.intValue()` casts scattered through controllers.
- `catch (Exception e) { e.printStackTrace(); }` and `System.out.println` as the logging
  strategy. No structured logging, no correlation ids.
- Identity documents stored as `bytea` in the primary database, no size or MIME validation.
- Frontend API base URLs hardcoded to `http://localhost:8080/api` in many components.
- 19 known npm vulnerabilities; 2.34 MB main JS chunk.
- Three endpoints the UI calls that do not exist: `GET /api/networks/recent`,
  `GET /api/analytics/network-snapshot`, `PUT /api/transactions/{id}/status`.
- OTP storage is in-memory and single-node; no rate limiting on login or OTP verification.
- No CI, no backups, no monitoring, no staging.

---

## 9. The commercial thesis (unchanged, from `analysis.md` §4)

Do not compete on feature count against Sahakari Software or the local ERP vendors — they
have a decade of edge cases. Compete on what the sector became afraid of after roughly
Rs 87.89 billion in embezzlement left about 60,000 depositors locked out.

> The cooperative software where the books cannot be quietly rewritten — and members can
> check for themselves.

The work done this session is exactly that pitch made real: an append-only hash-chained
journal, balances derived from the ledger, a verification endpoint, and a checkpoint hash
that can be published to members. The remaining differentiators are maker–checker, a
read-only auditor role, and the member-facing passbook app.

Target buyer: savings-and-credit cooperatives of roughly 500–5,000 members, at about
NPR 5,000–25,000/month tiered by member count, landed via 2–3 discounted design partners.
Honest estimate to a defensible paid launch: 4–6 months full-time from the start of Phase 0,
of which Phase 0 and the ledger foundation are now behind us.

---

## 10. `addingmorefeature` branch completion

This branch completed the nine requested product phases: restored the platform dashboards;
added Bikram Sambat dates and Nepali fiscal years; implemented share capital; introduced
idempotent closes and period locks; accrued configurable savings interest; secured loans
with collateral, guarantor exposure controls, classification and provisioning; enforced
maker-checker with a tenant-scoped auditor pack; and moved member balances, history and
portfolio views onto the journal. Month-end now publishes immutable checkpoint hashes
through the pluggable email channel, giving members an external receipt of the ledger chain.
SMS remains deliberately deferred.
