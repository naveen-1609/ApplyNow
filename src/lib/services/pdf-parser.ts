'use client';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Explicitly set the worker source to the minified MJS build.
// This is a more direct way to solve the module resolution issue.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
    console.log('extractTextFromFile called with:', {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified
    });
    
    if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
    }
    
    const fileExtension = file.name.toLowerCase().split('.').pop();
    console.log('Detected file extension:', fileExtension);
    
    if (!fileExtension) {
        throw new Error('Unable to determine file type. Please ensure the file has an extension (.pdf, .doc, .docx)');
    }
    
    try {
        switch (fileExtension) {
            case 'pdf':
                console.log('Extracting from PDF...');
                return await extractTextFromPDF(file);
            case 'doc':
            case 'docx':
                console.log('Extracting from DOC/DOCX...');
                return await extractTextFromDoc(file);
            default:
                throw new Error(`Unsupported file type: ${fileExtension}. Supported formats: PDF, DOC, DOCX`);
        }
    } catch (error: any) {
        console.error('extractTextFromFile error:', error);
        throw error;
    }
}

async function extractTextFromPDF(file: File): Promise<string> {
    console.log('Starting PDF extraction for file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
    }
    
    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onerror = () => {
            console.error('FileReader error:', fileReader.error);
            reject(new Error(`Failed to read file: ${fileReader.error?.message || 'Unknown error'}`));
        };
        
        fileReader.onload = async function() {
            try {
                if (!this.result) {
                    throw new Error('FileReader result is empty');
                }
                
                const typedarray = new Uint8Array(this.result as ArrayBuffer);
                console.log('PDF buffer loaded, size:', typedarray.length);
                
                const pdf = await pdfjs.getDocument({
                    data: typedarray,
                    verbosity: 0 // Suppress warnings
                }).promise;
                
                console.log('PDF loaded, pages:', pdf.numPages);
                
                let textContent = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    const pageText = text.items.map((s: any) => s.str).join(' ');
                    textContent += pageText + ' ';
                    console.log(`Page ${i} extracted, length: ${pageText.length}`);
                }
                
                const trimmedText = textContent.trim();
                console.log('Total extracted text length:', trimmedText.length);
                
                if (trimmedText.length === 0) {
                    throw new Error('No text could be extracted from PDF. The file may contain only images or be password-protected.');
                }
                
                resolve(trimmedText);
            } catch(error: any) {
                console.error('PDF extraction error:', error);
                reject(new Error(`PDF extraction failed: ${error?.message || 'Unknown error'}`));
            }
        };
        
        try {
            fileReader.readAsArrayBuffer(file);
        } catch (error: any) {
            console.error('Failed to start file reading:', error);
            reject(new Error(`Failed to read file: ${error?.message || 'Unknown error'}`));
        }
    });
}

async function extractTextFromDoc(file: File): Promise<string> {
    try {
        console.log('Extracting text from DOC/DOCX file:', file.name, 'Size:', file.size);
        
        if (!file || file.size === 0) {
            throw new Error('File is empty or invalid');
        }
        
        // Check if mammoth is available
        if (!mammoth) {
            throw new Error('Mammoth library not loaded. Please refresh the page and try again.');
        }
        
        const arrayBuffer = await file.arrayBuffer();
        console.log('File buffer loaded, size:', arrayBuffer.byteLength);
        
        // Try extracting raw text first
        console.log('Attempting raw text extraction...');
        let result = await mammoth.extractRawText({ arrayBuffer });
        let extractedText = result.value.trim();
        console.log('Raw text extraction result length:', extractedText.length);
        
        // Check if we got meaningful text (at least 50 characters)
        if (extractedText.length < 50) {
            console.warn('Extracted text is too short (' + extractedText.length + ' chars), trying alternative extraction method');
            
            // Try extracting with HTML conversion and then strip HTML tags
            try {
                console.log('Attempting HTML conversion extraction...');
                const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
                // Extract text from HTML by removing tags
                extractedText = htmlResult.value
                    .replace(/<[^>]+>/g, ' ') // Remove HTML tags
                    .replace(/\s+/g, ' ') // Normalize whitespace
                    .trim();
                console.log('HTML extraction result length:', extractedText.length);
            } catch (htmlError: any) {
                console.warn('HTML extraction also failed:', htmlError);
                // Continue with the raw text result even if it's short
            }
        }
        
        // Final validation - if still too short, it's likely a problem
        if (extractedText.length < 50) {
            console.error('Text extraction failed or returned minimal content. Length:', extractedText.length);
            console.log('First 100 characters of extracted text:', extractedText.substring(0, 100));
            throw new Error(`Text extraction failed for ${file.name}. Only ${extractedText.length} characters were extracted. The file may be corrupted, password-protected, or contain only images. Please convert to PDF or manually add the text.`);
        }
        
        console.log('✅ Extracted text length:', extractedText.length);
        console.log('First 200 characters:', extractedText.substring(0, 200));
        return extractedText;
    } catch (error: any) {
        console.error('❌ Error extracting text from DOC/DOCX:', error);
        const errorMessage = error?.message || 'Unknown error';
        throw new Error(`Failed to extract text from ${file.name}: ${errorMessage}. Please try converting the file to PDF format or manually add the resume text after upload.`);
    }
}

// Keep the old function name for backward compatibility
export async function pdfToText(file: File): Promise<string> {
    return await extractTextFromFile(file);
}
