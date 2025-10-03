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
    Applied: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
    Interviewing: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
    Offer: 'border-green-500/50 bg-green-500/10 text-green-300',
    Rejected: 'border-red-500/50 bg-red-500/10 text-red-300',
    Ghosted: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
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
