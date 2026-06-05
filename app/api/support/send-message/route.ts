import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ticketId, senderId, message } = await req.json();

    // Validate required fields
    if (!ticketId || !senderId || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: ticketId, senderId, message' },
        { status: 400 }
      );
    }

    if (!message.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify ticket exists and belongs to sender
    const { data: ticket, error: ticketCheckError } = await supabase
      .from('support_tickets')
      .select('id, user_id, status')
      .eq('id', ticketId)
      .single();

    if (ticketCheckError || !ticket) {
      console.error('Ticket check error:', ticketCheckError);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if ticket is closed
    if (ticket.status === 'closed') {
      return NextResponse.json(
        { error: 'Cannot send message to closed ticket' },
        { status: 400 }
      );
    }

    // Verify user has permission (ticket owner OR admin)
    // We allow anyone authenticated to reply if they own the ticket.
    // Admin replies go through the admin support route.
    if (ticket.user_id !== senderId) {
      return NextResponse.json(
        { error: 'Not authorized to send message to this ticket' },
        { status: 403 }
      );
    }

    // Create message
    const { data: newMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: senderId,
        message,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Message creation error:', messageError);
      return NextResponse.json(
        { error: `Failed to send message: ${messageError.message}` },
        { status: 500 }
      );
    }

    // Update ticket's updated_at timestamp
    await supabase
      .from('support_tickets')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    return NextResponse.json(
      {
        success: true,
        message: newMessage,
        responseMessage: 'Message sent successfully',
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
