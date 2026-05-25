# Email Verification System Setup Guide

## Overview
This guide explains the email verification system implementation for your website, including:
1. Database schema changes
2. User email verification flow
3. Admin email messaging system
4. Integration points for protected features

## 1. Database Migration

Run this SQL migration in your Supabase SQL Editor:

```sql
-- File: supabase/migrations/20260525_email_verification_system.sql
```

This migration:
- Adds `email_verified` (boolean) and `email_verification_sent_at` (timestamp) columns to profiles
- Creates `admin_emails` table for tracking admin-sent emails
- Sets up Row Level Security policies
- Creates helper functions for email verification

## 2. Files Created/Modified

### New Components:
- `/components/sections/EmailVerificationBanner.tsx` - Banner component showing verification prompt
- `/components/sections/EmailVerificationGuard.tsx` - Guard component for protecting features
- `/app/admin/emails/page.tsx` - Admin page for sending emails to users

### Modified Files:
- `/types/index.ts` - Added `email_verified` and `email_verification_sent_at` to Profile type, added AdminEmail type
- `/supabase/migrations/20260525_email_verification_system.sql` - Database migration

## 3. How It Works

### User Flow:
1. User creates account (email verification is NOT required during signup)
2. User can browse dashboard but sees verification banner
3. When user tries to deposit, invest, trade, or withdraw:
   - If email not verified → shows verification modal/guard
   - If email verified → allows access to feature
4. User clicks "Resend Verification Email" button
5. Supabase sends verification email using built-in auth system
6. User clicks link in email → email gets marked as verified
7. User now has full access to all features

### Admin Flow:
1. Admin goes to `/admin/emails`
2. Selects a user from searchable dropdown
3. Composes subject and message
4. Clicks "Send Email"
5. Email is recorded in database (integration with email service needed for actual delivery)
6. Admin can view history of sent emails

## 4. Protecting Features

To protect any feature with email verification, wrap it with the guard component:

```tsx
import { EmailVerificationGuard } from '@/components/sections/EmailVerificationGuard';
import { useAuth } from '@/context/AuthContext';

export default function DepositPage() {
  const { profile } = useAuth();

  return (
    <EmailVerificationGuard profile={profile} featureName="make deposits">
      {/* Your existing deposit form/content */}
    </EmailVerificationGuard>
  );
}
```

Or use the hook for programmatic checks:

```tsx
import { useState } from 'react';
import { EmailVerificationModal } from '@/components/sections/EmailVerificationBanner';
import { useAuth } from '@/context/AuthContext';

export default function WithdrawPage() {
  const { profile } = useAuth();
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const handleWithdraw = () => {
    if (!profile?.email_verified) {
      setShowVerifyModal(true);
      return;
    }
    // Proceed with withdrawal
  };

  return (
    <>
      {/* Your content */}
      <EmailVerificationModal 
        isOpen={showVerifyModal} 
        onClose={() => setShowVerifyModal(false)} 
      />
    </>
  );
}
```

## 5. Adding Verification Banner to Dashboard

Add the banner to your dashboard layout or main page:

```tsx
import { EmailVerificationBanner } from '@/components/sections/EmailVerificationBanner';

export default function DashboardPage() {
  return (
    <div>
      <EmailVerificationBanner />
      {/* Rest of your dashboard */}
    </div>
  );
}
```

## 6. Email Service Integration (Optional)

Currently, emails are only recorded in the database. To actually send emails:

### Option A: Use Supabase Built-in Email
Configure Supabase Auth email settings in your Supabase dashboard:
1. Go to Authentication → Email Templates
2. Configure SMTP settings
3. Customize verification email template

### Option B: Integrate External Service
For admin emails, integrate with services like:
- **SendGrid**: Popular, generous free tier
- **Resend**: Developer-friendly, modern API
- **AWS SES**: Cost-effective at scale
- **Postmark**: Reliable transactional emails

Example integration point in `/app/admin/emails/page.tsx`:

```typescript
const sendEmailMutation = useMutation({
  mutationFn: async () => {
    // ... existing code ...
    
    // Add external email service call here
    await fetch('/api/send-email', {
      method: 'POST',
      body: JSON.stringify({
        to: selectedUser.email,
        subject,
        message,
      }),
    });
    
    return true;
  },
  // ... rest of mutation
});
```

## 7. Testing

1. Create a new test account
2. Verify the verification banner appears on dashboard
3. Try to access deposit page → should show verification requirement
4. Click resend verification email
5. Check email inbox for verification link
6. Click link → should verify email
7. Try deposit again → should now work
8. As admin, go to `/admin/emails` and test sending email

## 8. Important Notes

- The system uses Supabase's built-in email verification (no custom tokens needed)
- Email verification status is stored in the `profiles` table
- Admin emails are logged in `admin_emails` table for audit trail
- RLS policies ensure users can only see their own data
- All components are TypeScript-safe with proper types defined

## Next Steps

1. Run the database migration in Supabase
2. Add the verification banner to your dashboard layout
3. Wrap sensitive features (deposit, withdraw, invest, trade) with the guard
4. Configure Supabase email settings or integrate external email service
5. Test the complete flow end-to-end
