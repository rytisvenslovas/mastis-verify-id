import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('*')
      .eq('token', token)
      .single();

    if (linkError || !linkData) {
      console.error('Verify link error:', linkError);
      return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
    }

    const { data: submissionData } = await supabase
      .from('submissions')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    const data = {
      ...linkData,
      submission: submissionData,
    };

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error verifying link:', err.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
