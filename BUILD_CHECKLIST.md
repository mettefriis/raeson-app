# ræson — Enterprise Build Checklist

*Track progress here. Check off each item as completed.*

---

## 1. Infrastructure & Deployment

| # | Task | Notes | Done |
|---|------|-------|------|
| 1.1 | Push codebase to private GitHub repo | github.com/mettefriis/raeson-app | - [x] |
| 1.2 | Switch SQLite → Postgres | DATABASE_URL env var, psycopg2-binary added | - [x] |
| 1.3 | Deploy backend on Railway | Live — Dockerfile builder, ANTHROPIC_API_KEY set | - [x] |
| 1.4 | Deploy frontend on Vercel | Live — Root Directory: frontend, VITE_API_URL set | - [x] |
| 1.5 | Register domain (raeson.app or similar) | ~€15/year, point to Vercel | - [ ] |
| 1.6 | Set up Railway EU region | GDPR — data must stay in EU | - [ ] |
| 1.7 | Configure uptime monitoring | Better Uptime monitoring /api/health every 3 minutes | - [x] |
| 1.8 | Set up error logging | Sentry DSN set in Railway — FastAPI + SQLAlchemy integrations | - [x] |
| 1.9 | Automated DB backups | Railway Postgres daily backup, enable in dashboard | - [ ] |

> **Status as of 2026-04-05:** Backend live on Railway, frontend live on Vercel, assessments working end-to-end.

---

## 2. Database Schema

| # | Task | Notes | Done |
|---|------|-------|------|
| 2.1 | Add `jurisdiction` field to `CodeRequirement` | "DK", "NL", "SE", "NO", "DE" — needed before Nordic expansion | - [x] |
| 2.2 | Add `projects` table | name, project_number, address, building_type, building_class, climate_zone, architect_name, firm_name, created_at | - [x] |
| 2.3 | Add `project_id` FK to `AssessmentLog` | Links assessments to projects | - [x] |
| 2.4 | Add decision fields to `AssessmentLog` | decision, decision_timestamp, decision_by, decision_note | - [x] |
| 2.5 | Add `firm_id` FK to `AssessmentLog` | Links assessments to firm account | - [x] |
| 2.6 | Add `Firm` table | name, logo_url, created_at | - [x] |
| 2.7 | Add `User` table | email, firm_id, role (admin/member), created_at | - [x] |
| 2.8 | Write Alembic migration scripts | Replace manual `init_db()` with proper migrations for production | - [x] |

---

## 3. Auth & Multi-user

| # | Task | Notes | Done |
|---|------|-------|------|
| 3.1 | Integrate Clerk for auth | Drop-in React component. Free tier covers early stage. 1 day. | - [ ] |
| 3.2 | Protect all API endpoints with auth middleware | JWT verification on every `/api/*` route | - [ ] |
| 3.3 | Firm onboarding flow | Sign up → create firm → invite team members | - [ ] |
| 3.4 | Team member invite by email | Admin sends invite, member joins firm | - [ ] |
| 3.5 | Role-based access | Admin (can invite, see billing) vs. Member (can assess) | - [ ] |
| 3.6 | Firm settings page | Firm name, logo upload, member management | - [ ] |

---

## 4. Project Context (Phase 1)

| # | Task | Notes | Done |
|---|------|-------|------|
| 4.1 | Project list as landing screen | Replace current query box as homepage | - [ ] |
| 4.2 | Create project form | Name, project number, address, building type, class, climate zone | - [ ] |
| 4.3 | Project selector before assessment | "New assessment" always starts from within a project | - [ ] |
| 4.4 | Project context auto-fills assessment | Building type/class/climate zone inherited — architect never re-enters | - [ ] |
| 4.5 | Edit / archive project | Basic project management | - [ ] |

---

## 5. Structured Input (Phase 2)

