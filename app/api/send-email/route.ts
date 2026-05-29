import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { type, user_id, user_email, user_name, amount, currency, status, tx_id, origin } = await req.json();

    const resendApiKey = process.env.RESEND_API_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!resendApiKey) {
      return NextResponse.json({ error: 'Missing RESEND_API_KEY environment variable' }, { status: 500 });
    }

    let finalEmail = user_email;
    let finalName = user_name;

    // Fetch user details from Supabase if we have user_id and are missing details
    if (user_id && (!finalEmail || !finalName)) {
      if (supabaseUrl && supabaseServiceKey) {
        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
        
        // Fetch user auth details (email)
        const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(user_id);
        if (!authErr && authData?.user) {
          finalEmail = finalEmail || authData.user.email;
        }

        // Fetch user profile details (full_name / username)
        const { data: profileData, error: profileErr } = await supabaseAdmin
          .from('profiles')
          .select('full_name, username')
          .eq('id', user_id)
          .maybeSingle();
        if (!profileErr && profileData) {
          finalName = finalName || profileData.full_name || profileData.username;
        }
      }
    }

    if (!finalEmail) {
      return NextResponse.json({ error: 'Recipient email address is required' }, { status: 400 });
    }

    let subject = '';
    let html = '';

    // Email Templates
    switch (type) {
      case 'send_verification': {
        let verificationLink = '';
        if (supabaseUrl && supabaseServiceKey) {
          const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
          const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: finalEmail,
            options: { redirectTo: `${origin || 'http://localhost:3000'}/auth/callback` }
          });
          
          if (linkErr) {
            console.error('Error generating verification link:', linkErr);
            throw linkErr;
          }
          
          verificationLink = linkData?.properties?.action_link || '';
        }

        subject = 'Verify Your Email - Goldcrest Brokers';
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #0f172a; margin-bottom: 16px;">Verify Your Email Address</h1>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi ${finalName || 'Trader'},</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Thank you for signing up with Goldcrest Brokers! Please click the button below to verify your email address and unlock all premium trading features.</p>
            <p style="margin: 30px 0; text-align: center;">
              <a href="${verificationLink}" style="background-color: #f59e0b; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.2);">Verify Email Address</a>
            </p>
            <p style="color: #64748b; font-size: 14px;">If the button doesn't work, copy and paste the link below into your browser:</p>
            <p style="word-break: break-all; font-size: 14px;"><a href="${verificationLink}" style="color: #3b82f6;">${verificationLink}</a></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Goldcrest Brokers Team</p>
          </div>
        `;
        break;
      }

      case 'email_verified':
        subject = 'Email Verified Successfully - Goldcrest Brokers';
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #10b981; margin-bottom: 16px;">Welcome to Goldcrest Brokers!</h1>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi ${finalName || 'Trader'},</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Your email has been successfully verified. You now have full access to all premium trading features including Invest, Spot Trading, and Copy Trading.</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Get started by visiting your dashboard and funding your account.</p>
            <p style="margin: 30px 0; text-align: center;">
              <a href="${origin || 'http://localhost:3000'}/dashboard" style="background-color: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">Go to Dashboard</a>
            </p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Goldcrest Brokers Team</p>
          </div>
        `;
        break;

      case 'deposit_initiated':
        subject = `Deposit Initiated: ${amount} ${currency}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #0f172a; margin-bottom: 16px;">Deposit Received</h1>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi ${finalName || 'Trader'},</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">We have received your deposit request. Our finance team is currently reviewing your transaction details.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a;">Transaction Details</h3>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Amount:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${amount} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Status:</td>
                  <td style="padding: 6px 0; color: #f59e0b; font-weight: 600; text-align: right;">${status || 'Pending'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Transaction ID:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-family: monospace; text-align: right;">${tx_id || 'N/A'}</td>
                </tr>
              </table>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">We will credit your account balance as soon as the funds are confirmed.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Goldcrest Brokers Team</p>
          </div>
        `;
        break;

      case 'withdrawal_initiated':
        subject = `Withdrawal Request: ${amount} ${currency}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #0f172a; margin-bottom: 16px;">Withdrawal Request Received</h1>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi ${finalName || 'Trader'},</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Your withdrawal request is being processed by our team.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a;">Transaction Details</h3>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Amount:</td>
                  <td style="padding: 6px 0; color: #0f172a; font-weight: 600; text-align: right;">${amount} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Status:</td>
                  <td style="padding: 6px 0; color: #3b82f6; font-weight: 600; text-align: right;">${status || 'Processing'}</td>
                </tr>
              </table>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">You will receive another email with details once the funds have been successfully disbursed.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Goldcrest Brokers Team</p>
          </div>
        `;
        break;

      case 'withdrawal_approved':
        subject = `Withdrawal Approved & Processed: ${amount} ${currency}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #10b981; margin-bottom: 16px;">Withdrawal Successful</h1>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi ${finalName || 'Trader'},</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Great news! Your withdrawal request has been approved and successfully processed.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a;">Transaction Details</h3>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Amount:</td>
                  <td style="padding: 6px 0; color: #10b981; font-weight: 600; text-align: right;">${amount} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Status:</td>
                  <td style="padding: 6px 0; color: #10b981; font-weight: 600; text-align: right;">Completed</td>
                </tr>
              </table>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">The funds should arrive in your destination wallet or bank account shortly depending on block confirmation or banking processing times.</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Thank you for investing with us!</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Goldcrest Brokers Team</p>
          </div>
        `;
        break;

      case 'investment_created':
        subject = `Investment Active: ${amount} ${currency}`;
        html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h1 style="color: #3b82f6; margin-bottom: 16px;">Investment Activated</h1>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hi ${finalName || 'Trader'},</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Your new investment plan is now active! Profits will start accumulating automatically based on the plan's guidelines.</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
              <h3 style="margin-top: 0; margin-bottom: 12px; color: #0f172a;">Investment Details</h3>
              <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Amount:</td>
                  <td style="padding: 6px 0; color: #3b82f6; font-weight: 600; text-align: right;">${amount} ${currency}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Status:</td>
                  <td style="padding: 6px 0; color: #10b981; font-weight: 600; text-align: right;">Active</td>
                </tr>
              </table>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">You can track its real-time growth on your active investments dashboard page.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;"/>
            <p style="color: #64748b; font-size: 14px; margin-bottom: 0;">Goldcrest Brokers Team</p>
          </div>
        `;
        break;

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Goldcrest Brokers <team@goldcrestbroker.com>', // Updated to verified domain
        to: [finalEmail],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (data.error) {
      throw new Error(data.error.message || 'Resend error occurred');
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error: any) {
    console.error('Email API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
