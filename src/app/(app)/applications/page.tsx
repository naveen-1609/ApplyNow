'use client';

import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { endOfDay, format, parseISO, startOfDay } from 'date-fns';
import { CalendarRange, Download, LayoutGrid, List, PlusCircle, X } from 'lucide-react';
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

function escapeCsvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function toBoundaryDate(value: string, boundary: 'start' | 'end') {
  if (!value) {
    return null;
  }

  const parsedDate = parseISO(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return boundary === 'start' ? startOfDay(parsedDate) : endOfDay(parsedDate);
}

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
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

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

  const filteredApplications = useMemo(() => {
    const fromBoundary = toBoundaryDate(fromDate, 'start');
    const toBoundary = toBoundaryDate(toDate, 'end');

    return applications.filter((application) => {
      if (fromBoundary && application.applied_date < fromBoundary) {
        return false;
      }

      if (toBoundary && application.applied_date > toBoundary) {
        return false;
      }

      return true;
    });
  }, [applications, fromDate, toDate]);

  const isDateFilterActive = Boolean(fromDate || toDate);

  const handleClearDateFilter = () => {
    setFromDate('');
    setToDate('');
  };

  const handleExportApplications = () => {
    if (filteredApplications.length === 0) {
      return;
    }

    const csvRows = [
      [
        'Applied Date',
        'Company',
        'Job Title',
        'Status',
        'Job Link',
        'Resume Id',
        'Cover Letter Id',
        'Job Description',
      ].join(','),
      ...filteredApplications.map((application) =>
        [
          escapeCsvValue(format(application.applied_date, 'yyyy-MM-dd')),
          escapeCsvValue(application.company_name || ''),
          escapeCsvValue(application.job_title || ''),
          escapeCsvValue(application.status || ''),
          escapeCsvValue(application.job_link || ''),
          escapeCsvValue(application.resume_id || ''),
          escapeCsvValue(application.cover_letter_id || ''),
          escapeCsvValue(application.job_description || ''),
        ].join(',')
      ),
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const rangeSuffix = `${fromDate || 'all'}-to-${toDate || 'all'}`;

    link.href = url;
    link.download = `applications-${rangeSuffix}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Job Applications"
        description={
          loading
            ? 'Loading applications...'
            : isDateFilterActive
              ? `Showing ${filteredApplications.length} of ${applications.length} applications in the selected date range.`
              : `You have tracked ${applications.length} applications.`
        }
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
      <>
      <div className="rounded-xl border border-border/60 bg-card/40 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="applications-from-date">From</Label>
              <Input
                id="applications-from-date"
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applications-to-date">To</Label>
              <Input
                id="applications-to-date"
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={handleClearDateFilter} disabled={!isDateFilterActive}>
                <X className="mr-2 h-4 w-4" />
                Clear
              </Button>
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleExportApplications} disabled={filteredApplications.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarRange className="h-4 w-4" />
            <span>{filteredApplications.length} applications match this range</span>
          </div>
        </div>
      </div>
      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid"><LayoutGrid className="mr-2 h-4 w-4" />Grid View</TabsTrigger>
          <TabsTrigger value="list"><List className="mr-2 h-4 w-4" />List View</TabsTrigger>
        </TabsList>
        <TabsContent value="grid" className="mt-6">
          <ApplicationGridView applications={filteredApplications} onEdit={handleEditApplication} />
        </TabsContent>
        <TabsContent value="list" className="mt-6">
          <OptimizedApplicationListView applications={filteredApplications} onEdit={handleEditApplication} onDelete={handleDeleteApplication} resumes={resumes} coverLetters={coverLetters} />
        </TabsContent>
      </Tabs>
      </>
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
