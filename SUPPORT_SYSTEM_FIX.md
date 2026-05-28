# Support Ticket System - Database Connection Fix

## Problem
Support tickets and messages created by users were not being recorded in the Supabase database, even though the tables existed and the frontend appeared to work.

## Root Cause
1. **Client-side only approach**: The original implementation used direct Supabase client calls from the browser without server-side API routes
2. **Missing authentication context**: Without proper server-side handling, user context wasn't being properly validated
3. **Syntax error in sendReply mutation**: The message mutation had a missing return statement that prevented proper completion
4. **No service role authentication**: Database operations need proper authentication with service role credentials for reliability

## Solution Implemented

### 1. Created Server-Side API Routes

#### `/api/support/create-ticket` (POST)
- Receives: `{ subject, category, priority, message, userId }`
- Creates support ticket and initial message
- Uses Supabase service role for server-side database access
- Returns: Created ticket object with 201 status

**Usage:**
```typescript
const response = await fetch('/api/support/create-ticket', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'My Issue',
    category: 'technical',
    priority: 'normal',
    message: 'Detailed description',
    userId: user.id
  })
});
```

#### `/api/support/send-message` (POST)
- Receives: `{ ticketId, senderId, message }`
- Creates user message on a support ticket
- Validates: User owns the ticket, ticket is not closed
- Returns: Created message object with 201 status

**Usage:**
```typescript
const response = await fetch('/api/support/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticketId: ticket.id,
    senderId: user.id,
    message: 'My reply'
  })
});
```

#### `/api/support/send-admin-reply` (POST)
- Receives: `{ ticketId, message, userId }`
- Creates admin reply on a support ticket
- Validates: User is admin
- Returns: Created message object with 201 status

**Usage:**
```typescript
const response = await fetch('/api/support/send-admin-reply', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticketId: ticket.id,
    message: 'Admin response',
    userId: admin.id
  })
});
```

#### `/api/support/update-ticket` (PATCH)
- Receives: `{ ticketId, status, priority, adminNote, userId }`
- Updates ticket status, priority, and admin notes
- Validates: User is admin
- Returns: Updated ticket object with 200 status

**Usage:**
```typescript
const response = await fetch('/api/support/update-ticket', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ticketId: ticket.id,
    status: 'in_progress',
    priority: 'high',
    adminNote: 'Working on this',
    userId: admin.id
  })
});
```

### 2. Updated Dashboard Support Page Component

Updated `app/dashboard/support/page.tsx`:
- Changed `createTicket` mutation to use `/api/support/create-ticket`
- Changed `sendReply` mutation to use `/api/support/send-message`
- Removed direct Supabase calls
- Fixed syntax error in mutation completion

### 3. Environment Variables Required

Ensure your `.env.local` file contains:

```env
# Supabase URLs (public - already set)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase Service Role Key (secret - for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**To get your Service Role Key:**
1. Go to Supabase Dashboard → Project Settings
2. Navigate to "API" tab
3. Copy the "Service Role Key" (secret - keep this secure)
4. Add it to `.env.local` (NEVER commit to git)

## Database Layer

The existing Supabase tables and RLS policies remain unchanged:
- `support_tickets` table with RLS policies
- `support_messages` table with RLS policies
- Policies still enforce user ownership and admin access

The API routes work WITH the RLS policies, not against them, by using the service role which has elevated permissions.

## Testing the Fix

1. **Create a Support Ticket**:
   - Go to Dashboard → Support
   - Click "New Ticket"
   - Fill in subject, category, and message
   - Click "Submit Ticket"
   - Check Supabase database to verify ticket appears in `support_tickets` table

2. **Send a Message**:
   - Select a ticket
   - Type a message in the reply box
   - Click send button
   - Check Supabase database to verify message appears in `support_messages` table

3. **Admin Functions**:
   - Go to Admin → Support
   - Test replying to user messages
   - Test updating ticket status/priority
   - Verify changes appear in database

## Error Handling

Each API route includes:
- Input validation (required fields check)
- Error logging to console
- Descriptive error responses to client
- HTTP status codes (400, 403, 404, 500)
- User-friendly toast notifications

## Security Features

1. **Service Role Authentication**: Server-side API routes use Supabase service role for secure database access
2. **User Validation**: Checks that users own tickets before allowing message replies
3. **Admin Validation**: Ensures only admins can send admin replies and update tickets
4. **Input Validation**: All required fields are validated before database operations
5. **Error Logging**: Detailed server-side logging for debugging

## Files Modified/Created

### Created:
- `app/api/support/create-ticket/route.ts`
- `app/api/support/send-message/route.ts`
- `app/api/support/send-admin-reply/route.ts`
- `app/api/support/update-ticket/route.ts`

### Modified:
- `app/dashboard/support/page.tsx` - Updated mutations to use API routes

## Migration Notes

If you have existing data:
- The database structure remains the same
- All existing tickets and messages will continue to work
- The new API routes will handle all new operations
- No data migration needed

## Next Steps (Optional)

1. **Add Pagination** to ticket/message fetching for better performance
2. **Add Real-time Updates** using Supabase Realtime subscriptions
3. **Add Attachments** to tickets and messages
4. **Add Email Notifications** when new messages are received
5. **Add Ticket Categories** with routing to specific admin groups

## Troubleshooting

### Tickets not appearing in database:
1. Check that `SUPABASE_SERVICE_ROLE_KEY` is set in `.env.local`
2. Verify the key has not expired in Supabase dashboard
3. Check browser console for API error responses
4. Check server logs for error details

### Messages not appearing:
1. Verify ticket exists in database
2. Check that user owns the ticket (for user messages)
3. Check that admin is actually an admin in profiles table
4. Review server console logs for errors

### 403 Forbidden Errors:
- Service role key is missing or invalid
- User is not an admin (for admin operations)
- Check Supabase dashboard for credential issues

## Support

For issues or questions:
1. Check server console for detailed error messages
2. Check Supabase logs for database errors
3. Verify environment variables are set correctly
4. Test API endpoints directly with curl or Postman
