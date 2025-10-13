'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, List, LayoutGrid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OptimizedApplicationListView } from '@/components/applications/optimized-application-list-view';
import { ApplicationGridView } from '@/components/applications/application-grid-view';
import { AddApplicationSheet } from '@/components/applications/add-application-sheet';
import type { JobApplication, CreateJobApplicationData, UpdateJobApplicationData } from '@/lib/types';
import { useAuth } from '@/hooks/use-optimized-auth';
import { useOptimizedApplications } from '@/hooks/use-optimized-applications';
import { useOptimizedResumes } from '@/hooks/use-optimized-resumes';
import { addApplication, updateApplication, deleteApplication } from '@/lib/services/applications';
import { Skeleton } from '@/components/ui/skeleton';
import { CompactFastLoader } from '@/components/ui/fast-loader';

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

  const handleSaveApplication = async (appData: CreateJobApplicationData | UpdateJobApplicationData) => {
    if (!user) return;

    try {
      if (editingApplication) {
        // Optimistic update for existing application
        const updatedApp: JobApplication = {
          ...editingApplication,
          ...appData,
          last_updated: new Date()
        };
        optimisticUpdateExisting(updatedApp);
        
        // Update in background
        await updateApplication(user.uid, editingApplication.job_id, appData as UpdateJobApplicationData);
      } else {
        // Create new application optimistically
        const newApp: JobApplication = {
          job_id: `temp_${Date.now()}`, // Temporary ID
          user_id: user.uid,
          company_name: appData.company_name || '',
          job_title: appData.job_title || '',
          job_link: appData.job_link || '',
          job_description: appData.job_description || '',
          resume_id: appData.resume_id || null,
          status: appData.status || 'Applied',
          applied_date: appData.applied_date || new Date(),
          last_updated: new Date()
        };
        optimisticUpdate(newApp);
        
        // Create in background and update with real ID
        const realId = await addApplication(user.uid, appData as CreateJobApplicationData);
        
        // Update with real ID (remove temp and add with real ID)
        optimisticDelete(newApp.job_id);
        const realApp: JobApplication = {
          ...newApp,
          job_id: realId
        };
        optimisticUpdate(realApp);
      }
    } catch (error) {
        console.error("Failed to save application", error);
        // Revert optimistic update on error
        await refetch();
    }
  };

  const handleDeleteApplication = async (jobId: string) => {
      if (!user) return;
      
      // Optimistic delete
      optimisticDelete(jobId);
      
      try {
          await deleteApplication(user.uid, jobId);
      } catch (error) {
          console.error("Failed to delete application", error);
          // Revert optimistic delete on error
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
          <OptimizedApplicationListView applications={applications} onEdit={handleEditApplication} onDelete={handleDeleteApplication} resumes={resumes} />
        </TabsContent>
      </Tabs>
      )}
      
      <AddApplicationSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        application={editingApplication}
        onSave={handleSaveApplication}
        resumes={resumes}
      />
    </div>
  );
}
