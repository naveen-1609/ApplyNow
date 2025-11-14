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
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

type AddCoverLetterDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (name: string, text: string, companyName?: string, jobTitle?: string) => Promise<void>;
  defaultText?: string;
  defaultCompanyName?: string;
  defaultJobTitle?: string;
};

export function AddCoverLetterDialog({
  isOpen,
  onOpenChange,
  onSave,
  defaultText = '',
  defaultCompanyName = '',
  defaultJobTitle = '',
}: AddCoverLetterDialogProps) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [isSaving, setIsSaving] = useState(false);

  // Update state when defaults change (when dialog opens with new cover letter)
  useEffect(() => {
    if (isOpen) {
      setCompanyName(defaultCompanyName);
      setJobTitle(defaultJobTitle);
      setName(''); // Reset name each time dialog opens
    }
  }, [isOpen, defaultCompanyName, defaultJobTitle]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Name',
        description: 'Please provide a name for the cover letter.',
      });
      return;
    }

    if (!defaultText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Content',
        description: 'Cover letter text is required.',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(name, defaultText, companyName || undefined, jobTitle || undefined);
      // Success toast is handled in the hook/service
      setName('');
      setCompanyName('');
      setJobTitle('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving cover letter:', error);
      // Error toast is handled in the hook/service, but we keep the dialog open on error
      // so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Cover Letter to Directory</DialogTitle>
          <DialogDescription>
            Save this cover letter to your directory for future use.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cover-letter-name">Name *</Label>
            <Input
              id="cover-letter-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Software Engineer - Google"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name (Optional)</Label>
            <Input
              id="company-name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g., Google"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-title">Job Title (Optional)</Label>
            <Input
              id="job-title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g., Software Engineer"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Add to Directory'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

