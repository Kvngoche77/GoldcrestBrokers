import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      investment_plans: {
        Row: {
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
      };
      investments: {
        Row: {
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
        };
      };
      transactions: {
        Row: {
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
        Insert: Partial<Database['public']['Tables']['transactions']['Row']> & {
          user_id: string;
          type: string;
          amount: number;
        };
      };
      withdrawal_requests: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          wallet_address: string;
          network: string;
          status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
          admin_note: string;
          processed_by: string | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          amount: number;
          wallet_address: string;
          network?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: 'info' | 'success' | 'warning' | 'error';
          is_read: boolean;
          link: string;
          created_at: string;
        };
      };
      deposit_addresses: {
        Row: {
          id: string;
          network: string;
          address: string;
          label: string;
          is_active: boolean;
          created_at: string;
        };
      };
    };
  };
};