| # | Task | Notes | Done |
|---|------|-------|------|
| 5.1 | Structured input form (default mode) | Specified product field, proposed product field, building element dropdown | - [ ] |
| 5.2 | Product autocomplete on both fields | Search against product DB as user types | - [ ] |
| 5.3 | "Not in database" fallback | If product not found, accept free text and flag as unverified | - [ ] |
| 5.4 | Optional context note field | Free text for anything the structured fields don't capture | - [ ] |
| 5.5 | Free-text fallback mode | Toggle to current query box for complex cases | - [ ] |
| 5.6 | Structured fields bypass LLM parser | Map directly to orchestrator — faster, no parsing errors | - [ ] |

---

## 6. Contractor PDF Upload (Phase 3)

| # | Task | Notes | Done |
|---|------|-------|------|
| 6.1 | PDF → image conversion (PyMuPDF) | Convert uploaded PDF pages to images before Vision call | - [ ] |
| 6.2 | Extend `/assess/with-plan` to accept PDF | Currently accepts JPG/PNG/IFC — add .pdf | - [ ] |
| 6.3 | Vision extraction prompt for contractor docs | Extract: specified product, proposed product, element, contractor name, project ref | - [ ] |
| 6.4 | Pre-fill structured input from extraction | Architect confirms extracted fields before running assessment | - [ ] |
| 6.5 | Confidence indicators on extracted fields | Show "extracted from document" badge on pre-filled fields | - [ ] |

---

## 7. Decision Record (Phase 4)

| # | Task | Notes | Done |
|---|------|-------|------|
| 7.1 | Approve / Request info / Reject buttons on result | Shown after assessment completes | - [ ] |
| 7.2 | Decision saves to DB with timestamp + user | Immutable record — cannot be edited after saving | - [ ] |
| 7.3 | Optional decision note | Free text field before confirming decision | - [ ] |
| 7.4 | Decision status shown on assessment | Badge: Approved / Under review / Rejected | - [ ] |
| 7.5 | Decision reflected in exported PDF | Cover page shows decision status, architect name, date | - [ ] |

---

## 8. Assessment History Dashboard (Phase 5)

| # | Task | Notes | Done |
|---|------|-------|------|
| 8.1 | Assessment list within each project | Table: date, specified, proposed, element, verdict, decision | - [ ] |
| 8.2 | Filter by verdict (pass/conditional/fail) | Dropdown filter | - [ ] |
| 8.3 | Filter by decision status | Approved / Under review / Rejected / Undecided | - [ ] |
| 8.4 | Click row to open full assessment | Re-renders saved assessment JSON — no re-running | - [ ] |
| 8.5 | Firm-wide view across all projects | Admin can see all assessments across all projects | - [ ] |
| 8.6 | Export history as CSV | For project file handover | - [ ] |

---

## 9. Firm Identity on Outputs (Phase 6)

| # | Task | Notes | Done |
|---|------|-------|------|
| 9.1 | Logo upload in firm settings | Accept PNG/SVG, store in Railway volume or S3 | - [ ] |
| 9.2 | Logo embedded in PDF header | Alongside ræson mark on every page | - [ ] |
| 9.3 | Firm name in PDF footer | "Assessment prepared by [Firm Name] using ræson" | - [ ] |
| 9.4 | Architect name on PDF cover | Pulled from user account | - [ ] |

---

## 10. Swedish Requirements (BBR)

| # | Task | Notes | Done |
|---|------|-------|------|
| 10.1 | Extract fire reaction requirements from BBR | Feed BBR PDF to Claude, extract euroclass thresholds per element/building type | - [ ] |
| 10.2 | Extract thermal requirements (U-values) | BBR 9:2 energy chapter | - [ ] |
| 10.3 | Extract carbon/energy requirements | BBR primary energy number limits | - [ ] |
| 10.4 | Seed requirements into DB with jurisdiction="SE" | Validate against known SE building projects | - [ ] |
| 10.5 | Update LLM parser to detect SE projects | Swedish cities, "BBR", Swedish building types → jurisdiction=SE | - [ ] |
| 10.6 | Seed top 20 Swedish named products | Paroc, Skanska, Isover SE, Rockwool SE variants | - [ ] |

---

## 11. Norwegian Requirements (TEK17)

