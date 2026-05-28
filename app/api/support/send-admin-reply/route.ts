import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { ticketId, message, userId } = await req.json();

    // Validate required fields
    if (!ticketId || !message || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: ticketId, message, userId' },
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

    // Verify user is admin
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('Profile check error:', profileError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userProfile.is_admin) {
      return NextResponse.json(
        { error: 'Only admins can send support replies' },
        { status: 403 }
      );
    }

    // Verify ticket exists
    const { data: ticket, error: ticketCheckError } = await supabase
      .from('support_tickets')
      .select('id')
      .eq('id', ticketId)
      .single();

    if (ticketCheckError || !ticket) {
      console.error('Ticket check error:', ticketCheckError);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Create admin message
    const { data: newMessage, error: messageError } = await supabase
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: userId,
        message,
        is_admin_reply: true,
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
        responseMessage: 'Admin reply sent successfully',
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
