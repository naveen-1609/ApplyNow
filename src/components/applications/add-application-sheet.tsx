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
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { JobApplication, JobApplicationStatus, CreateJobApplicationData, UpdateJobApplicationData, Resume } from '@/lib/types';
import { ALL_STATUSES } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getResumes } from '@/lib/services/resumes';
import { useAuth } from '@/hooks/use-auth';

type AddApplicationSheetProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  application?: JobApplication | null;
  onSave: (application: CreateJobApplicationData | UpdateJobApplicationData) => void;
};

export function AddApplicationSheet({
  isOpen,
  onOpenChange,
  application,
  onSave,
}: AddApplicationSheetProps) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [company, setCompany] = useState('');
    const [link, setLink] = useState('');
    const [description, setDescription] = useState('');
    const [resumeId, setResumeId] = useState<string>();
    const [status, setStatus] = useState<JobApplicationStatus>('Applied');
    const [appliedDate, setAppliedDate] = useState<Date | undefined>(new Date());
    const [resumes, setResumes] = useState<Resume[]>([]);
    
    useEffect(() => {
        const fetchResumes = async () => {
            if (user && isOpen) {
                const userResumes = await getResumes(user.uid);
                setResumes(userResumes);
                if (application) {
                    setTitle(application.job_title);
                    setCompany(application.company_name);
                    setLink(application.job_link);
                    setDescription(application.job_description);
                    setResumeId(application.resume_id);
                    setStatus(application.status);
                    setAppliedDate(application.applied_date);
                } else {
                    // Reset form for new application
                    setTitle('');
                    setCompany('');
                    setLink('');
                    setDescription('');
                    setResumeId(userResumes[0]?.resume_id);
                    setStatus('Applied');
                    setAppliedDate(new Date());
                }
            }
        };
        fetchResumes();
    }, [application, isOpen, user]);

    const handleSave = () => {
        if (!title || !company || !resumeId || !appliedDate) {
             toast({
                variant: 'destructive',
                title: 'Missing Fields',
                description: 'Please fill out all required fields.',
            });
            return;
        }

        const applicationData = {
            job_title: title,
            company_name: company,
            job_link: link,
            job_description: description,
            resume_id: resumeId,
            status: status,
            applied_date: appliedDate
        };

        onSave(applicationData);
        toast({
            title: 'Success!',
            description: `Application for ${title} at ${company} has been saved.`,
        });
        onOpenChange(false);
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
            <Input id="job-title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="company-name" className="text-right">
              Company
            </Label>
            <Input id="company-name" value={company} onChange={(e) => setCompany(e.target.value)} className="col-span-3" />
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
              value={description} onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Optional job description"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="resume" className="text-right">
              Resume Used
            </Label>
            <Select value={resumeId} onValueChange={setResumeId}>
              <SelectTrigger className="col-span-3">
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Application</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