| # | Task | Notes | Done |
|---|------|-------|------|
| 11.1 | Extract fire reaction requirements from TEK17 | Similar structure to DK — should map cleanly | - [ ] |
| 11.2 | Extract thermal requirements | TEK17 chapter 14 | - [ ] |
| 11.3 | Extract energy requirements | TEK17 energy frame | - [ ] |
| 11.4 | Seed requirements into DB with jurisdiction="NO" | | - [ ] |
| 11.5 | Update LLM parser to detect NO projects | Norwegian cities, "TEK17" → jurisdiction=NO | - [ ] |
| 11.6 | Seed top 20 Norwegian named products | Rockwool NO, Glava, Hunton, Jackon | - [ ] |

---

## 12. German Requirements (GEG)

| # | Task | Notes | Done |
|---|------|-------|------|
| 12.1 | Extract thermal/energy requirements from GEG | Federal level — straightforward | - [ ] |
| 12.2 | Extract fire requirements (MBO model code) | Model building code — 16 states vary, use MBO as baseline | - [ ] |
| 12.3 | Flag state variation as limitation | Note in results: "fire rules may vary by Bundesland" | - [ ] |
| 12.4 | Seed requirements into DB with jurisdiction="DE" | | - [ ] |
| 12.5 | Update LLM parser to detect DE projects | German cities, "GEG", "MBO" → jurisdiction=DE | - [ ] |
| 12.6 | Seed top 20 German named products | Knauf DE, Rockwool DE, Isover DE, Kingspan DE | - [ ] |

---

## 13. Enterprise Compliance & Trust

| # | Task | Notes | Done |
|---|------|-------|------|
| 13.1 | Privacy policy page | Required for any EU customer. Use a generator + customise. | - [ ] |
| 13.2 | Terms of service | Covers liability disclaimer — ræson is advisory, not a formal certificate | - [ ] |
| 13.3 | Data processing agreement (DPA) template | Enterprise IT will require this. One-page standard DPA. | - [ ] |
| 13.4 | Cookie consent banner | Required under EU ePrivacy directive | - [ ] |
| 13.5 | Confirm EU data residency | All data stored in Railway EU region — document this | - [ ] |
| 13.6 | Account deletion / data export | GDPR right to erasure + portability | - [ ] |

---

## 14. Sales & Distribution

| # | Task | Notes | Done |
|---|------|-------|------|
| 14.1 | Update marketing website with live product link | raeson.app pointing to deployed product | - [ ] |
| 14.2 | Write first piece of professional content | "What BR25 § 297 means for facade substitutions in 2027" — publish in Arkitekten | - [ ] |
| 14.3 | Identify 10 target enterprise firms | DK: Henning Larsen, COBE, C.F. Møller, Arkitema. NL: Mecanoo, MVRDV, UNStudio | - [ ] |
| 14.4 | Find warm introduction to 3 technical directors | Architecture school network, LinkedIn, conference contacts | - [ ] |
| 14.5 | First pilot conversation | Free, on a live project. Fix what breaks. | - [ ] |
| 14.6 | Reference case study | One firm, one project, real numbers (time saved, assessments run) | - [ ] |
| 14.7 | First paid contract | Target: €2,000/month | - [ ] |

---

## Summary

| Category | Total tasks | Done |
|---|---|---|
| Infrastructure & Deployment | 9 | 0 |
| Database Schema | 8 | 0 |
| Auth & Multi-user | 6 | 0 |
| Project Context | 5 | 0 |
| Structured Input | 6 | 0 |
| Contractor PDF Upload | 5 | 0 |
| Decision Record | 5 | 0 |
| Assessment History | 6 | 0 |
| Firm Identity | 4 | 0 |
| Swedish Requirements | 6 | 0 |
| Norwegian Requirements | 6 | 0 |
| German Requirements | 6 | 0 |
| Enterprise Compliance | 6 | 0 |
| Sales & Distribution | 7 | 0 |
| **Total** | **85** | **0** |

---

*Updated: 2026-04-05*
