// app/api/submit/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const isFile = (x) => typeof x === 'object' && x && typeof x.arrayBuffer === 'function';
const isAllowedType = (f) => {
  const m = f?.type || '';
  return m.startsWith('image/') || m === 'application/pdf';
};

// Build a browser-viewable URL for storage:
// - images: use secure_url as-is
// - pdfs: SIGNED raw URL with inline disposition to avoid 401 + “download only”
const buildViewUrl = ({ public_id, type, resource_type }, { isPdf }) => {
  if (!isPdf) return cloudinary.url(public_id, { resource_type: 'image', type: type || 'upload', secure: true });
  return cloudinary.url(public_id, {
    resource_type: 'raw',
    type: type || 'upload',
    flags: 'attachment:false', // inline
    secure: true,
    sign_url: true,            // avoids 401 with strict settings
  });
};

const uploadBuffer = (buffer, { folder, resource_type }) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type,         // 'image' | 'raw' (use 'raw' for PDFs)
          type: 'upload',
          access_mode: 'public',
        },
        (err, res) => (err ? reject(err) : resolve(res))
      )
      .end(buffer);
  });

const fail = (status, payload) => NextResponse.json(payload, { status });

export async function POST(request) {
  try {
    const formData = await request.formData();

    const token = formData.get('token');
    const idType = formData.get('idType');
    const idFile = formData.get('idFile');                 // image or pdf
    const selfieFile = formData.get('selfieFile');         // image
    const addressProofType = formData.get('addressProofType');
    const addressProofFile = formData.get('addressProofFile'); // image or pdf

    if (!token || typeof token !== 'string') {
      return fail(400, { error: 'Token is required', step: 'validation' });
    }

    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('token', token)
      .single();
    if (linkError || !linkData) {
      return fail(404, { error: 'Invalid token', step: 'token-validation', details: linkError?.message });
    }

    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('token', token)
      .maybeSingle();
    if (existing) {
      return fail(400, { error: 'Documents already submitted for this link', step: 'duplicate-check' });
    }

    const uploadedData = {
      idType: null,
      idPicture: null,
      selfie: null,
      addressProofType: null,
      addressProofPicture: null,
    };

    const handleUpload = async (file, folder) => {
      if (!isFile(file)) return null;
      if (!isAllowedType(file)) throw new Error(`Unsupported file type: ${file.type}`);
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB (max 25MB).`);
      }

      const isPdf = file.type === 'application/pdf';
      const resource_type = isPdf ? 'raw' : 'image';
      const buffer = Buffer.from(await file.arrayBuffer());

      const res = await uploadBuffer(buffer, { folder, resource_type });
      // res contains: public_id, resource_type, type, secure_url, etc.
      const url = buildViewUrl(res, { isPdf });

      return url;
    };

    // ID (image or pdf)
    if (isFile(idFile)) {
      try {
        const url = await handleUpload(idFile, `${token}/id`);
        uploadedData.idType = idType || null;
        uploadedData.idPicture = url;
      } catch (err) {
        return fail(500, { error: `ID upload failed: ${err.message}`, step: 'cloudinary-id-upload' });
      }
    }

    // Selfie (image only)
    if (isFile(selfieFile)) {
      if (!String(selfieFile.type || '').startsWith('image/')) {
        return fail(400, { error: 'Selfie must be an image', step: 'selfie-validation' });
      }
      try {
        uploadedData.selfie = await handleUpload(selfieFile, `${token}/selfie`);
      } catch (err) {
        return fail(500, { error: `Selfie upload failed: ${err.message}`, step: 'cloudinary-selfie-upload' });
      }
    }

    // Address (image or pdf)
    if (isFile(addressProofFile)) {
      try {
        const url = await handleUpload(addressProofFile, `${token}/address`);
        uploadedData.addressProofType = addressProofType || null;
        uploadedData.addressProofPicture = url;
      } catch (err) {
        return fail(500, { error: `Address proof upload failed: ${err.message}`, step: 'cloudinary-address-upload' });
      }
    }

    const insertData = {
      document_link_id: linkData.id,
      token,
      id_type: uploadedData.idType,
      id_picture: uploadedData.idPicture,
      selfie: uploadedData.selfie,
      address_proof_type: uploadedData.addressProofType,
      address_proof_picture: uploadedData.addressProofPicture,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    };

    const { data, error: insertError } = await supabase
      .from('submissions')
      .insert(insertData)
      .select()
      .single();
    if (insertError) {
      return fail(500, { error: 'Failed to save submission', step: 'db-insert', details: insertError.message });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return fail(500, {
      error: error.message || 'Failed to process submission',
      step: 'unknown',
      details: String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}