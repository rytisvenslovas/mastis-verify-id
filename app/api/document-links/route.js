import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');

    let query = supabase
      .from('links')
      .select('*');

    if (search && search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      query = query.or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    const { data: links, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    const linksWithSubmissions = await Promise.all(
      links.map(async (link) => {
        const { data: submission } = await supabase
          .from('submissions')
          .select('*')
          .eq('token', link.token)
          .maybeSingle();
        
        return {
          ...link,
          submission: submission ? [submission] : [],
        };
      })
    );

    return NextResponse.json({ success: true, data: linksWithSubmissions });
  } catch (err) {
    console.error('Error fetching document links:', err.message);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

