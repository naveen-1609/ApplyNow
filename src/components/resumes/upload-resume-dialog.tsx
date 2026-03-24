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
import { addResume, formatFileSize, validateResumeFile } from '@/lib/services/resumes';
import { useAuth } from '@/hooks/use-optimized-auth';
import { FileText, FileUp, Loader2, ShieldCheck } from 'lucide-react';

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
  const [fileError, setFileError] = useState<string | null>(null);

  const resetForm = () => {
    setResumeName('');
    setFile(null);
    setFileError(null);
    setExtractionStatus('idle');
    setExtractionMessage('');
  };

  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
    setExtractionStatus('idle');
    setExtractionMessage('');

    const validationError = validateResumeFile(selectedFile);
    setFileError(validationError);

    if (!selectedFile || validationError) {
      return;
    }

    const isWordFile =
      selectedFile.name.toLowerCase().endsWith('.docx') ||
      selectedFile.name.toLowerCase().endsWith('.doc');

    if (isWordFile) {
      setExtractionStatus('warning');
      setExtractionMessage('Word documents can lose formatting during extraction. PDF works best for accurate parsing.');
    }
  };

  const handleUpload = async () => {
    const trimmedResumeName = resumeName.trim();
    const validationError = validateResumeFile(file);

    if (!trimmedResumeName || !file || !user || validationError) {
      setFileError(validationError);
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: validationError || 'Please provide a name, select a file, and be logged in.',
      });
      return;
    }

    setIsUploading(true);
    setExtractionStatus('extracting');
    setExtractionMessage('Extracting text from file...');

    try {
        await addResume(user.uid, trimmedResumeName, file);
        
        toast({
          title: 'Upload successful',
          description: `"${trimmedResumeName}" is ready. ${file.type?.includes('word') || file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc') ? 'Review the extracted text and switch to PDF next time for the cleanest results.' : 'Review the extracted text once the card appears.'}`,
        });
        
        onUploadSuccess();
        onOpenChange(false);
        resetForm();
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
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen && !isUploading) {
          resetForm();
        }
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5 text-primary" />
            Upload New Resume
          </DialogTitle>
          <DialogDescription>
            Add a polished resume to your library. We&apos;ll store the file, extract text for AI features, and flag anything that needs a manual review.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/12 p-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">Friendly upload guardrails</p>
                <p className="text-muted-foreground">Accepted formats: PDF, DOC, DOCX. Recommended size: under 5 MB. PDF usually gives the cleanest text extraction.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-sm font-medium">
              Resume Name
            </Label>
            <Input 
              id="name" 
              value={resumeName} 
              onChange={(e) => setResumeName(e.target.value)} 
              className="col-span-3 h-11" 
              placeholder="e.g., Senior Developer v2" 
              disabled={isUploading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="file" className="text-right text-sm font-medium">
              File
            </Label>
            <div className="col-span-3 space-y-2">
              <Input 
                id="file" 
                type="file" 
                onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                accept=".pdf,.doc,.docx"
                disabled={isUploading}
                className="h-11 cursor-pointer"
              />
              {file && !fileError && (
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate font-medium text-foreground">{file.name}</span>
                  </div>
                  <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
                </div>
              )}
              {fileError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {fileError}
                </p>
              )}
              {extractionStatus === 'warning' && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {extractionMessage}
                </p>
              )}
              {extractionStatus === 'extracting' && (
                <p className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {extractionMessage}
                </p>
              )}
              {extractionStatus === 'error' && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {extractionMessage}
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
