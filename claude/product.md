# MVP Corrections & Improvements Prompt

Update the existing milk subscription website with the following MVP-focused corrections and improvements.

Keep all changes:

- Production-ready
- Simple and scalable
- Mobile-friendly
- Customer-focused
- Minimal without over-engineering

Do NOT redesign the entire application.  
Only improve existing flows, UI, and business logic where required.

---

## 1. Registration Flow

Add mandatory fields:

- Flat / Apartment Name
- Flat Number
- Flat Location / Address

Requirements:

- Keep registration simple and fast
- Mobile-first UI
- Proper validation
- Clean form layout

---

## 2. Branding

Use:
`assets/dheera-brand.jpeg`

Apply branding consistently across:

- Login screen
- Header/navbar
- Home screen
- Subscription section
- Invoice section (if applicable)

Theme should feel:

- Organic
- Premium
- Fresh dairy focused

---

## 3. Home Screen Improvements

Add a small informational section:

### “Why Organic Cow Milk?”

Include concise benefits:

- Rich in calcium
- High protein
- Better digestion
- No preservatives
- Naturally sourced

Also add simple nutritional information cards.

Keep UI minimal and clean.

---

## 4. Subscription Flow Changes

Make:

### “Monthly Subscription”

the primary CTA after login.

Remove completely:

- Alternate Days option

Provide only these quantity options:

- 500ml
- 1 litre
- 1.5 litre
- 2 litre
- More than 2 litre

If “More than 2 litre” is selected:

- Show custom quantity input
- Validate minimum quantity

Use clean selectable cards or radio buttons.

---

## 5. Invoice Rules

Generate invoices ONLY for:

- Monthly subscribed users

Do NOT show invoices for:

- Trial users
- Non-subscribed users
- One-time/manual orders

Keep invoice module scalable for future payment integration.

---

## 6. Custom Dates Logic (MVP)

Keep custom scheduling very simple.

Allow only:

- Subscription start date
- Pause delivery dates (optional)

Limitations:

- Maximum 7 pause days per month
- Pause request allowed only before previous day 8 PM
- No alternate-day scheduling
- No recurring complex schedules
- No daily quantity customization

---

## 7. UX Expectations

Ensure:

- Fast loading
- Minimal clicks
- Clean mobile UI
- Proper spacing and typography
- Simple subscription flow
- Clear validation messages
- Error handling
- Empty states
- Loading states

---

## 8. Technical Expectations

Follow standard production practices:

- Clean code structure
- Reusable components
- Proper API validation
- Secure authentication flow
- Scalable database handling
- Responsive UI
- No breaking changes to existing functionality

---

## 9. Important

Focus on:

- MVP launch readiness
- Simplicity
- Reliability
- Maintainability
- Real customer usability

Avoid:

- Over-complicated workflows
- Unnecessary animations
- Complex scheduling systems
- Heavy redesigns
