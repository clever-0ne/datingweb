# Email Integration Guide - NextJS App

## What's Been Added

✅ **Email System Integrated into nextjs/ folder**

### Files Added:
1. `nextjs/lib/resend.ts` - Resend client setup
2. `nextjs/lib/send-email.ts` - Email sending functions
3. `nextjs/lib/email-validators.ts` - Email validation utilities
4. `nextjs/lib/email-helpers.js` - Helper functions for common emails
5. `nextjs/app/api/email/send/route.js` - Email API endpoint

### Email Functions Available:
```javascript
import { 
  sendWelcomeEmail,
  sendDepositApprovedEmail,
  sendDepositRejectedEmail,
  sendWithdrawalProcessedEmail,
  send2FACodeEmail,
  sendPasswordResetEmail,
  sendPayoutNotificationEmail
} from '@/lib/email-helpers';
```

---

## What's Already Updated

✅ **Deposit Creation** (`/api/deposits`)
- User gets confirmation email when deposit submitted
- Admin gets push notification

---

## What Still Needs Email Integration

### 1. User Signup/Registration
**File:** `nextjs/app/api/auth/register/route.js`
**Add:** Send welcome email after user registration

```javascript
import { sendWelcomeEmail } from '@/lib/email-helpers';

// After user is created:
await sendWelcomeEmail(user.email, user.name);
```

### 2. Admin Deposit Approval
**File:** `nextjs/app/api/admin/deposits/route.js` (or admin console)
**Add:** Send approval email to user

```javascript
import { sendDepositApprovedEmail } from '@/lib/email-helpers';

// When admin approves:
await sendDepositApprovedEmail(user.email, user.name, deposit.amount, deposit.id);
```

### 3. Admin Deposit Rejection
**File:** Admin console deposit rejection
**Add:** Send rejection email

```javascript
import { sendDepositRejectedEmail } from '@/lib/email-helpers';

// When admin rejects:
await sendDepositRejectedEmail(user.email, user.name, deposit.amount, 'Invalid deposit address');
```

### 4. Withdrawal Approval
**File:** `nextjs/app/api/admin/withdrawals/route.js`
**Add:** Send completion email

```javascript
import { sendWithdrawalProcessedEmail } from '@/lib/email-helpers';

// When withdrawal is processed:
await sendWithdrawalProcessedEmail(user.email, user.name, withdrawal.amount, withdrawal.id, method);
```

### 5. 2FA for Login
**File:** `nextjs/app/api/auth/[auth0].js` or login route
**Add:** Send 2FA code before login

```javascript
import { send2FACodeEmail } from '@/lib/email-helpers';

// Before allowing login:
await send2FACodeEmail(user.email, '123456', 'login');
```

### 6. Mining/Investment Payouts
**File:** Mining/Investment payout processing
**Add:** Send payout notification

```javascript
import { sendPayoutNotificationEmail } from '@/lib/email-helpers';

// When payout is sent:
await sendPayoutNotificationEmail(user.email, user.name, payout.amount, 'mining', payout.id);
```

### 7. Password Reset
**File:** `nextjs/app/api/auth/password-reset/route.js` (if exists)
**Add:** Send reset link

```javascript
import { sendPasswordResetEmail } from '@/lib/email-helpers';

// When user requests password reset:
await sendPasswordResetEmail(user.email, resetLink);
```

---

## Quick Integration Checklist

- [ ] Add `RESEND_API_KEY` to `.env.local`
- [ ] Add `RESEND_FROM_EMAIL` to `.env.local`
- [ ] Update auth signup route to send welcome email
- [ ] Update admin deposit approval to send approval email
- [ ] Update admin deposit rejection to send rejection email
- [ ] Update withdrawal process to send completion email
- [ ] Add 2FA code to login flow
- [ ] Add payout emails to mining/investment modules
- [ ] Test all email flows
- [ ] Add to Vercel env vars before deploying

---

## Environment Variables Needed

Add to `nextjs/.env.local`:
```
RESEND_API_KEY=re_9NtcSBfe_HpmjDGfZDcedf1rizVpJW2Et
RESEND_FROM_EMAIL=noreply@podz.buzz
NEXT_PUBLIC_APP_URL=https://xteamx-snowy.vercel.app
```

---

## Testing Email

### Test from Node.js:
```javascript
import { sendWelcomeEmail } from '@/lib/email-helpers';

const result = await sendWelcomeEmail('test@example.com', 'Test User');
console.log(result);
```

### Test from API:
```bash
curl -X POST http://localhost:3000/api/email/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Email",
    "html": "<h1>Test</h1>"
  }'
```

---

## Email Templates

All templates are in `nextjs/lib/email-helpers.js`:

1. **Welcome Email** - Sent on signup
2. **Deposit Confirmation** - Sent when deposit submitted
3. **Deposit Approved** - Sent when admin approves
4. **Deposit Rejected** - Sent when admin rejects
5. **Withdrawal Processed** - Sent when withdrawal completes
6. **2FA Code** - Sent for login/mining/investment
7. **Password Reset** - Sent for password recovery
8. **Payout Notification** - Sent for mining/investment payouts

All templates can be customized in `email-helpers.js`

---

## Next Steps

1. ✅ Email system is ready
2. ⏳ Find each route that needs email
3. ⏳ Import the helper function
4. ⏳ Call the function at the right place
5. ⏳ Test all email flows
6. ⏳ Deploy to Vercel

---

## Support

All email functions are in `nextjs/lib/email-helpers.js` - modify templates there!
