import pdf from 'pdf-parse';

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // Ensure we have a valid Buffer
    if (!Buffer.isBuffer(buffer)) {
      throw new Error('Invalid buffer provided to PDF extractor');
    }

    // Parse the PDF buffer using pdf-parse with error tolerance
    const data = await pdf(buffer, {
      // Increase max pages to handle large PDFs
      max: 0, // 0 = no limit
    });

    return data.text;
  } catch (error) {
    console.error('PDF extraction error:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
      console.error('Error details:', error);
    }

    // Provide more specific error messages based on the error type
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for specific PDF parsing errors
    if (errorMessage.includes('bad XRef') || errorMessage.includes('XRef')) {
      throw new Error(
        'This PDF has a corrupted structure and cannot be processed. ' +
        'Please try re-saving the PDF or converting it to a different format first. ' +
        'If this is a scanned document, try using OCR software to convert it to a text-based PDF.'
      );
    }

    if (errorMessage.includes('Encrypted') || errorMessage.includes('password')) {
      throw new Error(
        'This PDF is password-protected or encrypted. ' +
        'Please remove the password protection and try again.'
      );
    }

    if (errorMessage.includes('Invalid PDF') || errorMessage.includes('not a PDF')) {
      throw new Error(
        'This file does not appear to be a valid PDF. ' +
        'Please make sure you uploaded a PDF file.'
      );
    }

    // Generic error with helpful suggestions
    throw new Error(
      `Unable to process this PDF (${errorMessage}). ` +
      'This may be due to: (1) The PDF being corrupted, (2) It being a scanned image rather than text-based, ' +
      'or (3) Having security restrictions. Please try a different PDF or convert this one to a text-based format.'
    );
  }
}

export function validatePDF(file: File): { valid: boolean; error?: string } {
  // Check file type
  if (!file.type.includes('pdf')) {
    return { valid: false, error: 'File must be a PDF' };
  }

  // Check file size (max 25MB)
  const maxSize = 25 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'PDF must be smaller than 25MB' };
  }

  return { valid: true };
}
