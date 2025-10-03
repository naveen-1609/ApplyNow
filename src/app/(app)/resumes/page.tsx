'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ResumeCard } from '@/components/resumes/resume-card';
import { UploadResumeDialog } from '@/components/resumes/upload-resume-dialog';
import { mockResumes } from '@/lib/mock-data';

export default function ResumesPage() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume Directory"
        description="Manage all your resumes in one place."
      >
        <Button onClick={() => setIsUploadOpen(true)}>
          <PlusCircle className="mr-2" />
          Upload Resume
        </Button>
      </PageHeader>

      {mockResumes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mockResumes.map((resume) => (
            <ResumeCard key={resume.resume_id} resume={resume} />
          ))}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed">
          <h3 className="text-lg font-medium">No resumes yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload your first resume to get started.
          </p>
          <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
            Upload Resume
          </Button>
        </div>
      )}

      <UploadResumeDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
      />
    </div>
  );
}
