// app/api/submit/route.js
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

/* ───────────────── Cloudinary ───────────────── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/* ───────────────── Supabase ───────────────── */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/* ───────────────── Helpers ───────────────── */
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB safety cap

const isFile = (x) => typeof x === 'object' && x && typeof x.arrayBuffer === 'function';

const isAllowedType = (file) => {
  const mime = file?.type || '';
  return mime.startsWith('image/') || mime === 'application/pdf';
};

const resourceTypeFor = (file) => {
  const mime = file?.type || '';
  // PDFs must be served as "raw"
  if (mime === 'application/pdf') return 'raw';
  // Everything else we accept is an image/*
  return 'image';
};

const uploadBuffer = (buffer, { folder, resource_type, public_id }) =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,           // 'image' | 'raw'
        access_mode: 'public',   // publicly viewable
        type: 'upload',
        public_id,               // optional: keep undefined to auto-generate
      },
      (err, res) => (err ? reject(err) : resolve(res))
    ).end(buffer);
  });

const fail = (status, payload) => NextResponse.json(payload, { status });

/* ───────────────── Route ───────────────── */
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

    // Validate token belongs to a link
    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('token', token)
      .single();

    if (linkError || !linkData) {
      return fail(404, { error: 'Invalid token', step: 'token-validation', details: linkError?.message });
    }

    // Prevent duplicate submissions
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('token', token)
      .maybeSingle();

    if (existing) {
      return fail(400, { error: 'Documents already submitted for this link', step: 'duplicate-check' });
    }

    // Prepare result container
    const uploadedData = {
      idType: null,
      idPicture: null,                 // URL
      selfie: null,                    // URL
      addressProofType: null,
      addressProofPicture: null,       // URL
    };

    // Small utility to handle a single upload
    const handleUpload = async (file, folder) => {
      if (!isFile(file)) return null;
      if (!isAllowedType(file)) {
        throw new Error(`Unsupported file type: ${file.type}. Only images and PDFs are allowed.`);
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new Error(`File too large: ${(file.size / (1024*1024)).toFixed(1)}MB (max ${MAX_FILE_BYTES/(1024*1024)}MB).`);
      }
      const buffer = Buffer.from(await file.arrayBuffer());
      const resource_type = resourceTypeFor(file); // 'image' for images, 'raw' for pdf
      const res = await uploadBuffer(buffer, { folder, resource_type });
      return res.secure_url;
    };

    /* ── Uploads ── */
    // 1) ID Document (image or pdf)
    if (isFile(idFile)) {
      try {
        const url = await handleUpload(idFile, `${token}/id`);
        uploadedData.idType = idType || null;
        uploadedData.idPicture = url;
      } catch (err) {
        return fail(500, { error: `ID upload failed: ${err.message}`, step: 'cloudinary-id-upload' });
      }
    }

    // 2) Selfie (image only)
    if (isFile(selfieFile)) {
      // enforce image explicitly for selfie
      if (!String(selfieFile.type || '').startsWith('image/')) {
        return fail(400, { error: 'Selfie must be an image', step: 'selfie-validation' });
      }
      try {
        const url = await handleUpload(selfieFile, `${token}/selfie`);
        uploadedData.selfie = url;
      } catch (err) {
        return fail(500, { error: `Selfie upload failed: ${err.message}`, step: 'cloudinary-selfie-upload' });
      }
    }

    // 3) Address Proof (image or pdf)
    if (isFile(addressProofFile)) {
      try {
        const url = await handleUpload(addressProofFile, `${token}/address`);
        uploadedData.addressProofType = addressProofType || null;
        uploadedData.addressProofPicture = url;
      } catch (err) {
        return fail(500, { error: `Address proof upload failed: ${err.message}`, step: 'cloudinary-address-upload' });
      }
    }

    /* ── Persist submission ── */
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