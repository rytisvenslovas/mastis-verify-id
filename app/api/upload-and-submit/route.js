import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

const cloudinaryUrl = process.env.CLOUDINARY_URL;
let cloudName, apiKey, apiSecret;

if (cloudinaryUrl) {
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    apiKey = match[1];
    apiSecret = match[2];
    cloudName = match[3];
  }
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const formData = await request.formData();
    
    const token = formData.get('token');
    const idType = formData.get('idType');
    const idFile = formData.get('idFile');
    const selfieFile = formData.get('selfieFile');
    const addressProofType = formData.get('addressProofType');
    const addressProofFile = formData.get('addressProofFile');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('token', token)
      .single();

    if (linkError || !linkData) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const documentLinkId = linkData.id;

    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('token', token)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Documents already submitted for this link' }, { status: 400 });
    }

    const uploadedData = {};

    if (idFile) {
      const idBuffer = Buffer.from(await idFile.arrayBuffer());
      const idUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: `${token}/id`, resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(idBuffer);
      });
      
      uploadedData.idType = idType;
      uploadedData.idPicture = idUpload.secure_url;
    }

    if (selfieFile) {
      const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
      const selfieUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: `${token}/selfie`, resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(selfieBuffer);
      });
      
      uploadedData.selfie = selfieUpload.secure_url;
    }

    if (addressProofFile) {
      const addressBuffer = Buffer.from(await addressProofFile.arrayBuffer());
      const addressUpload = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: `${token}/address`, resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(addressBuffer);
      });
      
      uploadedData.addressProofType = addressProofType;
      uploadedData.addressProofPicture = addressUpload.secure_url;
    }

    const { data, error } = await supabase
      .from('submissions')
      .insert({
        document_link_id: documentLinkId,
        token,
        id_type: uploadedData.idType || null,
        id_picture: uploadedData.idPicture || null,
        selfie: uploadedData.selfie || null,
        address_proof_type: uploadedData.addressProofType || null,
        address_proof_picture: uploadedData.addressProofPicture || null,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error uploading and submitting:', error);
    return NextResponse.json({ error: 'Failed to process submission' }, { status: 500 });
  }
}
