'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, FileText, Pencil, Trash2, Wand2, Copy, Download } from 'lucide-react';
import type { CoverLetter } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { fillCoverLetterTemplate, type CoverLetterTemplateOutput } from '@/ai/flows/ats-checker-flow';
import { useOptimizedResumes } from '@/hooks/use-optimized-resumes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AddCoverLetterDialog } from '@/components/cover-letters/add-cover-letter-dialog';
import { logger } from '@/lib/utils/logger';
import {
  detectTemplateVariables,
  mergeTemplateVariables,
  parseTemplateVariableInput,
  validateTemplateVariables,
} from '@/lib/utils/cover-letter-template';

type CoverLetterCardProps = {
  coverLetter: CoverLetter;
  onDelete: (coverLetterId: string) => void;
  onSaveText: (
    coverLetterId: string,
    newText: string,
    name?: string,
    options?: { additionalTemplateVariables?: string[] }
  ) => void;
  onCreateCoverLetter?: (
    name: string,
    text: string,
    companyName?: string,
    jobTitle?: string,
    options?: { additionalTemplateVariables?: string[] }
  ) => Promise<unknown>;
};

export function CoverLetterCard({ coverLetter, onDelete, onSaveText, onCreateCoverLetter }: CoverLetterCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isSaveGeneratedOpen, setIsSaveGeneratedOpen] = useState(false);
  const [editText, setEditText] = useState(coverLetter.cover_letter_text);
  const [editName, setEditName] = useState(coverLetter.cover_letter_name);
  const [templateVariablesInput, setTemplateVariablesInput] = useState((coverLetter.template_variables || []).join(', '));
  const [companyName, setCompanyName] = useState(coverLetter.company_name || '');
  const [jobTitle, setJobTitle] = useState(coverLetter.job_title || '');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [templateResult, setTemplateResult] = useState<CoverLetterTemplateOutput | null>(null);
  const { toast } = useToast();
  const { resumes } = useOptimizedResumes();

  useEffect(() => {
    if (!selectedResumeId && resumes.length > 0) {
      setSelectedResumeId(resumes[0].resume_id);
    }
  }, [resumes, selectedResumeId]);

  useEffect(() => {
    setTemplateVariablesInput((coverLetter.template_variables || []).join(', '));
  }, [coverLetter.template_variables]);

  const manualVariables = parseTemplateVariableInput(templateVariablesInput);
  const variableValidation = validateTemplateVariables(editText, manualVariables);
  const editTemplateVariables = mergeTemplateVariables(detectTemplateVariables(editText), variableValidation.valid);

  const handleSave = () => {
    if (!editText.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Cover letter text cannot be empty.',
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

    onSaveText(coverLetter.cover_letter_id, editText, editName, {
      additionalTemplateVariables: variableValidation.valid,
    });
    setIsEditOpen(false);
    toast({
      title: 'Success',
      description: 'Cover letter updated successfully.',
    });
  };

  const handleDelete = () => {
    onDelete(coverLetter.cover_letter_id);
    setIsDeleteOpen(false);
    toast({
      title: 'Deleted',
      description: 'Cover letter deleted successfully.',
    });
  };

  const handleGenerateFromTemplate = async () => {
    if (!coverLetter.is_template || !coverLetter.template_variables?.length) {
      return;
    }

    if (!jobDescription.trim()) {
      toast({
        variant: 'destructive',
        title: 'Job Description Required',
        description: 'Paste the job description so the template can be tailored.',
      });
      return;
    }

    const selectedResume = resumes.find((resume) => resume.resume_id === selectedResumeId);
    const resumeText = selectedResume?.editable_text?.trim();

    if (!resumeText) {
      toast({
        variant: 'destructive',
        title: 'Resume Required',
        description: 'Select a resume with extracted text before generating from a template.',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await fillCoverLetterTemplate({
        templateText: coverLetter.cover_letter_text,
        templateVariables: coverLetter.template_variables || [],
        jobDescription: jobDescription.trim(),
        resumeText,
        companyName: companyName.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
      });

      setTemplateResult(result);
      toast({
        title: 'Template Filled',
        description: 'The cover letter template has been tailored to the company and role.',
      });
    } catch (error) {
      logger.warn('Template fill failed', error);
      toast({
        variant: 'destructive',
        title: 'Template Fill Failed',
        description: 'Could not fill this template right now. Please try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyGenerated = async () => {
    if (!templateResult) {
      return;
    }

    await navigator.clipboard.writeText(templateResult.renderedCoverLetter);
    toast({
      title: 'Copied',
      description: 'Generated cover letter copied to clipboard.',
    });
  };

  const handleDownloadGenerated = () => {
    if (!templateResult) {
      return;
    }

    const blob = new Blob([templateResult.renderedCoverLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${coverLetter.cover_letter_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'cover-letter'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg">{coverLetter.cover_letter_name}</CardTitle>
              <CardDescription className="mt-1">
                {coverLetter.company_name && coverLetter.job_title 
                  ? `${coverLetter.company_name} - ${coverLetter.job_title}`
                  : coverLetter.company_name || coverLetter.job_title || 'General cover letter'}
              </CardDescription>
              <div className="mt-3 flex flex-wrap gap-2">
                {coverLetter.is_template && (
                  <Badge variant="outline">Template</Badge>
                )}
                {!!coverLetter.template_variables?.length && (
                  <Badge variant="secondary">{coverLetter.template_variables.length} variables</Badge>
                )}
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {coverLetter.is_template && (
                  <DropdownMenuItem onClick={() => setIsTemplateOpen(true)}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Use Template
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{coverLetter.cover_letter_text.length} characters</span>
            </div>
            {coverLetter.is_template && !!coverLetter.template_variables?.length && (
              <div className="rounded-lg border border-border/60 bg-muted/40 p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Detected Variables</p>
                <div className="flex flex-wrap gap-2">
                  {coverLetter.template_variables.map((variable) => (
                    <Badge key={variable} variant="outline">
                      {`{{ ${variable} }}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          Created {formatDistanceToNow(coverLetter.created_at, { addSuffix: true })}
        </CardFooter>
      </Card>

      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Use Cover Letter Template
          </DialogTitle>
          <DialogDescription>
            Fill the detected placeholders using the company context, job description, and your selected resume.
          </DialogDescription>
        </DialogHeader>

          <div className="grid gap-6 py-4 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Detected Variables</Label>
                <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/40 p-3">
                  {(coverLetter.template_variables || []).map((variable) => (
                    <Badge key={variable} variant="outline">
                      {`{{ ${variable} }}`}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`template-company-${coverLetter.cover_letter_id}`}>Company Name</Label>
                <Input
                  id={`template-company-${coverLetter.cover_letter_id}`}
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="e.g., Datadog"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`template-job-title-${coverLetter.cover_letter_id}`}>Job Title</Label>
                <Input
                  id={`template-job-title-${coverLetter.cover_letter_id}`}
                  value={jobTitle}
                  onChange={(event) => setJobTitle(event.target.value)}
                  placeholder="e.g., Platform Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label>Resume</Label>
                <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((resume) => (
                      <SelectItem key={resume.resume_id} value={resume.resume_id}>
                        {resume.resume_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`template-jd-${coverLetter.cover_letter_id}`}>Job Description</Label>
                <Textarea
                  id={`template-jd-${coverLetter.cover_letter_id}`}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  className="min-h-[220px]"
                  placeholder="Paste the job description here..."
                />
              </div>

              <Button onClick={handleGenerateFromTemplate} disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Tailored Cover Letter'}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Rendered Cover Letter</Label>
                <ScrollArea className="h-[360px] rounded-lg border border-border/60 bg-muted/20 p-4">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {templateResult?.renderedCoverLetter || 'Your tailored cover letter will appear here once the template is filled.'}
                  </pre>
                </ScrollArea>
              </div>

              {templateResult && (
                <>
                  <div className="space-y-2">
                    <Label>Applied Replacements</Label>
                    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
                      {templateResult.replacements.map((replacement) => (
                        <div key={replacement.variable} className="text-sm">
                          <span className="font-medium">{`{{ ${replacement.variable} }}`}</span>
                          <span className="text-muted-foreground">{` -> ${replacement.value}`}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {templateResult.notes.length > 0 && (
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {templateResult.notes.map((note, index) => (
                          <li key={index}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={handleCopyGenerated}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" onClick={handleDownloadGenerated}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    {onCreateCoverLetter && (
                      <Button onClick={() => setIsSaveGeneratedOpen(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Save As New Letter
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AddCoverLetterDialog
        isOpen={isSaveGeneratedOpen}
        onOpenChange={setIsSaveGeneratedOpen}
        onSave={async (name, text, nextCompanyName, nextJobTitle, options) => {
          if (!onCreateCoverLetter) {
            return;
          }
          await onCreateCoverLetter(name, text, nextCompanyName, nextJobTitle, options);
        }}
        defaultText={templateResult?.renderedCoverLetter || ''}
        defaultCompanyName={companyName}
        defaultJobTitle={jobTitle}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Cover Letter</DialogTitle>
            <DialogDescription>
              Update your cover letter text and name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cover-letter-name">Name</Label>
              <Input
                id="cover-letter-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Cover letter name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-letter-text">Cover Letter Text</Label>
              <Textarea
                id="cover-letter-text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[400px] font-mono text-sm"
                placeholder="Your cover letter content..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cover-letter-variables">Template Variables</Label>
              <Input
                id="cover-letter-variables"
                value={templateVariablesInput}
                onChange={(event) => setTemplateVariablesInput(event.target.value)}
                placeholder="Add or correct variables, comma separated"
              />
              <p className="text-sm text-muted-foreground">
                Variables must exist in the text as placeholders like <code>{'{{ company_name }}'}</code>.
              </p>
              {editTemplateVariables.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                  {editTemplateVariables.map((variable) => (
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the cover letter
              "{coverLetter.cover_letter_name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
