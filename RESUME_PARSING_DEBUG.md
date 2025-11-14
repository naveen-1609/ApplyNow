# Resume Parsing Debugging Guide

## 🔍 Enhanced Logging Added

I've added comprehensive logging throughout the resume parsing process to help identify why parsing might be failing.

## 📋 What to Check

### **1. Browser Console Logs**

When you upload a resume, check the browser console (F12 → Console tab) for these logs:

#### **File Upload Start:**
```
📄 Starting text extraction for file: [filename] Type: [type] Size: [size]
🔄 Calling extractTextFromFile...
```

#### **File Detection:**
```
extractTextFromFile called with: { name, size, type, lastModified }
Detected file extension: pdf/docx
```

#### **PDF Extraction:**
```
Starting PDF extraction for file: [filename] Size: [size] Type: [type]
PDF buffer loaded, size: [bytes]
PDF loaded, pages: [number]
Page 1 extracted, length: [chars]
Total extracted text length: [chars]
```

#### **DOC/DOCX Extraction:**
```
Extracting text from DOC/DOCX file: [filename] Size: [size]
File buffer loaded, size: [bytes]
Attempting raw text extraction...
Raw text extraction result length: [chars]
```

#### **Success:**
```
✅ Text extraction completed. Length: [number]
✅ Text extraction successful: [number] characters
```

#### **Errors:**
```
❌ Text extraction failed: [error message]
⚠️ No text extracted
⚠️ Very little text extracted: [number] characters
```

### **2. Common Issues & Solutions**

#### **Issue 1: "File is empty or invalid"**
**Cause**: File size is 0 or file object is invalid
**Solution**: 
- Make sure the file was selected correctly
- Check file size (should be > 0 bytes)
- Try selecting the file again

#### **Issue 2: "Unable to determine file type"**
**Cause**: File doesn't have an extension
**Solution**: 
- Rename file to include extension (.pdf, .doc, .docx)
- Make sure the file name ends with the correct extension

#### **Issue 3: "Mammoth library not loaded"**
**Cause**: DOC/DOCX extraction library failed to load
**Solution**: 
- Refresh the page
- Check browser console for import errors
- Verify `mammoth` package is installed

#### **Issue 4: "PDF extraction failed"**
**Cause**: PDF is corrupted, password-protected, or image-only
**Solution**: 
- Try opening the PDF in a PDF viewer first
- If password-protected, remove password protection
- If image-only, use OCR or manually add text
- Convert to a different PDF format

#### **Issue 5: "Text extraction failed - Only X characters extracted"**
**Cause**: Very little text could be extracted
**Solution**: 
- File may contain mostly images
- File may be corrupted
- Try converting to PDF format
- Manually add text via "Edit Text" option

#### **Issue 6: No logs appearing**
**Cause**: Function not being called
**Solution**: 
- Check if upload button is actually calling the function
- Check for JavaScript errors in console
- Verify file was selected before upload

### **3. Step-by-Step Debugging**

1. **Open Browser Console** (F12 → Console)
2. **Upload a Resume**
3. **Watch for Logs**:
   - Should see "📄 Starting text extraction..."
   - Should see file details (name, size, type)
   - Should see extraction progress
   - Should see success or error message

4. **If No Logs Appear**:
   - Check if upload function is being called
   - Check for JavaScript errors
   - Verify file was selected

5. **If Error Logs Appear**:
   - Note the exact error message
   - Check which step failed (PDF vs DOC/DOCX)
   - Try the suggested solutions above

### **4. Testing Different File Types**

#### **PDF Files:**
- Should work reliably
- Check console for "PDF loaded, pages: X"
- Each page should show extraction length

#### **DOC/DOCX Files:**
- May have more issues
- Check for "Raw text extraction result length"
- If low, it will try HTML conversion
- Check for "HTML extraction result length"

### **5. Manual Testing**

To test if extraction is working:

1. **Upload a simple PDF resume**:
   - Should extract text successfully
   - Check console for success logs
   - Check resume card for extracted text

2. **Upload a DOCX resume**:
   - May have warnings
   - Check console for extraction attempts
   - Check if fallback methods are used

3. **Check Extracted Text**:
   - Go to Resumes page
   - Click on resume card
   - Should see text preview
   - If empty, warning will show

### **6. What the Logs Tell You**

#### **File Information:**
```
name: "resume.pdf"        → File name
size: 123456              → File size in bytes
type: "application/pdf"   → MIME type
lastModified: 1234567890  → Last modified timestamp
```

#### **Extraction Progress:**
```
PDF buffer loaded, size: 123456     → File read successfully
PDF loaded, pages: 2                → PDF parsed successfully
Page 1 extracted, length: 500        → Text extracted from page 1
Total extracted text length: 1000   → All text extracted
```

#### **Success Indicators:**
- ✅ Green checkmarks = Success
- 📝 Shows first 200 characters = Text extracted
- Length > 100 = Good extraction

#### **Warning Indicators:**
- ⚠️ Yellow warnings = Issues but continues
- Length < 100 = Very little text
- Length = 0 = No text extracted

#### **Error Indicators:**
- ❌ Red X = Failed
- Error message = Specific problem
- Stack trace = Where it failed

## 🔧 Quick Fixes

### **If Parsing Fails Completely:**
1. Check browser console for errors
2. Try a different file format (PDF preferred)
3. Try a smaller file
4. Check if file is corrupted
5. Manually add text via "Edit Text" option

### **If Parsing Works But Text is Empty:**
1. Check console for extraction length
2. If length is 0, extraction failed
3. Try converting file to PDF
4. Use "Edit Text" to manually add content

### **If Parsing Works But Text is Short:**
1. File may contain mostly images
2. File may have complex formatting
3. Review extracted text and manually add missing content
4. Use "Edit Text" to complete the text

## 📝 Next Steps

After checking the logs:

1. **If you see errors**: Share the exact error message from console
2. **If you see warnings**: Note which step had issues
3. **If no logs appear**: Check if upload function is being called
4. **If extraction works**: Check if text appears in resume card

The enhanced logging will help identify exactly where the parsing is failing!

