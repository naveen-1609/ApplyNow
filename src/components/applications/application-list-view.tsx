'use client';

import { useState } from 'react';
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
import { mockJobApplications, mockResumes } from '@/lib/mock-data';
import type { JobApplication, JobApplicationStatus } from '@/lib/types';

const statusStyles: Record<JobApplicationStatus, string> = {
  Applied: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
  Interviewing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
  Offer: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  Ghosted: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export function ApplicationListView({ onEdit }: { onEdit: (app: JobApplication) => void; }) {
  // In a real app, this state would be managed by a library like TanStack Table
  const [applications, setApplications] = useState<JobApplication[]>(mockJobApplications);

  const getResumeName = (resumeId: string) => {
    return mockResumes.find(r => r.resume_id === resumeId)?.resume_name || 'N/A';
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead className="hidden md:table-cell">Company</TableHead>
            <TableHead className="hidden lg:table-cell">Resume Used</TableHead>
            <TableHead>Applied Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.sort((a,b) => b.applied_date.getTime() - a.applied_date.getTime()).map((app) => (
            <TableRow key={app.job_id}>
              <TableCell className="font-medium">
                <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-primary transition-colors">
                  {app.job_title}
                </a>
              </TableCell>
              <TableCell className="hidden md:table-cell">{app.company_name}</TableCell>
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
                    <DropdownMenuItem onClick={() => onEdit(app)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
