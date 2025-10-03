'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle, List, LayoutGrid } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApplicationListView } from '@/components/applications/application-list-view';
import { ApplicationGridView } from '@/components/applications/application-grid-view';
import { AddApplicationSheet } from '@/components/applications/add-application-sheet';
import type { JobApplication, CreateJobApplicationData, UpdateJobApplicationData } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { getApplications, addApplication, updateApplication, deleteApplication } from '@/lib/services/applications';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicationsPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingApplication, setEditingApplication] = useState<JobApplication | null>(null);

  const fetchApplications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userApplications = await getApplications(user.uid);
      setApplications(userApplications);
    } catch (error) {
      console.error("Failed to fetch applications", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

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
        // Update existing application
        await updateApplication(user.uid, editingApplication.job_id, appData as UpdateJobApplicationData);
      } else {
        // Create new application
        await addApplication(user.uid, appData as CreateJobApplicationData);
      }
      await fetchApplications(); // Refresh the list
    } catch (error) {
        console.error("Failed to save application", error);
    }
  };

  const handleDeleteApplication = async (jobId: string) => {
      if (!user) return;
      try {
          await deleteApplication(user.uid, jobId);
          await fetchApplications();
      } catch (error) {
          console.error("Failed to delete application", error);
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
        <div className="space-y-4">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-64 w-full" />
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
          <ApplicationListView applications={applications} onEdit={handleEditApplication} onDelete={handleDeleteApplication} />
        </TabsContent>
      </Tabs>
      )}
      
      <AddApplicationSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        application={editingApplication}
        onSave={handleSaveApplication}
      />
    </div>
  );
}
