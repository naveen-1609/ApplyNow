'use client';

import { useState, useEffect } from 'react';
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
// Removed duplicate imports - resumes now passed as prop
import type { JobApplication, JobApplicationStatus, Resume } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const statusStyles: Record<JobApplicationStatus, string> = {
    Applied: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
    Interviewing: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
    Offer: 'border-green-500/50 bg-green-500/10 text-green-300',
    Rejected: 'border-red-500/50 bg-red-500/10 text-red-300',
    Ghosted: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
};


export function ApplicationListView({ applications, onEdit, onDelete, resumes = [] }: { 
  applications: JobApplication[], 
  onEdit: (app: JobApplication) => void; 
  onDelete: (jobId: string) => void;
  resumes?: Resume[]; // Accept resumes as prop to avoid duplicate API calls
}) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [applicationToDelete, setApplicationToDelete] = useState<string | null>(null);

  const getResumeName = (resumeId: string | null) => {
    if (!resumeId) return 'No resume';
    return resumes.find(r => r.resume_id === resumeId)?.resume_name || 'N/A';
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

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="hidden lg:table-cell">Resume Used</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                You haven't added any applications yet.
              </TableCell>
            </TableRow>
          )}
          {applications.sort((a,b) => b.applied_date.getTime() - a.applied_date.getTime()).map((app) => (
            <TableRow key={app.job_id}>
              <TableCell className="font-medium">
                <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                  {app.job_title}
                </a>
              </TableCell>
              <TableCell>{app.company_name}</TableCell>
              <TableCell className="hidden lg:table-cell">{getResumeName(app.resume_id)}</TableCell>
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
          ))}
        </TableBody>
      </Table>
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
