import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// const cloudinaryUrl = process.env.CLOUDINARY_URL;
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// if (cloudinaryUrl) {
//   const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
//   if (match) {
//     apiKey = match[1];
//     apiSecret = match[2];
//     cloudName = match[3];
//   }
// }


cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { token } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);

    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder: token,
      },
      apiSecret
    );

    return NextResponse.json({
      signature,
      timestamp,
      cloudName,
      apiKey,
    });
  } catch (error) {
    console.error('Error generating Cloudinary signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
