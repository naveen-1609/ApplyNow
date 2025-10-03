'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ResumeCard } from '@/components/resumes/resume-card';
import { UploadResumeDialog } from '@/components/resumes/upload-resume-dialog';
import { useAuth } from '@/hooks/use-auth';
import { getResumes, deleteResume, updateResumeText } from '@/lib/services/resumes';
import type { Resume } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function ResumesPage() {
  const { user } = useAuth();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchResumes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userResumes = await getResumes(user.uid);
      setResumes(userResumes);
    } catch (error) {
      console.error("Failed to fetch resumes", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);
  
  const handleUploadSuccess = () => {
      fetchResumes();
  };

  const handleDeleteResume = async (resumeId: string) => {
    if (!user) return;
    try {
        await deleteResume(user.uid, resumeId);
        fetchResumes();
    } catch (error) {
        console.error("Failed to delete resume", error);
    }
  };
  
  const handleUpdateResumeText = async (resumeId: string, newText: string) => {
    if (!user) return;
    try {
        await updateResumeText(user.uid, resumeId, newText);
        fetchResumes();
    } catch(error) {
        console.error("Failed to update resume text", error);
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-56" />)}
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
