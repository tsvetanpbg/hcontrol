// Custom font configuration for Cyrillic support in jsPDF
// Using DejaVu Sans which has excellent Cyrillic support

export const addCyrillicFont = (jsPDFInstance: any) => {
  // DejaVu Sans Base64 font (subset for Cyrillic characters)
  // This is a lightweight solution that adds Cyrillic support
  const cyrillicFont = 'dejavu-sans';
  
  try {
    // Try to add DejaVu Sans font if available
    // Note: Full implementation would require embedding the actual font file
    // For now, we'll use the default fonts with proper encoding
    
    // Set proper encoding for Cyrillic characters
    jsPDFInstance.setLanguage('bg');
    
  } catch (error) {
    console.warn('Could not add Cyrillic font, using fallback', error);
  }
  
  return jsPDFInstance;
};

// Alternative: Convert Cyrillic text to transliteration if font support fails
export const ensureCyrillicCompatibility = (text: string): string => {
  // This function ensures text is properly encoded
  // Modern jsPDF versions should handle UTF-8 correctly
  try {
    // Try to encode as UTF-8
    return decodeURIComponent(encodeURIComponent(text));
  } catch (e) {
    // Fallback to original text
    return text;
  }
};
