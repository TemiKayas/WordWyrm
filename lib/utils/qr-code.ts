import QRCode from 'qrcode';
import { put } from '@vercel/blob';

/**
 * Generate QR code for a game and upload to Vercel Blob
 * @param shareCode - The game's share code
 * @returns The URL of the uploaded QR code image
 */
export async function generateGameQRCode(
  shareCode: string
): Promise<string> {
  // Always use production URL for QR codes, even in local development
  const PRODUCTION_URL = 'https://word-wyrm.vercel.app';
  const gameUrl = `${PRODUCTION_URL}/join/${shareCode}`;

  // generate QR code as buffer
  const qrBuffer = await QRCode.toBuffer(gameUrl, {
    type: 'png',
    width: 512,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#473025', // brown color from design
      light: '#FFFCF8', // cream color from design
    },
  });

  // upload to Vercel Blob
  const blob = await put(`qr-codes/${shareCode}.png`, qrBuffer, {
    access: 'public',
    contentType: 'image/png',
  });

  return blob.url;
}
