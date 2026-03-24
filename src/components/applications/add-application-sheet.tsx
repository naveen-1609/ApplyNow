'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, Wand2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  JobApplication,
  JobApplicationStatus,
  ApplicationSavePayload,
  Resume,
  CoverLetter,
  GeneratedCoverLetterDraft,
} from '@/lib/types';
import { ALL_STATUSES } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { fillCoverLetterTemplate } from '@/ai/flows/ats-checker-flow';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/lib/utils/logger';

type AddApplicationSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  application?: JobApplication | null;
  onSave: (application: ApplicationSavePayload) => Promise<void> | void;
};

export function AddApplicationSheet({
  isOpen,
  onOpenChange,
  application,
  onSave,
  resumes = [], // Accept resumes as prop to avoid duplicate API calls
  coverLetters = [], // Accept cover letters as prop
}: AddApplicationSheetProps & { resumes?: Resume[]; coverLetters?: CoverLetter[] }) {
    const { toast } = useToast();
    const [title, setTitle] = useState('');
    const [company, setCompany] = useState('');
    const [link, setLink] = useState('');
    const [description, setDescription] = useState('');
    const [resumeId, setResumeId] = useState<string>();
    const [coverLetterId, setCoverLetterId] = useState<string>();
    const [templateId, setTemplateId] = useState<string>();
    const [status, setStatus] = useState<JobApplicationStatus>('Applied');
    const [appliedDate, setAppliedDate] = useState<Date | undefined>(new Date());
    const [isGeneratingCoverLetter, setIsGeneratingCoverLetter] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [generatedCoverLetterDraft, setGeneratedCoverLetterDraft] = useState<GeneratedCoverLetterDraft | null>(null);

    const templateOptions = coverLetters.filter((coverLetter) => coverLetter.is_template);
    
    useEffect(() => {
        if (isOpen) {
            if (application) {
                setTitle(application.job_title);
                setCompany(application.company_name);
                setLink(application.job_link);
                setDescription(application.job_description);
                setResumeId(application.resume_id || undefined);
                setCoverLetterId(application.cover_letter_id || undefined);
                setTemplateId(undefined);
                setStatus(application.status);
                setAppliedDate(application.applied_date);
                setGeneratedCoverLetterDraft(null);
            } else {
                setTitle('');
                setCompany('');
                setLink('');
                setDescription('');
                setResumeId(resumes[0]?.resume_id);
                setCoverLetterId(undefined);
                setTemplateId(undefined);
                setStatus('Applied');
                setAppliedDate(new Date());
                setGeneratedCoverLetterDraft(null);
            }
            setIsGeneratingCoverLetter(false);
            setIsSaving(false);
        }
    }, [application, isOpen, resumes]);

    const clearGeneratedCoverLetter = () => {
      setGeneratedCoverLetterDraft(null);
    };

    const handleGenerateCoverLetter = async () => {
      if (application) {
        return;
      }

      if (!templateId) {
        toast({
          variant: 'destructive',
          title: 'Template Required',
          description: 'Select a cover letter template before generating.',
        });
        return;
      }

      if (!description.trim()) {
        toast({
          variant: 'destructive',
          title: 'Job Description Required',
          description: 'Paste the job description so the template can be tailored to this role.',
        });
        return;
      }

      const selectedResume = resumes.find((resume) => resume.resume_id === resumeId);
      const selectedTemplate = templateOptions.find((coverLetter) => coverLetter.cover_letter_id === templateId);
      const resumeText = selectedResume?.editable_text?.trim();

      if (!selectedTemplate) {
        toast({
          variant: 'destructive',
          title: 'Template Not Found',
          description: 'The selected template could not be loaded.',
        });
        return;
      }

      if (!resumeText) {
        toast({
          variant: 'destructive',
          title: 'Resume Required',
          description: 'Choose a resume with extracted text before generating a cover letter.',
        });
        return;
      }

      setIsGeneratingCoverLetter(true);
      try {
        const result = await fillCoverLetterTemplate({
          templateText: selectedTemplate.cover_letter_text,
          templateVariables: selectedTemplate.template_variables || [],
          jobDescription: description.trim(),
          resumeText,
          companyName: company.trim() || undefined,
          jobTitle: title.trim() || undefined,
        });

        setGeneratedCoverLetterDraft({
          template_id: selectedTemplate.cover_letter_id,
          template_name: selectedTemplate.cover_letter_name,
          generated_text: result.renderedCoverLetter,
          company_name: company.trim() || null,
          job_title: title.trim() || null,
        });
        setCoverLetterId(undefined);

        toast({
          title: 'Cover Letter Ready',
          description: 'This generated cover letter will be attached when you save the application.',
        });
      } catch (error) {
        logger.warn('Failed to generate application cover letter', error);
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: 'Could not generate the cover letter right now. Please try again.',
        });
      } finally {
        setIsGeneratingCoverLetter(false);
      }
    };

    const handleSave = async () => {
        if (!title || !company || !appliedDate) {
             toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out all required fields (Job Title, Company, and Applied Date).',
            });
            return;
        }

        const applicationData = {
            job_title: title,
            company_name: company,
            job_link: link,
            job_description: description,
            resume_id: resumeId || null,
            cover_letter_id: generatedCoverLetterDraft ? null : (coverLetterId || null),
            status: status,
            applied_date: appliedDate,
            generated_cover_letter: generatedCoverLetterDraft,
        };

        setIsSaving(true);
        try {
          await onSave(applicationData);
          toast({
              title: 'Success!',
              description: `Application for ${title} at ${company} has been saved.`,
          });
          onOpenChange(false);
        } catch (error) {
          logger.warn('Failed to save application from sheet', error);
        } finally {
          setIsSaving(false);
        }
    };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{application ? 'Edit Application' : 'Add New Application'}</SheetTitle>
          <SheetDescription>
            Track a new job application. Fill in the details below.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-6">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="job-title" className="text-right">
              Job Title
            </Label>
            <Input
              id="job-title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                clearGeneratedCoverLetter();
              }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company-name" className="text-right">
              Company
            </Label>
            <Input
              id="company-name"
              value={company}
              onChange={(e) => {
                setCompany(e.target.value);
                clearGeneratedCoverLetter();
              }}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="job-link" className="text-right">
              Job Link
            </Label>
            <Input id="job-link" value={link} onChange={(e) => setLink(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="job-description" className="text-right pt-2">
              Description
            </Label>
            <Textarea
              id="job-description"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                clearGeneratedCoverLetter();
              }}
              className="col-span-3"
              placeholder="Optional job description"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="resume" className="text-right">
              Resume Used <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Select
              value={resumeId || "none"}
              onValueChange={(value) => {
                setResumeId(value === "none" ? undefined : value);
                clearGeneratedCoverLetter();
              }}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a resume (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No resume selected</SelectItem>
                {resumes.map((resume) => (
                  <SelectItem key={resume.resume_id} value={resume.resume_id}>
                    {resume.resume_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cover-letter" className="text-right">
              Cover Letter Used <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Select
              value={coverLetterId || "none"}
              onValueChange={(value) => {
                setCoverLetterId(value === "none" ? undefined : value);
                clearGeneratedCoverLetter();
              }}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a cover letter (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No cover letter selected</SelectItem>
                {coverLetters.map((coverLetter) => (
                  <SelectItem key={coverLetter.cover_letter_id} value={coverLetter.cover_letter_id}>
                    {coverLetter.cover_letter_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {!application && (
            <div className="col-span-4 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-medium">Generate Cover Letter From Template</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a sample template and generate a tailored cover letter only when you click generate.
                  </p>
                </div>
                {generatedCoverLetterDraft && (
                  <Badge variant="secondary">Ready to attach</Badge>
                )}
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cover-letter-template" className="text-right">
                    Template
                  </Label>
                  <Select
                    value={templateId || 'none'}
                    onValueChange={(value) => {
                      setTemplateId(value === 'none' ? undefined : value);
                      clearGeneratedCoverLetter();
                    }}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No template selected</SelectItem>
                      {templateOptions.map((template) => (
                        <SelectItem key={template.cover_letter_id} value={template.cover_letter_id}>
                          {template.cover_letter_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button type="button" variant="outline" onClick={handleGenerateCoverLetter} disabled={isGeneratingCoverLetter}>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isGeneratingCoverLetter ? 'Generating...' : 'Generate Cover Letter'}
                  </Button>
                </div>

                {generatedCoverLetterDraft && (
                  <div className="space-y-2">
                    <Label>Generated Cover Letter Preview</Label>
                    <ScrollArea className="h-52 rounded-lg border border-border/60 bg-background p-3">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                        {generatedCoverLetterDraft.generated_text}
                      </pre>
                    </ScrollArea>
                    <p className="text-sm text-muted-foreground">
                      This generated cover letter will be saved and linked to this application when you click `Save Application`.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value) => setStatus(value as JobApplicationStatus)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="applied-date" className="text-right">
              Applied Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'col-span-3 justify-start text-left font-normal',
                    !appliedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {appliedDate ? format(appliedDate, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={appliedDate}
                  onSelect={setAppliedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isGeneratingCoverLetter}>
            {isSaving ? 'Saving...' : 'Save Application'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
