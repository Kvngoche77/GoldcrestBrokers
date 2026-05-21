-- Migration: Add Transaction/Withdrawal PIN and Internal Transfer RPC Function
-- Adding the withdrawal_pin column to the profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS withdrawal_pin text DEFAULT NULL;

-- Create secure database RPC function to perform atomic transfers bypassing RLS limitations
CREATE OR REPLACE FUNCTION public.transfer_funds(
  sender_id uuid,
  recipient_identifier text,
  amount numeric(20,8),
  pin text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  recipient_id uuid;
  sender_pin text;
  sender_bal numeric(20,8);
  actual_recipient_username text;
  sender_username text;
BEGIN
  -- 1. Validate inputs
  IF amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transfer amount must be greater than zero.');
  END IF;

  -- 2. Get sender PIN, balance, and username
  SELECT withdrawal_pin, balance, username INTO sender_pin, sender_bal, sender_username
  FROM public.profiles
  WHERE id = sender_id;

  -- 3. Verify PIN is set
  IF sender_pin IS NULL OR sender_pin = '' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Transaction PIN is not set. Please set a transfer PIN in Settings.');
  END IF;

  -- 4. Verify entered PIN matches stored PIN
  IF sender_pin != pin THEN
    RETURN jsonb_build_object('success', false, 'message', 'Incorrect transaction PIN.');
  END IF;

  -- 5. Verify sufficient balance
  IF sender_bal < amount THEN
    RETURN jsonb_build_object('success', false, 'message', 'Insufficient balance for this transfer.');
  END IF;

  -- 6. Find recipient by username first, then by email (using auth.users)
  SELECT id, username INTO recipient_id, actual_recipient_username
  FROM public.profiles
  WHERE LOWER(username) = LOWER(recipient_identifier) 
     OR LOWER(username) = LOWER(split_part(recipient_identifier, '@', 1));

  IF recipient_id IS NULL THEN
    -- Try checking auth.users by email
    SELECT u.id, p.username INTO recipient_id, actual_recipient_username
    FROM auth.users u
    JOIN public.profiles p ON p.id = u.id
    WHERE LOWER(u.email) = LOWER(recipient_identifier);
  END IF;

  -- Verify recipient exists
  IF recipient_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'Recipient user not found.');
  END IF;

  -- Verify sender is not transferring to themselves
  IF recipient_id = sender_id THEN
    RETURN jsonb_build_object('success', false, 'message', 'You cannot transfer funds to yourself.');
  END IF;

  -- 7. Perform the transfer (atomic transaction block)
  -- Deduct from sender
  UPDATE public.profiles
  SET balance = balance - amount,
      total_withdrawn = total_withdrawn + amount,
      updated_at = now()
  WHERE id = sender_id;

  -- Add to recipient
  UPDATE public.profiles
  SET balance = balance + amount,
      total_deposited = total_deposited + amount,
      updated_at = now()
  WHERE id = recipient_id;

  -- 8. Insert transaction records (compatible with CHECK constraints)
  -- Transaction for sender (Debit)
  INSERT INTO public.transactions (user_id, type, amount, status, description, metadata)
  VALUES (
    sender_id,
    'withdrawal',
    amount,
    'completed',
    'Transfer sent to @' || actual_recipient_username,
    jsonb_build_object(
      'transfer_recipient_id', recipient_id, 
      'transfer_recipient_username', actual_recipient_username, 
      'is_transfer', true,
      'transfer_direction', 'out'
    )
  );

  -- Transaction for recipient (Credit)
  INSERT INTO public.transactions (user_id, type, amount, status, description, metadata)
  VALUES (
    recipient_id,
    'deposit',
    amount,
    'completed',
    'Transfer received from @' || sender_username,
    jsonb_build_object(
      'transfer_sender_id', sender_id, 
      'transfer_sender_username', sender_username, 
      'is_transfer', true,
      'transfer_direction', 'in'
    )
  );

  -- 9. Insert notifications
  -- Notification for sender
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    sender_id,
    'Transfer Sent',
    'You have successfully transferred $' || TO_CHAR(amount, 'FM999,999,999.00') || ' to @' || actual_recipient_username || '.',
    'success'
  );

  -- Notification for recipient
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    recipient_id,
    'Transfer Received',
    'You received $' || TO_CHAR(amount, 'FM999,999,999.00') || ' from @' || sender_username || '.',
    'success'
  );

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Transfer completed successfully!', 
    'recipient_username', actual_recipient_username
  );
END;
$$;
