import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { subject, category, priority, message, userId } = await req.json();

    // Validate required fields
    if (!subject || !message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, message, userId' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create support ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        subject,
        category: category || 'general',
        priority: priority || 'normal',
        status: 'open',
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Ticket creation error:', ticketError);
      return NextResponse.json(
        { error: `Failed to create ticket: ${ticketError.message}` },
        { status: 500 }
      );
    }

    if (!ticket) {
      return NextResponse.json(
        { error: 'Failed to create ticket: No ticket returned' },
        { status: 500 }
      );
    }

    // Create initial message
    const { error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: userId,
        message,
        is_admin_reply: false,
      });

    if (messageError) {
      console.error('Message creation error:', messageError);
      // Don't fail the whole operation if message creation fails
      console.warn('Warning: Message creation failed but ticket was created');
    }

    return NextResponse.json(
      {
        success: true,
        ticket,
        message: 'Support ticket created successfully',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
