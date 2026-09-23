# Email System Integration - Task Checklist

## ✅ COMPLETED

### Email System Setup
- ✅ Resend email client (`nextjs/lib/resend.ts`)
- ✅ Email helper functions (`nextjs/lib/email-helpers.js`)
- ✅ Email API endpoint (`nextjs/app/api/email/send/route.js`)
- ✅ Email validators (`nextjs/lib/email-validators.ts`)

### API Route Updates
- ✅ User Registration - Sends welcome email (`/api/auth/register`)
- ✅ Deposit Creation - Sends confirmation email (`/api/deposits`)

### Documentation
- ✅ EMAIL_INTEGRATION_GUIDE.md

---

## ⏳ STILL TODO (7 items)

### 1. **Add Resend API Key to Environment** 
**Priority:** CRITICAL
**Files:** `nextjs/.env.local` and Vercel settings
```
RESEND_API_KEY=re_9NtcSBfe_HpmjDGfZDcedf1rizVpJW2Et
RESEND_FROM_EMAIL=noreply@podz.buzz
```
**Effort:** 5 minutes

---

### 2. **Email on Deposit Approval**
**Priority:** HIGH
**File:** Admin console (where deposits are approved)
**Add:** `sendDepositApprovedEmail()` call
**Code:**
```javascript
import { sendDepositApprovedEmail } from '@/lib/email-helpers';

// When admin approves deposit:
await sendDepositApprovedEmail(user.email, user.name, deposit.amount, deposit.id);
```
**Effort:** 15 minutes

---

### 3. **Email on Deposit Rejection**
**Priority:** HIGH
**File:** Admin console (where deposits are rejected)
**Add:** `sendDepositRejectedEmail()` call
**Code:**
```javascript
import { sendDepositRejectedEmail } from '@/lib/email-helpers';

// When admin rejects deposit:
await sendDepositRejectedEmail(user.email, user.name, deposit.amount, 'Reason here');
```
**Effort:** 15 minutes

---

### 4. **Email on Withdrawal Completion**
**Priority:** HIGH
**File:** Withdrawal processing route (`nextjs/app/api/withdrawals/...`)
**Add:** `sendWithdrawalProcessedEmail()` call
**Code:**
```javascript
import { sendWithdrawalProcessedEmail } from '@/lib/email-helpers';

// When withdrawal is processed:
await sendWithdrawalProcessedEmail(user.email, user.name, amount, txId, method);
```
**Effort:** 15 minutes

---

### 5. **2FA Code for Login**
**Priority:** MEDIUM
**File:** Login route (`nextjs/app/api/auth/login/route.js`)
**Add:** `send2FACodeEmail()` call
**Code:**
```javascript
import { send2FACodeEmail } from '@/lib/email-helpers';

// Generate 6-digit code
const code = Math.random().toString().slice(2, 8);

// Send to user email
await send2FACodeEmail(user.email, code, 'login');

// Store code in session (check/verify later)
```
**Effort:** 30 minutes

---

### 6. **Email on Mining/Investment Payout**
**Priority:** MEDIUM
**File:** Payout processing route (mining/investment modules)
**Add:** `sendPayoutNotificationEmail()` call
**Code:**
```javascript
import { sendPayoutNotificationEmail } from '@/lib/email-helpers';

// When payout is sent:
await sendPayoutNotificationEmail(user.email, user.name, payout.amount, 'mining', txId);
// or
await sendPayoutNotificationEmail(user.email, user.name, payout.amount, 'investment', txId);
```
**Effort:** 20 minutes

---

### 7. **Password Reset Email (if needed)**
**Priority:** LOW
**File:** Password reset route (if exists)
**Add:** `sendPasswordResetEmail()` call
**Code:**
```javascript
import { sendPasswordResetEmail } from '@/lib/email-helpers';

// When user requests password reset:
await sendPasswordResetEmail(user.email, resetLink);
```
**Effort:** 15 minutes

---

## Summary

**Total Time to Complete:** ~2 hours
**Effort Level:** Easy (mostly copy-paste)
**Risk Level:** Low (all emails are non-blocking - won't fail the operation)

---

## How to Complete

1. **Add env vars first** (5 min)
2. **Find each route** that needs email
3. **Import the helper** at the top
4. **Call the function** at the right place
5. **Test** each flow

---

## Testing Checklist

- [ ] Test signup → welcome email received
- [ ] Test deposit → confirmation email received
- [ ] Test admin approve deposit → approval email received
- [ ] Test admin reject deposit → rejection email received
- [ ] Test withdrawal → completion email received
- [ ] Test mining payout → notification received
- [ ] Test investment payout → notification received
- [ ] Test login 2FA → code email received

---

## Deployment

1. Add `RESEND_API_KEY` to Vercel environment variables
2. Add `RESEND_FROM_EMAIL` to Vercel environment variables
3. Deploy to production
4. Test all email flows on production

---

**Ready to go! Follow the checklist above and you'll have full email integration in ~2 hours!**
