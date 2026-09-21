## GovernIQ — Phase 3 scope

Phase 2 (OCR, search, GIS, AI assistant) is complete and live. Phase 3 adds the parliamentary integrity features the chamber needs but does not have: formal approval workflows, electronic signatures, and an audit trail. These three form one coherent slice — a motion that can be approved, signed, and later audited.

### Phase 3 (this turn)
1. **Approval Workflows** — a new `workflows` table (owner-mode) with a state machine: `draft → submitted → under_review → approved | rejected | archived`. A workflow has a document, a type (motion / report / budget), a list of approver user IDs, due dates, and a decision. Members see workflows assigned to them; admins see all. Real create/read/update through `src/lib/workflows.js`.
2. **Electronic Signatures** — a `signatures` table (owner-mode) linked to a workflow. A member can sign (with optional comment); signatures carry `signed_at` and a cryptographic-style hash of the workflow state at sign time. The workflow state transitions to `approved` only when every required approver has signed.
3. **Audit Logs** — an `audit_log` table (server-written via a PiPilot BaaS function, or owner-mode with an insert helper) recording every state-changing action: who, what action, on what entity, before/after snapshot, IP if available. A read-only `/audit` page shows the trail with filters by actor, entity, and date.
4. **Wiring** — new routes `#/workflows`, `#/workflows/:id`, `#/audit` inside the existing AppLayout + permission gates (`workflows.read`, `workflows.sign`, `audit.read`). Seed 3–4 real workflow rows so the page opens populated.

### Deferred (Phase 4+)
- Notifications (push/email for approvals, session reminders)
- Public transparency portal (no-auth view of published docs, budgets, project status)
- Structured minutes with motions, votes, attendance roll
- Document versioning with diff/rollback