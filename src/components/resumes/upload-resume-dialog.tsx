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
import { useAuth } from '@/hooks/use-auth';

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

    try {
        await addResume(user.uid, resumeName, file);
        toast({
          title: 'Upload successful',
          description: `${resumeName} has been added to your directory.`,
        });
        onUploadSuccess();
        onOpenChange(false);
        setResumeName('');
        setFile(null);
    } catch (error) {
        console.error("Upload failed", error);
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: 'Could not upload your resume. Please try again.',
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
            <Input 
              id="file" 
              type="file" 
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="col-span-3"
              accept=".pdf,.doc,.docx"
              disabled={isUploading}
            />
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
