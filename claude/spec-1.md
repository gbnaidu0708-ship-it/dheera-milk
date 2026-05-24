You are working on a Milk Delivery Subscription Management platform with Customer and Admin dashboards. Apply the following corrections, feature additions, validation rules, invoice handling, and performance optimizations carefully.

Important:

- Existing functionality should not break.
- All calculations must be based on the CURRENT MONTH dynamically.
- Never hardcode month days.
- Use proper date utilities for month calculations.
- Optimize all slow-loading pages and unnecessary API calls/re-renders.
- Ensure all dashboard counts and invoice values are accurate after subscription modifications.

==================================================
CUSTOMER SIDE CHANGES
=====================

1. UPI PAYMENT SUPPORT

---

Add UPI payment support for customers.

UPI ID:
gbnaidu0708@ybl

QR Image Path:
'/assets/pay-qr.jpeg'

Requirements:

- After successful subscription creation/update, show:
  - UPI QR code
  - UPI ID
  - Payment note:
    "You can pay now or pay by the end of the current month."

- Payment is OPTIONAL initially.
- If payment is pending:
  - Show "Invoice Pending" status in Invoice tab
  - Show payment pending alert/banner on Home screen

- If payment completed:
  - Mark invoice as PAID
  - Enable Download Invoice button for current month invoice

---

2. MID-MONTH SUBSCRIPTION LOGIC

---

If a customer joins in the middle of a month:

- Subscription should only count from joining date till end of current month
- Pricing/invoice should be prorated based on remaining days
- Auto-renew should start from next month onwards
- Never calculate charges for previous days before joining

Example:
If customer joins on June 15:

- June invoice = June 15 to June 30 only
- July onwards = full monthly cycle

---

3. PAYMENT + INVOICE FLOW

---

After subscription:

- Show remaining month invoice details
- Show payment pending status until payment completed

Invoice tab should support:

- Pending invoices
- Paid invoices
- Download invoice button for PAID invoices only

If customer changes subscription during the month:

- Invoice must dynamically recalculate
- Additional or reduced quantity should reflect properly
- Maintain invoice history correctly

---

4. DELIVERY STATUS FLOW

---

Delivery status will be updated ONLY by Admin.

Customer side:

- Delivery status shown as:
  - Delivered
  - Pending
  - Skipped

- Daily delivery updates happen by end of day from admin dashboard

---

5. ADD 500ML SUBSCRIPTION OPTION

---

Add 500ml milk subscription option along with existing plans.

All calculations must support:

- 500ml
- 1L
- Any existing plans

Invoice calculations should properly handle quantity and pricing.

---

6. PAYMENT STATUS VISIBILITY

---

Even if payment is not done:

- Customer should still see:
  - Current month milk delivery status
  - Invoice status
  - Pending amount

If payment completed:

- Enable invoice download for current month

---

7. MODIFY CURRENT MONTH SUBSCRIPTIONS

---

Allow customers to modify subscription during the current month.

Examples:

- Change quantity
- Pause dates
- Resume dates
- Change milk type/plan

Invoice system must:

- Recalculate dynamically
- Handle proration correctly
- Maintain payment balance correctly
- Avoid duplicate invoice entries

---

8. DASHBOARD FIXES

---

Dashboard should display ONLY CURRENT MONTH data.

Display:

- Total deliveries this month
- Delivered count this month
- Upcoming deliveries this month
- Skipped deliveries this month
- Current day delivery status

Do NOT include previous/future month data.

---

9. CORRECT MONTH DAYS CALCULATION

---

Current issue:
June is showing 31 days.

Fix:

- Use dynamic month/day calculation
- Respect leap years
- Use actual days of selected/current month

Example:

- June = 30
- February = 28/29

---

10. PAUSES LEFT ISSUE

---

Current dashboard shows:
"Pauses left this month: 7/7"

Verify:

- Why this value is displayed
- Whether pause limits are actually required

If pause restriction is not part of business logic:

- Remove this section completely

If required:

- Show accurate remaining pause count dynamically

---

11. PERFORMANCE OPTIMIZATION

---

Pages with noticeable loading delay:

- Home page
- Subscribe page
- Admin page

Optimize:

- Reduce unnecessary API calls
- Use lazy loading where needed
- Add proper loading skeletons
- Optimize database/API queries
- Prevent unnecessary component re-renders
- Cache reusable data where appropriate
- Parallelize independent API calls

Performance goal:
Pages should feel instant and responsive.

---

12. CUSTOMER CALENDAR DATA FIX

---

Current calendar data is incorrect.

Fix calculations for:

- Total deliveries in current month
- Delivered count
- Upcoming count
- Skipped count

All values must:

- Respect current month only
- Respect join date
- Respect pause/skipped dates
- Respect modified subscriptions

---

13. RESTRICT BACKDATED SUBSCRIPTIONS

---

Rules:

- Never allow selecting past dates
- Subscription start date cannot be before joining date
- Calendar should disable past dates
- Manual date entry for past dates should be blocked
- Validation required on both frontend and backend

---

14. SKIPPED COUNT ISSUE

---

Skipped count shown to customers is incorrect.

Fix:

- Calculate skipped count only for:
  - Active subscription days
  - Current month
  - Actual skipped dates

- Avoid counting future dates incorrectly

==================================================
ADMIN SIDE CHANGES
==================

1. DELIVERY STATUS MANAGEMENT

---

Admin must be able to:

- Update delivery status per customer
- OR mark all today's deliveries as delivered

Required statuses:

- Delivered
- Pending
- Skipped

Changes should immediately reflect on customer dashboard.

---

2. PAYMENT DUE DATES

---

Admin dashboard should display:

- Customer payment due dates
- Pending invoices
- Paid/unpaid status
- Outstanding amount

Add filters:

- Pending payments
- Paid customers
- Overdue customers

---

3. UPCOMING CALCULATIONS

---

Upcoming deliveries must be calculated ONLY for CURRENT MONTH.

Do not include:

- Next month deliveries
- Historical deliveries

---

4. ADMIN PAGE PERFORMANCE

---

Admin page is loading slowly.

Optimize:

- API response size
- Pagination
- Table rendering
- Dashboard calculations
- Database queries
- Use memoization where required
- Avoid full dashboard reloads after small actions

==================================================
IMPORTANT VALIDATION RULES
==========================

- Never allow subscription dates before joining date
- Never allow past-date subscriptions
- All invoice calculations must be dynamic
- All dashboard calculations must use current month only
- Handle timezone correctly
- Avoid duplicate invoice creation
- Maintain invoice/payment consistency after subscription edits

==================================================
EXPECTED OUTPUT
===============

Implement:

- Accurate current month calculations
- Dynamic invoices
- UPI payment support
- Delivery tracking
- Proper payment status handling
- Optimized dashboard performance
- Correct customer/admin analytics
- Proper date validations
- Subscription modification support

Ensure production-level stability and optimized UX/UI behavior.
