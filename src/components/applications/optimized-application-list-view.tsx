'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import type { JobApplication, JobApplicationStatus, Resume, CoverLetter } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { VirtualList } from '@/components/ui/virtual-list';
import { useVirtualListPerformance } from '@/components/ui/virtual-list';

const statusStyles: Record<JobApplicationStatus, string> = {
    Applied: 'border-blue-500/50 bg-blue-500/10 text-blue-300',
    Interviewing: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
    Offer: 'border-green-500/50 bg-green-500/10 text-green-300',
    Rejected: 'border-red-500/50 bg-red-500/10 text-red-300',
    Ghosted: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
};

interface OptimizedApplicationListViewProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (jobId: string) => void;
  resumes?: Resume[];
  coverLetters?: CoverLetter[];
}

export function OptimizedApplicationListView({ 
  applications, 
  onEdit, 
  onDelete, 
  resumes = [],
  coverLetters = []
}: OptimizedApplicationListViewProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);
  const { shouldVirtualize, setItemCount } = useVirtualListPerformance();

  // Update item count for virtualization decision
  useMemo(() => {
    setItemCount(applications.length);
  }, [applications.length, setItemCount]);

  // Sort applications once
  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => b.applied_date.getTime() - a.applied_date.getTime());
  }, [applications]);

  const getResumeName = (resumeId: string | null) => {
    if (!resumeId) return 'No resume';
    return resumes.find(r => r.resume_id === resumeId)?.resume_name || 'N/A';
  };

  const getCoverLetterName = (coverLetterId: string | null) => {
    if (!coverLetterId) return 'No cover letter';
    return coverLetters.find(cl => cl.cover_letter_id === coverLetterId)?.cover_letter_name || 'N/A';
  };
  
  const handleDeleteClick = (jobId: string) => {
    setApplicationToDelete(jobId);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (applicationToDelete) {
        onDelete(applicationToDelete);
    }
    setIsDeleteDialogOpen(false);
    setApplicationToDelete(null);
  };

  // Render individual application row
  const renderApplicationRow = (app: JobApplication, index: number) => (
    <TableRow key={app.job_id}>
      <TableCell className="font-medium">
        <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
          {app.job_title}
        </a>
      </TableCell>
      <TableCell>{app.company_name}</TableCell>
      <TableCell className="hidden lg:table-cell">{getResumeName(app.resume_id)}</TableCell>
      <TableCell className="hidden lg:table-cell">{getCoverLetterName(app.cover_letter_id)}</TableCell>
      <TableCell>{format(app.applied_date, 'MMM d, yyyy')}</TableCell>
      <TableCell>
        <Badge variant="outline" className={statusStyles[app.status]}>
          {app.status}
        </Badge>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(app)}>View Details / Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClick(app.job_id)}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );

  if (shouldVirtualize) {
    return (
      <>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Job Title</TableHead>
                <TableHead>Company</TableHead>
                <TableHead className="hidden lg:table-cell">Resume Used</TableHead>
                <TableHead className="hidden lg:table-cell">Cover Letter Used</TableHead>
                <TableHead>Applied Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
          </Table>
          <VirtualList
            items={sortedApplications}
            itemHeight={60} // Approximate row height
            containerHeight={400} // Fixed container height
            renderItem={renderApplicationRow}
            overscan={5}
            className="border-t"
          />
        </div>
        
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the application.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Regular table for smaller datasets
  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job Title</TableHead>
              <TableHead>Company</TableHead>
              <TableHead className="hidden lg:table-cell">Resume Used</TableHead>
              <TableHead className="hidden lg:table-cell">Cover Letter Used</TableHead>
              <TableHead>Applied Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedApplications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No applications found.
                </TableCell>
              </TableRow>
            ) : (
              sortedApplications.map(renderApplicationRow)
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
