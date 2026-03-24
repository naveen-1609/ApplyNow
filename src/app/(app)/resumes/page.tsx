'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileSearch, PlusCircle, TriangleAlert } from 'lucide-react';
import { ResumeCard } from '@/components/resumes/resume-card';
import { UploadResumeDialog } from '@/components/resumes/upload-resume-dialog';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useOptimizedResumes } from '@/hooks/use-optimized-resumes';
import { deleteResume, updateResumeText } from '@/lib/services/resumes';
import { CompactFastLoader } from '@/components/ui/fast-loader';
import type { Resume } from '@/lib/types';

export default function ResumesPage() {
  const { user } = useAuth();
  const { 
    resumes, 
    loading, 
    refetch, 
    invalidateCache,
    optimisticUpdate,
    optimisticDelete,
    optimisticUpdateExisting
  } = useOptimizedResumes();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const resumesNeedingReview = resumes.filter(
    (resume) =>
      !!resume.extraction_warning ||
      !resume.editable_text ||
      resume.editable_text.trim().length < 100
  ).length;
  const readyResumes = Math.max(resumes.length - resumesNeedingReview, 0);
  
  const handleUploadSuccess = () => {
      // Let the upload dialog handle optimistic updates
      invalidateCache();
      refetch();
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!user) return;
    
    // Optimistic delete
    optimisticDelete(resumeId);
    
    try {
        await deleteResume(user.uid, resumeId);
    } catch (error) {
        console.error("Failed to delete resume", error);
        // Revert optimistic delete on error
        await refetch();
    }
  };
  
  const handleUpdateResumeText = async (resumeId: string, newText: string) => {
    if (!user) return;
    
    // Find the resume to update optimistically
    const resumeToUpdate = resumes.find(r => r.resume_id === resumeId);
    if (resumeToUpdate) {
      const updatedResume: Resume = {
        ...resumeToUpdate,
        editable_text: newText
      };
      optimisticUpdateExisting(updatedResume);
    }
    
    try {
        await updateResumeText(user.uid, resumeId, newText);
    } catch(error) {
        console.error("Failed to update resume text", error);
        // Revert optimistic update on error
        await refetch();
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume Directory"
        description="Keep every version of your resume in one calm, searchable place and catch extraction issues before they affect AI matching."
      >
        <Button onClick={() => setIsUploadOpen(true)}>
          <PlusCircle className="mr-2" />
          Upload Resume
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-primary/12 p-2 text-primary">
              <FileSearch className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Stored resumes</p>
              <p className="text-2xl font-semibold text-foreground">{resumes.length}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Every upload stays ready for future applications and edits.</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/12 p-2 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ready for AI tools</p>
              <p className="text-2xl font-semibold text-foreground">{readyResumes}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">These resumes have enough extracted text for ATS and matching workflows.</p>
        </div>
        <div className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-2xl bg-yellow-500/12 p-2 text-yellow-300">
              <TriangleAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Need review</p>
              <p className="text-2xl font-semibold text-foreground">{resumesNeedingReview}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Open these cards and clean up extracted text before reusing them.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
              <CompactFastLoader />
        </div>
      ) : resumes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {resumes.map((resume) => (
            <ResumeCard 
                key={resume.resume_id} 
                resume={resume} 
                onDelete={handleDeleteResume}
                onSaveText={handleUpdateResumeText}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/50 px-6 text-center">
          <div className="mb-4 rounded-full bg-primary/12 p-4 text-primary">
            <FileSearch className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-medium">No resumes yet</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Upload your first PDF or Word resume and we&apos;ll extract the text so it&apos;s ready for ATS checks and tailored applications.
          </p>
          <Button className="mt-4" onClick={() => setIsUploadOpen(true)}>
            Upload Resume
          </Button>
        </div>
      )}

      <UploadResumeDialog
        isOpen={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
