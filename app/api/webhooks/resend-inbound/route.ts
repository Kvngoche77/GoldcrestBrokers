import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Resend sends webhooks either nested under data or top-level
    const emailData = payload.data || payload;
    const from = emailData.from || 'Unknown Sender';
    const to = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to || 'team@goldcrestbroker.com';
    const subject = emailData.subject || 'No Subject';
    const textBody = emailData.text || '';
    const htmlBody = emailData.html || '';

    console.log('=== [RESEND INBOUND WEBHOOK RECEIVED] ===');
    console.log('From:', from);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text preview:', textBody.slice(0, 300));

    const personalEmail = process.env.SUPPORT_REPLY_TO_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;

    // Automatically forward the email to your personal inbox
    if (personalEmail && resendApiKey) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Goldcrest Inbound <team@goldcrestbroker.com>',
          to: [personalEmail],
          subject: `[Inbound Forward] ${subject}`,
          html: `
            <div style="font-family: sans-serif; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p style="color: #64748b; font-size: 13px; margin-bottom: 8px;">
                <strong>Original Sender:</strong> ${from}<br/>
                <strong>Recipient:</strong> ${to}<br/>
                <strong>Subject:</strong> ${subject}
              </p>
              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
              <div>
                ${htmlBody || `<pre style="white-space: pre-wrap; font-family: sans-serif;">${textBody}</pre>`}
              </div>
            </div>
          `,
        }),
      });
      console.log('Forwarded inbound email to:', personalEmail);
    } else {
      console.warn('Inbound email received, but SUPPORT_REPLY_TO_EMAIL or RESEND_API_KEY is not configured for forwarding.');
    }

    return NextResponse.json({ success: true, message: 'Inbound email processed' }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing inbound email webhook:', error);
    return NextResponse.json({ error: error.message || 'Internal webhook error' }, { status: 500 });
  }
}
