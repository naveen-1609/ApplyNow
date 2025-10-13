'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ResumeCard } from '@/components/resumes/resume-card';
import { UploadResumeDialog } from '@/components/resumes/upload-resume-dialog';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useOptimizedResumes } from '@/hooks/use-optimized-resumes';
import { deleteResume, updateResumeText } from '@/lib/services/resumes';
import { Skeleton } from '@/components/ui/skeleton';
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
        description="Manage all your resumes in one place."
      >
        <Button onClick={() => setIsUploadOpen(true)}>
          <PlusCircle className="mr-2" />
          Upload Resume
        </Button>
      </PageHeader>

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
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
