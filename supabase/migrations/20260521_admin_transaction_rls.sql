-- Migration: Add Admin Insert Policy to Transactions table
-- This allows admins to successfully log audited manual balance adjustments 

CREATE POLICY "Admins can insert transactions for any user"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true
    )
  );
