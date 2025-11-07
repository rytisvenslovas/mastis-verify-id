import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';

export async function POST(req) {
  try {
    const { name, surname, email, phone, requireId, requireSelfie, requireAddressProof } = await req.json();
    
    if (!name || !surname) {
      return NextResponse.json({ error: 'Missing name or surname' }, { status: 400 });
    }

    const token = crypto.randomUUID();
    // Replace admin subdomain with verify subdomain for links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace('admin.', 'verify.') || 'https://verify.mastis.co.uk';
    const link = `${baseUrl}/verify/${token}`;

    const { data, error } = await supabase
      .from('links')
      .insert({
        name: name.trim(),
        surname: surname.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        require_id: requireId,
        require_selfie: requireSelfie,
        require_address_proof: requireAddressProof,
        token,
        link,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('Error creating document link:', err.message);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

