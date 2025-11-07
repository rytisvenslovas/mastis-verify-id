import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

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
    console.log('📥 Starting upload process...');
    const formData = await request.formData();
    
    const token = formData.get('token');
    const idType = formData.get('idType');
    const idFile = formData.get('idFile');
    const selfieFile = formData.get('selfieFile');
    const addressProofType = formData.get('addressProofType');
    const addressProofFile = formData.get('addressProofFile');

    console.log('📋 Form data received:', { 
      token: !!token, 
      idType, 
      idFile: idFile?.name, 
      selfieFile: selfieFile?.name, 
      addressProofType, 
      addressProofFile: addressProofFile?.name 
    });

    if (!token) {
      return NextResponse.json({ error: 'Token is required', step: 'validation' }, { status: 400 });
    }

    console.log('🔍 Validating token...');
    const { data: linkData, error: linkError } = await supabase
      .from('links')
      .select('id')
      .eq('token', token)
      .single();

    if (linkError || !linkData) {
      console.error('❌ Token validation failed:', linkError);
      return NextResponse.json({ error: 'Invalid token', step: 'token-validation', details: linkError?.message }, { status: 404 });
    }

    const documentLinkId = linkData.id;
    console.log('✅ Token validated, document_link_id:', documentLinkId);

    console.log('🔍 Checking for existing submission...');
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('token', token)
      .maybeSingle();

    if (existing) {
      console.log('⚠️ Submission already exists');
      return NextResponse.json({ error: 'Documents already submitted for this link', step: 'duplicate-check' }, { status: 400 });
    }

    const uploadedData = {};

    // Upload ID Document
    // if (idFile) {
    //   try {
    //     console.log('📤 Uploading ID document:', idFile.name, idFile.type, `${(idFile.size / 1024).toFixed(2)} KB`);
    //     const idBuffer = Buffer.from(await idFile.arrayBuffer());
    //     const idUpload = await new Promise((resolve, reject) => {
    //       cloudinary.uploader.upload_stream(
    //         { folder: `${token}/id`, resource_type: 'auto' },
    //         (error, result) => {
    //           if (error) reject(error);
    //           else resolve(result);
    //         }
    //       ).end(idBuffer);
    //     });
        
    //     uploadedData.idType = idType;
    //     uploadedData.idPicture = idUpload.secure_url;
    //     console.log('✅ ID document uploaded:', idUpload.secure_url);
    //   } catch (error) {
    //     console.error('❌ ID upload failed:', error);
    //     return NextResponse.json({ 
    //       error: `ID upload failed: ${error.message}`, 
    //       step: 'cloudinary-id-upload',
    //       details: error.toString()
    //     }, { status: 500 });
    //   }
    // }

    // Upload Selfie
    // if (selfieFile) {
    //   try {
    //     console.log('📤 Uploading selfie:', selfieFile.name, selfieFile.type, `${(selfieFile.size / 1024).toFixed(2)} KB`);
    //     const selfieBuffer = Buffer.from(await selfieFile.arrayBuffer());
    //     const selfieUpload = await new Promise((resolve, reject) => {
    //       cloudinary.uploader.upload_stream(
    //         { folder: `${token}/selfie`, resource_type: 'auto' },
    //         (error, result) => {
    //           if (error) reject(error);
    //           else resolve(result);
    //         }
    //       ).end(selfieBuffer);
    //     });
        
    //     uploadedData.selfie = selfieUpload.secure_url;
    //     console.log('✅ Selfie uploaded:', selfieUpload.secure_url);
    //   } catch (error) {
    //     console.error('❌ Selfie upload failed:', error);
    //     return NextResponse.json({ 
    //       error: `Selfie upload failed: ${error.message}`, 
    //       step: 'cloudinary-selfie-upload',
    //       details: error.toString()
    //     }, { status: 500 });
    //   }
    // }

    // Upload Address Proof
    // if (addressProofFile) {
    //   try {
    //     console.log('📤 Uploading address proof:', addressProofFile.name, addressProofFile.type, `${(addressProofFile.size / 1024).toFixed(2)} KB`);
    //     const addressBuffer = Buffer.from(await addressProofFile.arrayBuffer());
    //     const addressUpload = await new Promise((resolve, reject) => {
    //       cloudinary.uploader.upload_stream(
    //         { folder: `${token}/address`, resource_type: 'auto' },
    //         (error, result) => {
    //           if (error) reject(error);
    //           else resolve(result);
    //         }
    //       ).end(addressBuffer);
    //     });
        
    //     uploadedData.addressProofType = addressProofType;
    //     uploadedData.addressProofPicture = addressUpload.secure_url;
    //     console.log('✅ Address proof uploaded:', addressUpload.secure_url);
    //   } catch (error) {
    //     console.error('❌ Address proof upload failed:', error);
    //     return NextResponse.json({ 
    //       error: `Address proof upload failed: ${error.message}`, 
    //       step: 'cloudinary-address-upload',
    //       details: error.toString()
    //     }, { status: 500 });
    //   }
    // }

    // Insert into database
    console.log('💾 Saving to database...');
    const insertData = {
      document_link_id: documentLinkId,
      token,
      id_type: uploadedData.idType || null,
      id_picture: uploadedData.idPicture || null,
      selfie: uploadedData.selfie || null,
      address_proof_type: uploadedData.addressProofType || null,
      address_proof_picture: uploadedData.addressProofPicture || null,
      submitted_at: new Date().toISOString(),
      status: 'submitted',
    };
    
    console.log('📝 Insert data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('submissions')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database insert failed:', error);
      
      // Parse Supabase error to identify problematic field
      let fieldInfo = '';
      if (error.message.includes('submitted_at')) {
        fieldInfo = ' [FIELD: submitted_at - check timestamp format]';
      } else if (error.message.includes('status')) {
        fieldInfo = ' [FIELD: status - check allowed values]';
      } else if (error.message.includes('id_type')) {
        fieldInfo = ' [FIELD: id_type]';
      } else if (error.message.includes('address_proof_type')) {
        fieldInfo = ' [FIELD: address_proof_type]';
      }
      
      return NextResponse.json({ 
        error: `Database error: ${error.message}${fieldInfo}`, 
        step: 'database-insert',
        details: JSON.stringify(error),
        insertData: insertData
      }, { status: 500 });
    }

    console.log('✅ Submission saved successfully!');
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to process submission', 
      step: 'unknown',
      details: error.toString(),
      stack: error.stack
    }, { status: 500 });
  }
}
