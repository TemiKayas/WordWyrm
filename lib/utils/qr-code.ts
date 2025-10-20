import QRCode from 'qrcode';
import { put } from '@vercel/blob';

/**
 * Generate QR code for a game and upload to Vercel Blob
 * @param shareCode - The game's share code
 * @param baseUrl - The base URL of the application (e.g., process.env.NEXTAUTH_URL)
 * @returns The URL of the uploaded QR code image
 */
export async function generateGameQRCode(
  shareCode: string,
  baseUrl: string
): Promise<string> {
  // construct the game URL
  const gameUrl = `${baseUrl}/play/phaser/${shareCode}`;

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
