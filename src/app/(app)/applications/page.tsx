'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, List, LayoutGrid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedApplicationListView } from '@/components/applications/optimized-application-list-view';
import { ApplicationGridView } from '@/components/applications/application-grid-view';
import { AddApplicationSheet } from '@/components/applications/add-application-sheet';
import type { JobApplication, CreateJobApplicationData, UpdateJobApplicationData, ApplicationSavePayload } from '@/lib/types';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useOptimizedApplications } from '@/hooks/use-optimized-applications';
import { useOptimizedResumes } from '@/hooks/use-optimized-resumes';
import { useCoverLetters } from '@/hooks/use-cover-letters';
import { addApplication, updateApplication, deleteApplication } from '@/lib/services/applications';
import { CompactFastLoader } from '@/components/ui/fast-loader';
import { logger } from '@/lib/utils/logger';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const { 
    applications, 
    loading, 
    refetch, 
    invalidateCache,
    optimisticUpdate,
    optimisticDelete,
    optimisticUpdateExisting
  } = useOptimizedApplications();
  
  const { resumes } = useOptimizedResumes();
  const { coverLetters, add: addCoverLetterToDirectory } = useCoverLetters();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);

  const handleAddApplication = () => {
    setEditingApplication(null);
    setIsSheetOpen(true);
  };

  const handleEditApplication = (app: JobApplication) => {
    setEditingApplication(app);
    setIsSheetOpen(true);
  };

  const handleSaveApplication = async (appData: ApplicationSavePayload) => {
    if (!user) return;

    try {
      const generatedDraft = appData.generated_cover_letter;
      let nextCoverLetterId = 'cover_letter_id' in appData ? appData.cover_letter_id || null : null;

      if (!editingApplication && generatedDraft) {
        nextCoverLetterId = await addCoverLetterToDirectory(
          `${appData.company_name || 'Company'} - ${appData.job_title || 'Role'} Cover Letter`,
          generatedDraft.generated_text,
          appData.company_name || undefined,
          appData.job_title || undefined
        );
      }

      const saveData = {
        ...appData,
        cover_letter_id: nextCoverLetterId,
      };
      delete (saveData as Partial<ApplicationSavePayload>).generated_cover_letter;

      if (editingApplication) {
        const updatedApp: JobApplication = {
          ...editingApplication,
          ...saveData,
          last_updated: new Date()
        };
        optimisticUpdateExisting(updatedApp);
        
        await updateApplication(user.uid, editingApplication.job_id, saveData as UpdateJobApplicationData);
      } else {
        const newApp: JobApplication = {
          job_id: `temp_${Date.now()}`,
          user_id: user.uid,
          company_name: saveData.company_name || '',
          job_title: saveData.job_title || '',
          job_link: saveData.job_link || '',
          job_description: saveData.job_description || '',
          resume_id: saveData.resume_id || null,
          cover_letter_id: saveData.cover_letter_id || null,
          status: saveData.status || 'Applied',
          applied_date: saveData.applied_date || new Date(),
          last_updated: new Date()
        };
        optimisticUpdate(newApp);
        
        const realId = await addApplication(user.uid, saveData as CreateJobApplicationData);
        
        optimisticDelete(newApp.job_id);
        const realApp: JobApplication = {
          ...newApp,
          job_id: realId
        };
        optimisticUpdate(realApp);
      }
    } catch (error) {
        logger.error('Failed to save application', error);
        await refetch();
        throw error;
    }
  };

  const handleDeleteApplication = async (jobId: string) => {
      if (!user) return;
      
      // Optimistic delete
      optimisticDelete(jobId);
      
      try {
          await deleteApplication(user.uid, jobId);
      } catch (error) {
          logger.error('Failed to delete application', error);
          await refetch();
      }
  }


  return (
    <div className="space-y-8">
      <PageHeader
        title="Job Applications"
        description={loading ? "Loading applications..." : `You have tracked ${applications.length} applications.`}
      >
        <Button onClick={handleAddApplication}>
          <PlusCircle className="mr-2" />
          Add Application
        </Button>
      </PageHeader>
      
      {loading ? (
        <div className="flex justify-center py-12">
              <CompactFastLoader />
        </div>
      ) : (
      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid"><LayoutGrid className="mr-2 h-4 w-4" />Grid View</TabsTrigger>
          <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />List View</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-6">
          <ApplicationGridView applications={applications} onEdit={handleEditApplication} />
        </TabsContent>
        <TabsContent value="list" className="mt-6">
          <OptimizedApplicationListView applications={applications} onEdit={handleEditApplication} onDelete={handleDeleteApplication} resumes={resumes} coverLetters={coverLetters} />
        </TabsContent>
      </Tabs>
      )}
      
      <AddApplicationSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        application={editingApplication}
        onSave={handleSaveApplication}
        resumes={resumes}
        coverLetters={coverLetters}
      />
    </div>
  );
}
