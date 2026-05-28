import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { type, user_email, user_name, amount, currency, status, tx_id } = await req.json();

    if (!RESEND_API_KEY) {
      throw new Error("Missing RESEND_API_KEY environment variable");
    }

    let subject = "";
    let html = "";

    // Email Templates
    switch (type) {
      case "email_verified":
        subject = "Email Verified Successfully - Goldcrest Brokers";
        html = `
          <h1>Welcome to Goldcrest Brokers!</h1>
          <p>Hi ${user_name || 'Trader'},</p>
          <p>Your email has been successfully verified. You now have full access to all trading features including Invest, Spot Trading, and Copy Trading.</p>
          <p>Start trading today!</p>
          <hr/>
          <p><small>Goldcrest Brokers Team</small></p>
        `;
        break;

      case "deposit_initiated":
        subject = `Deposit Initiated: ${amount} ${currency}`;
        html = `
          <h1>Deposit Received</h1>
          <p>Hi ${user_name || 'Trader'},</p>
          <p>We have received your deposit request.</p>
          <ul>
            <li><strong>Amount:</strong> ${amount} ${currency}</li>
            <li><strong>Status:</strong> ${status || 'Pending'}</li>
            <li><strong>Transaction ID:</strong> ${tx_id || 'N/A'}</li>
          </ul>
          <p>We will confirm your funds shortly.</p>
          <hr/>
          <p><small>Goldcrest Brokers Team</small></p>
        `;
        break;

      case "withdrawal_initiated":
        subject = `Withdrawal Request: ${amount} ${currency}`;
        html = `
          <h1>Withdrawal Request Received</h1>
          <p>Hi ${user_name || 'Trader'},</p>
          <p>Your withdrawal request is being processed.</p>
          <ul>
            <li><strong>Amount:</strong> ${amount} ${currency}</li>
            <li><strong>Status:</strong> ${status || 'Processing'}</li>
            <li><strong>Transaction ID:</strong> ${tx_id || 'N/A'}</li>
          </ul>
          <p>You will be notified once funds are sent.</p>
          <hr/>
          <p><small>Goldcrest Brokers Team</small></p>
        `;
        break;

      case "investment_created":
        subject = `Investment Active: ${amount} ${currency}`;
        html = `
          <h1>Investment Successfully Created</h1>
          <p>Hi ${user_name || 'Trader'},</p>
          <p>Your investment plan is now active.</p>
          <ul>
            <li><strong>Amount:</strong> ${amount} ${currency}</li>
            <li><strong>Status:</strong> Active</li>
            <li><strong>Transaction ID:</strong> ${tx_id || 'N/A'}</li>
          </ul>
          <p>Watch your profits grow!</p>
          <hr/>
          <p><small>Goldcrest Brokers Team</small></p>
        `;
        break;

      default:
        throw new Error("Invalid email type");
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Goldcrest Brokers <onboarding@resend.dev>", // Update to your custom domain if verified
        to: [user_email],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
