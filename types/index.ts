export type Profile = {
  id: string;
  username: string | null;
  full_name: string;
  avatar_url: string;
  balance: number;
  total_deposited: number;
  total_withdrawn: number;
  total_profit: number;
  referral_code: string | null;
  referred_by: string | null;
  referral_earnings: number;
  is_admin: boolean;
  kyc_status: 'pending' | 'verified' | 'rejected';
  phone: string;
  country: string;
  created_at: string;
  updated_at: string;
};

export type InvestmentPlan = {
  id: string;
  name: string;
  description: string;
  min_amount: number;
  max_amount: number | null;
  daily_roi_percent: number;
  duration_days: number;
  total_roi_percent: number;
  referral_bonus_percent: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
};

export type Investment = {
  id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  daily_roi_percent: number;
  duration_days: number;
  total_profit_expected: number;
  total_profit_earned: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  started_at: string | null;
  expires_at: string | null;
  last_credited_at: string | null;
  created_at: string;
  plan?: InvestmentPlan;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'profit' | 'referral_bonus' | 'investment';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  reference: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type BankDetails = {
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number?: string;
  swift_code?: string;
  iban?: string;
};

export type WithdrawalRequest = {
  id: string;
  user_id: string;
  amount: number;
  wallet_address: string; // Used for both crypto address and JSON-stringified bank details
  network: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  admin_note: string;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
};

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  link: string;
  created_at: string;
};

export type DepositAddress = {
  id: string;
  network: string;
  address: string;
  label: string;
  is_active: boolean;
  created_at: string;
};

export type CryptoPrice = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
};

export type KYCSubmission = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  dob?: string;
  gender?: string;
  country: string;
  city?: string;
  zip?: string;
  address?: string;
  id_type: string;
  id_number: string;
  issue_date?: string;
  expiry_date?: string;
  document_url?: string;
  status: 'pending' | 'verified' | 'rejected';
  admin_note?: string;
  created_at: string;
  updated_at: string;
};
