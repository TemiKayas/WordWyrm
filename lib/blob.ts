import { put, del } from '@vercel/blob';

export async function uploadPDF(file: File): Promise<string> {
  const blob = await put(`pdfs/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: 'application/pdf',
  });
  return blob.url;
}

export async function deletePDF(url: string): Promise<void> {
  await del(url);
}

export async function uploadGameImage(file: File): Promise<string> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const blob = await put(`game-images/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

export async function deleteGameImage(url: string): Promise<void> {
  await del(url);
}

export async function uploadClassImage(file: File): Promise<string> {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  const blob = await put(`class-images/${file.name}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });
  return blob.url;
}

export async function deleteClassImage(url: string): Promise<void> {
  await del(url);
}
