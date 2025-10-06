'use client';
import * as pdfjs from 'pdfjs-dist';
import mammoth from 'mammoth';

// Explicitly set the worker source to the minified MJS build.
// This is a more direct way to solve the module resolution issue.
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export async function extractTextFromFile(file: File): Promise<string> {
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    switch (fileExtension) {
        case 'pdf':
            return await extractTextFromPDF(file);
        case 'doc':
        case 'docx':
            return await extractTextFromDoc(file);
        default:
            throw new Error(`Unsupported file type: ${fileExtension}`);
    }
}

async function extractTextFromPDF(file: File): Promise<string> {
    const fileReader = new FileReader();
    
    return new Promise((resolve, reject) => {
        fileReader.onload = async function() {
            const typedarray = new Uint8Array(this.result as ArrayBuffer);
            try {
                const pdf = await pdfjs.getDocument(typedarray).promise;
                let textContent = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const text = await page.getTextContent();
                    textContent += text.items.map((s: any) => s.str).join(' ');
                }
                resolve(textContent);
            } catch(error) {
                reject(error);
            }
        };
        fileReader.readAsArrayBuffer(file);
    });
}

async function extractTextFromDoc(file: File): Promise<string> {
    try {
        console.log('Extracting text from DOC/DOCX file:', file.name);
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log('Extracted text length:', result.value.length);
        console.log('First 200 characters:', result.value.substring(0, 200));
        return result.value;
    } catch (error) {
        console.error('Error extracting text from DOC/DOCX:', error);
        return `[DOC/DOCX file: ${file.name}]\n\nError extracting text from this file. Please try uploading a PDF version or check if the file is corrupted.`;
    }
}

// Keep the old function name for backward compatibility
export async function pdfToText(file: File): Promise<string> {
    return await extractTextFromFile(file);
}
