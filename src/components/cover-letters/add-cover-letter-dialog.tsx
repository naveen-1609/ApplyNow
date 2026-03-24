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
import { Textarea } from '@/components/ui/textarea';
import { extractTextFromFile } from '@/lib/services/pdf-parser';
import { FileText, Loader2 } from 'lucide-react';
import { logger } from '@/lib/utils/logger';
import {
  detectTemplateVariables,
  parseTemplateVariableInput,
  validateTemplateVariables,
  mergeTemplateVariables,
} from '@/lib/utils/cover-letter-template';
import { Badge } from '@/components/ui/badge';

type AddCoverLetterDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (
    name: string,
    text: string,
    companyName?: string,
    jobTitle?: string,
    options?: { sourceFileName?: string; additionalTemplateVariables?: string[] }
  ) => Promise<unknown>;
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
  const [importedFile, setImportedFile] = useState<File | null>(null);
  const [importedText, setImportedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [templateVariablesInput, setTemplateVariablesInput] = useState('');

  // Update state when defaults change (when dialog opens with new cover letter)
  useEffect(() => {
    if (isOpen) {
      setCompanyName(defaultCompanyName);
      setJobTitle(defaultJobTitle);
      setName(''); // Reset name each time dialog opens
      setImportedFile(null);
      setImportedText('');
      setFileError(null);
      setTemplateVariablesInput('');
    }
  }, [isOpen, defaultCompanyName, defaultJobTitle]);

  const coverLetterText = defaultText.trim() || importedText.trim();
  const detectedVariables = detectTemplateVariables(coverLetterText);
  const manualVariables = parseTemplateVariableInput(templateVariablesInput);
  const variableValidation = validateTemplateVariables(coverLetterText, manualVariables);
  const allTemplateVariables = mergeTemplateVariables(detectedVariables, variableValidation.valid);

  const validateCoverLetterFile = (file: File | null) => {
    if (!file) {
      return null;
    }

    const extension = file.name.toLowerCase().split('.').pop();
    if (!extension || !['pdf', 'doc', 'docx'].includes(extension)) {
      return 'Please upload a PDF, DOC, or DOCX file.';
    }

    if (file.size === 0) {
      return 'The selected file is empty.';
    }

    if (file.size > 5 * 1024 * 1024) {
      return 'Please keep cover letter files under 5 MB.';
    }

    return null;
  };

  const handleFileChange = async (file: File | null) => {
    setImportedFile(file);
    setImportedText('');
    setFileError(null);

    const validationError = validateCoverLetterFile(file);
    if (validationError) {
      setFileError(validationError);
      return;
    }

    if (!file) {
      return;
    }

    setIsExtracting(true);
    try {
      const text = await extractTextFromFile(file);
      setImportedText(text);
      if (!name.trim()) {
        setName(file.name.replace(/\.[^.]+$/, ''));
      }
      toast({
        title: 'File imported',
        description: 'Cover letter text was extracted successfully. Review it before saving.',
      });
    } catch (error: any) {
      setFileError(error?.message || 'Could not extract text from this file.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing Name',
        description: 'Please provide a name for the cover letter.',
      });
      return;
    }

    if (!coverLetterText) {
      toast({
        variant: 'destructive',
        title: 'Missing Content',
        description: 'Add cover letter text or import a PDF/DOCX file.',
      });
      return;
    }

    if (variableValidation.invalid.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Variables',
        description: `Fix these variable names before saving: ${variableValidation.invalid.join(', ')}`,
      });
      return;
    }

    if (variableValidation.missingInText.length > 0) {
      toast({
        variant: 'destructive',
        title: 'Variables Not Found In Template',
        description: `These variables are not wrapped in the template text yet: ${variableValidation.missingInText.join(', ')}`,
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(
        name,
        coverLetterText,
        companyName || undefined,
        jobTitle || undefined,
        {
          sourceFileName: importedFile?.name,
          additionalTemplateVariables: variableValidation.valid,
        }
      );
      // Success toast is handled in the hook/service
      setName('');
      setCompanyName('');
      setJobTitle('');
      setImportedFile(null);
      setImportedText('');
      setFileError(null);
      setTemplateVariablesInput('');
      onOpenChange(false);
    } catch (error) {
      logger.warn('Error saving cover letter from dialog', error);
      // Error toast is handled in the hook/service, but we keep the dialog open on error
      // so user can retry
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden p-0">
        <DialogHeader>
          <div className="px-6 pt-6">
          <DialogTitle>Add Cover Letter to Directory</DialogTitle>
          <DialogDescription>
            Save generated text or import a PDF/DOCX cover letter into your directory. Templates with placeholders like
            {' '}<code>{'{{ company_name }}'}</code>{' '}are detected automatically.
          </DialogDescription>
          </div>
        </DialogHeader>
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto px-6 py-4">
          <div className="space-y-4">
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
          <div className="space-y-2">
            <Label htmlFor="template-variables">Template Variables</Label>
            <Input
              id="template-variables"
              value={templateVariablesInput}
              onChange={(event) => setTemplateVariablesInput(event.target.value)}
              placeholder="Add missing variables, comma separated"
            />
            <p className="text-sm text-muted-foreground">
              Add variables the detector missed. Use names only, like `company_focus, hiring_manager_name`.
            </p>
            {allTemplateVariables.length > 0 && (
              <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                {allTemplateVariables.map((variable) => (
                  <Badge key={variable} variant="outline">
                    {`{{ ${variable} }}`}
                  </Badge>
                ))}
              </div>
            )}
            {variableValidation.invalid.length > 0 && (
              <p className="text-sm text-red-600">
                Invalid variable names: {variableValidation.invalid.join(', ')}
              </p>
            )}
            {variableValidation.missingInText.length > 0 && (
              <p className="text-sm text-red-600">
                Not found in template text: {variableValidation.missingInText.join(', ')}
              </p>
            )}
          </div>
          {!defaultText.trim() && (
            <>
              <div className="space-y-2">
                <Label htmlFor="cover-letter-file">Import File</Label>
                <Input
                  id="cover-letter-file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => void handleFileChange(event.target.files ? event.target.files[0] : null)}
                  disabled={isSaving || isExtracting}
                />
                <p className="text-sm text-muted-foreground">
                  Accepted formats: PDF, DOC, DOCX. PDF usually extracts the cleanest text.
                </p>
                {importedFile && !fileError && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>{importedFile.name}</span>
                  </div>
                )}
                {isExtracting && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting text from file...</span>
                  </div>
                )}
                {fileError && <p className="text-sm text-red-600">{fileError}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="cover-letter-imported-text">Imported Text</Label>
                <Textarea
                  id="cover-letter-imported-text"
                  value={importedText}
                  onChange={(event) => setImportedText(event.target.value)}
                  className="min-h-[160px] font-mono text-sm"
                  placeholder="Imported cover letter text will appear here."
                  disabled={isSaving || isExtracting}
                />
              </div>
            </>
          )}
          </div>
        </div>
        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isExtracting}>
            {isSaving ? 'Saving...' : defaultText.trim() ? 'Add to Directory' : 'Import and Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
