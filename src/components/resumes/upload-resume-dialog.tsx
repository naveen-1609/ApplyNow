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

type UploadResumeDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
};

export function UploadResumeDialog({
  isOpen,
  onOpenChange,
}: UploadResumeDialogProps) {
  const { toast } = useToast();
  const [resumeName, setResumeName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!resumeName || !file) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide a name and select a file.',
      });
      return;
    }
    // Mock upload logic
    console.log('Uploading', file.name, 'as', resumeName);
    toast({
      title: 'Upload successful',
      description: `${resumeName} has been added to your directory.`,
    });
    onOpenChange(false);
    setResumeName('');
    setFile(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload New Resume</DialogTitle>
          <DialogDescription>
            Add a new resume to your directory. You can link it to applications later.
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
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleUpload}>Upload</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
