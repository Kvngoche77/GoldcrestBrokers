import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // Resend sends webhooks nested under data
    const emailData = payload.data || payload;
    const emailId = emailData.email_id || emailData.id;
    const from = emailData.from || 'Unknown Sender';
    const to = Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to || 'team@goldcrestbroker.com';
    const subject = emailData.subject || 'No Subject';

    console.log('=== [RESEND INBOUND WEBHOOK RECEIVED] ===');
    console.log('Email ID:', emailId);
    console.log('From:', from);
    console.log('To:', to);
    console.log('Subject:', subject);

    const personalEmail = process.env.SUPPORT_REPLY_TO_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;

    let textBody = emailData.text || '';
    let htmlBody = emailData.html || '';

    // Resend email.received webhook sends metadata only.
    // Fetch full body from Resend receiving API if email_id is present
    if (emailId && resendApiKey && (!textBody && !htmlBody)) {
      try {
        const fetchRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
          },
        });
        if (fetchRes.ok) {
          const emailDetails = await fetchRes.json();
          textBody = emailDetails.text || '';
          htmlBody = emailDetails.html || '';
        }
      } catch (fetchErr) {
        console.error('Error retrieving full inbound email content from Resend:', fetchErr);
      }
    }

    // Automatically forward the email to your personal inbox
    if (personalEmail && resendApiKey) {
      try {
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
                  ${htmlBody || `<pre style="white-space: pre-wrap; font-family: sans-serif;">${textBody || 'No text content available'}</pre>`}
                </div>
              </div>
            `,
          }),
        });
        console.log('Successfully forwarded inbound email to:', personalEmail);
      } catch (forwardErr) {
        console.error('Failed to forward email:', forwardErr);
      }
    }

    // Always return 200 OK so Resend marks the webhook as delivered successfully
    return NextResponse.json({ success: true, message: 'Inbound email processed' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in resend inbound webhook handler:', error);
    // Still return 200 to acknowledge receipt and avoid repeated webhook retries
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}
