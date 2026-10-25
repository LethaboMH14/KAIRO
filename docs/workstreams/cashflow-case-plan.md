# Synthetic cash-versus-profit study case plan

Status: plan only; no implementation approved.  
Backlog context: accounting / SME study case (items 7, 8 and 13).  
Owner: `codex-device-controls-audit-20261022-a` (gpt-6-luna, low).  
Source checked: OpenStax *Principles of Accounting, Volume 1: Financial Accounting*, §§16.1 and 2.1.

## Learning goal

Give a learner a small, replayable ledger where they calculate beginning and ending cash and a simplified period profit, then explain why those numbers differ. The case teaches one accounting distinction; it is not business, tax, credit or investment advice, and it does not assess real financial competence.

OpenStax explains that accrual accounting separates when revenue or expense is recorded from when cash changes hands, and that a statement of cash flows shows cash inflows and outflows separately from income-statement amounts. The case below applies those general teaching principles in original wording and with entirely authored numbers. It is not a reproduction of OpenStax examples, figures, images, or assessment questions. [OpenStax §16.1](https://openstax.org/books/principles-financial-accounting/pages/16-1-explain-the-purpose-of-the-statement-of-cash-flows); [OpenStax §2.1](https://openstax.org/books/principles-financial-accounting/pages/2-1-describe-the-income-statement-statement-of-owners-equity-balance-sheet-and-statement-of-cash-flows-and-how-they-interrelate).

## Authored case and answer key

**Corner Fix Bicycle Workshop** is a fictional one-person repair shop. All amounts are invented for this exercise and shown in South African rand (R). Opening cash is **R1,000.00**. The exercise covers one short month. It starts with cash only; no opening receivable/payable balances are assumed. Store money as integer cents in any future implementation.

| # | Authored event | Cash change | Revenue change | Expense change | Treatment for this exercise |
|---:|---|---:|---:|---:|---|
| 1 | Owner adds cash to the workshop | +R2,000 | R0 | R0 | Owner contribution; not revenue |
| 2 | Repairs are completed and paid for immediately | +R1,600 | +R1,600 | R0 | Earned service revenue and receipt |
| 3 | Repairs are completed; customer will pay later | R0 | +R900 | R0 | Earned service revenue; receivable, no receipt yet |
| 4 | Customer pays R400 toward event 3's invoice | +R400 | R0 | R0 | Cash collection; no second revenue entry |
| 5 | Parts are used on completed repairs and paid for | −R700 | R0 | +R700 | Current-period expense and payment |
| 6 | Wages for this month are incurred and paid | −R500 | R0 | +R500 | Current-period expense and payment |
| 7 | This month's rent is incurred and paid | −R450 | R0 | +R450 | Current-period expense and payment |
| 8 | Workshop buys a repair stand expected to last beyond this month | −R800 | R0 | R0 | Equipment asset; no depreciation in this simplified exercise |
| 9 | Workshop receives a small bank loan | +R1,000 | R0 | R0 | Borrowing; liability, not revenue |
| 10 | Workshop repays R200 of loan principal | −R200 | R0 | R0 | Principal reduction; not an expense |
| 11 | Customer pays a deposit for next month's repair | +R300 | R0 | R0 | Advance/liability; not yet earned revenue |

**Key calculations**

- Total cash change: `2,000 + 1,600 + 0 + 400 − 700 − 500 − 450 − 800 + 1,000 − 200 + 300 = R2,650`.
- Closing cash: `R1,000 opening cash + R2,650 change = R3,650`.
- Revenue earned this month: `R1,600 + R900 = R2,500`.
- Included expenses: `R700 + R500 + R450 = R1,650`.
- Simplified period profit: `R2,500 − R1,650 = R850`.
- The remaining R500 of the invoice is still unpaid. The R300 deposit is not revenue in this case because the related repair happens next month. The R800 stand purchase is treated as an asset and depreciation is deliberately excluded.

The result demonstrates that this exercise's profit (R850) is different from its cash change (R2,650) and closing cash (R3,650). Owner funding, borrowing, asset purchase, debt repayment, customer-credit timing and an advance explain the difference. Do not label the case a complete set of accounts or apply a jurisdictional accounting/tax rule from it.

## Suggested learner flow

1. **Estimate first.** Show the opening cash and event descriptions. Ask the learner to enter closing cash and simplified profit before revealing classifications. Make clear that no response is official advice or an independently graded result.
2. **Classify the events.** For each item, ask separately whether cash changes now and whether current-period revenue/expense changes. Offer a short textual explanation for each event type, not only a color cue.
3. **Replay the ledger.** Step through the 11 events in stable order. Show a running cash balance and separate running revenue, expense and profit totals. Allow previous/next, jump to an event, and restart without changing the authored source data.
4. **Reconcile.** Ask the learner to explain two specific contrasts: the R900 credit sale versus R400 later collection, and the loan/owner/deposit/equipment events versus profit. Give rule-based feedback for the explicit entries, with the calculation shown.
5. **Reflect.** Offer a short optional prompt: “Which event changed cash without changing this month’s profit, and which event changed profit before all its cash arrived?” Learners may save a reflection or skip it. Label all data as fictional.

Failed attempts remain visible in chronological order with the submitted answer, the rule checked, the result, and any help opened. Assistance should be available on request (for example, reveal one event’s cash effect or show the formula), and its use should be recorded as assistance, never silently converted to a lower grade. Display “matches the authored case key” or the specific mismatch; do not create an independent-grade claim or infer the learner’s job readiness.

## Proposed client contract (requires root publication and approval)

This is a proposal, not a published shared API. Before implementation, root should approve the event categories, arithmetic assumptions, persistence location, and response shape through the coordination bus/handoff.

- `CaseDefinition`: immutable `caseId`/`version`, title, fictional-data notice, currency `ZAR`, integer-cent `openingCash`, the 11 ordered event records, and the authored key/rule text.
- `CaseEvent`: stable `eventId`, sequence, learner-facing narrative, category, integer-cent `cashDelta`, integer-cent `revenueDelta`, integer-cent `expenseDelta`, and one short explanation. Categories distinguish earned cash sale, credit sale, collection, operating expense, owner contribution, equipment purchase, borrowing, principal repayment and customer advance.
- `replay(caseDefinition, throughSequence) -> ReplaySnapshot`: pure deterministic projection returning cash, revenue, expense, simplified profit, next event index and the processed event IDs. A snapshot must be derivable from the opening balance plus the exact event prefix; no narrative model call is required.
- `submitAttempt(session, answer) -> session`: append an attempt record with sequence/time, prompt key, submitted amount/classification, per-field exact-key result and any assistance IDs already used. Wrong attempts are retained and never overwrite earlier submissions.
- `recordAssistance` and `saveReflection`: append learner-visible events linked to the case version. Assistance/reflection events do not enter the arithmetic projection. Reflection remains optional and is stored only if a learner explicitly saves it.

No endpoint, cloud provider, account, connection, AI inference, background grading or new local-storage key is proposed here. Session persistence and export behavior remain an open decision for root; do not implement against an assumed storage contract.

## Accessibility and interaction requirements

- Every number and classification must be available in ordinary readable text; color and animation are supplementary.
- Keyboard operation for answers, event navigation, hints, replay, pause/restart and reflection save/skip; visible focus and predictable order.
- Screen-reader labels include event number, description, cash delta, revenue/expense effect and running balance. Announce only the newly replayed step and its updated totals through a polite live region.
- Respect reduced motion. Provide a static transaction table and direct “show final calculation” path so replay animation is not required.
- Use `R` consistently, format output to two decimal places, and state “fictional practice case” near the ledger and results.
- Keep attempted answers and hints inspectable; do not mark an attempt as a credential, formal assessment, or employer verification.

## Meaningful future tests

1. Check the authored totals: cash change R2,650; close R3,650; revenue R2,500; expenses R1,650; simplified profit R850.
2. Verify every replay prefix against an independent hand-calculated fixture, including opening cash and final event position.
3. Verify credit sale increases revenue but not immediate cash; later collection increases cash but not revenue.
4. Verify owner contribution, loan proceeds, principal repayment, equipment purchase and customer advance do not change simplified profit; payments and deposits still change cash as listed.
5. Verify replay is deterministic and leaves the immutable case definition unchanged.
6. Verify failed answers append in order, assistance is linked to the relevant attempt, and saved/skipped reflection has no effect on balances.
7. Reject malformed IDs, duplicate event sequence values, non-integer-cent amounts, non-finite values and unsupported event categories before projection.
8. Run keyboard and screen-reader checks for event navigation and balance announcements; test reduced-motion and static-table paths if a UI is later approved.

## Scope and next gate

This deliverable is a planning document only. Root must publish and approve the shared API/storage contract before any code task begins. Keep the case authored and local; do not read private files, connect financial accounts, import company records, call a bank or imply a financial recommendation.
