import sharp from 'sharp';
import path from 'path';
import { generateQRCodeDataURL } from './generator';

interface StudentInfo {
  name: string;
  studentId: string;
}

export async function createBrandedQRCode(studentInfo: StudentInfo): Promise<Buffer> {
  try {
    const qrCodeDataUrl = await generateQRCodeDataURL(studentInfo.studentId, {
      width: 240,
      margin: 2,
    });
    const qrCodeBuffer = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');

    // Use DNSC logo
    const logoPath = path.join(process.cwd(), 'public/logo/dnsc.webp');
    const logoBuffer = await sharp(logoPath)
      .resize(80, 80)
      .png()
      .toBuffer();

    // Create a clean, simple branded QR code
    const canvas = sharp({
      create: {
        width: 320,
        height: 380,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });

    return canvas
      .composite([
        { input: logoBuffer, top: 20, left: 120 }, // DNSC logo at top center
        { input: qrCodeBuffer, top: 120, left: 40 }, // QR code below logo
      ])
      .png()
      .toBuffer();
  } catch (error) {
    console.error('Error creating branded QR code:', error);
    throw new Error('Failed to create branded QR code.');
  }
} 