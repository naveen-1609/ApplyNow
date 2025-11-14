'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { addResume } from '@/lib/services/resumes';
import { useAuth } from '@/hooks/use-optimized-auth';

type UploadResumeDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUploadSuccess: () => void;
};

export function UploadResumeDialog({
  isOpen,
  onOpenChange,
  onUploadSuccess,
}: UploadResumeDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [resumeName, setResumeName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<'idle' | 'extracting' | 'warning' | 'error'>('idle');
  const [extractionMessage, setExtractionMessage] = useState('');

  const handleUpload = async () => {
    if (!resumeName || !file || !user) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide a name, select a file, and be logged in.',
      });
      return;
    }

    setIsUploading(true);
    setExtractionStatus('extracting');
    setExtractionMessage('Extracting text from file...');

    try {
        await addResume(user.uid, resumeName, file);
        
        // Check if extraction was successful by getting the uploaded resume
        // Note: We'll show a warning in the resume card if extraction failed
        toast({
          title: 'Upload successful',
          description: `"${resumeName}" has been uploaded. ${file.type?.includes('word') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') ? 'For better text extraction, consider converting to PDF format.' : 'Please review the extracted text.'}`,
        });
        
        onUploadSuccess();
        onOpenChange(false);
        setResumeName('');
        setFile(null);
        setExtractionStatus('idle');
        setExtractionMessage('');
    } catch (error: any) {
        console.error("Upload failed", error);
        setExtractionStatus('error');
        setExtractionMessage(error?.message || 'Upload failed');
        
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error?.message || 'Could not upload your resume. Please try again.',
        });
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload New Resume</DialogTitle>
          <DialogDescription>
            Add a new resume to your directory. PDF, DOC, and DOCX files are supported. Text extraction will provide content for AI analysis.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Resume Name
            </Label>
            <Input 
              id="name" 
              value={resumeName} 
              onChange={(e) => setResumeName(e.target.value)} 
              className="col-span-3" 
              placeholder="e.g., Senior Developer v2" 
              disabled={isUploading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right">
              File
            </Label>
            <div className="col-span-3 space-y-2">
              <Input 
                id="file" 
                type="file" 
                onChange={(e) => {
                  const selectedFile = e.target.files ? e.target.files[0] : null;
                  setFile(selectedFile);
                  setExtractionStatus('idle');
                  setExtractionMessage('');
                  if (selectedFile) {
                    const isWordFile = selectedFile.name.toLowerCase().endsWith('.docx') || 
                                     selectedFile.name.toLowerCase().endsWith('.doc');
                    if (isWordFile) {
                      setExtractionStatus('warning');
                      setExtractionMessage('Word documents may have extraction issues. PDF format is recommended for best results.');
                    }
                  }
                }}
                accept=".pdf,.doc,.docx"
                disabled={isUploading}
              />
              {extractionStatus === 'warning' && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ {extractionMessage}
                </p>
              )}
              {extractionStatus === 'extracting' && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  🔄 {extractionMessage}
                </p>
              )}
              {extractionStatus === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  ❌ {extractionMessage}
                </p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
