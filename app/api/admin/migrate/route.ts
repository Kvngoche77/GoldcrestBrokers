import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Verify this is an admin request - check for a secret token
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-20);
  
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20260707_automated_copy_trading.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration SQL
    const { data, error } = await supabaseAdmin.rpc('exec_admin_sql', { sql_query: sql });

    if (error) {
      // Try to run individual statements if rpc isn't available
      return NextResponse.json({
        success: false,
        error: error.message,
        note: 'Apply the migration manually via the Supabase Dashboard SQL editor.',
        sqlFile: '20260707_automated_copy_trading.sql',
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
