'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApplicationListView } from '@/components/applications/application-list-view';
import { ApplicationGridView } from '@/components/applications/application-grid-view';
import { AddApplicationSheet } from '@/components/applications/add-application-sheet';
import type { JobApplication } from '@/lib/types';
import { mockJobApplications } from '@/lib/mock-data';

export default function ApplicationsPage() {
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
  
  const handleSaveApplication = () => {
    // In a real app, you would handle the create/update logic here
  };


  return (
    <div className="space-y-8">
      <PageHeader
        title="Job Applications"
        description={`You have tracked ${mockJobApplications.length} applications.`}
      >
        <Button onClick={handleAddApplication}>
          <PlusCircle className="mr-2" />
          Add Application
        </Button>
      </PageHeader>

      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-6">
          <ApplicationGridView onEdit={handleEditApplication}/>
        </TabsContent>
        <TabsContent value="list" className="mt-6">
          <ApplicationListView onEdit={handleEditApplication} />
        </TabsContent>
      </Tabs>
      
      <AddApplicationSheet
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        application={editingApplication}
        onSave={handleSaveApplication}
      />
    </div>
  );
}
