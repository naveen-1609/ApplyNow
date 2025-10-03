'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockJobApplications, mockResumes } from '@/lib/mock-data';
import { format, formatDistanceToNow } from 'date-fns';
import type { JobApplication, JobApplicationStatus } from '@/lib/types';
import { Button } from '../ui/button';
import { ExternalLink } from 'lucide-react';

const statusStyles: Record<JobApplicationStatus, string> = {
  Applied: 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  Interviewing: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  Offer: 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400',
  Rejected: 'border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-400',
  Ghosted: 'border-gray-500/50 bg-gray-500/10 text-gray-700 dark:text-gray-400',
};

function ApplicationCard({ application }: { application: JobApplication }) {
    const getResumeName = (resumeId: string) => {
        return mockResumes.find(r => r.resume_id === resumeId)?.resume_name || 'N/A';
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-lg leading-tight">{application.job_title}</CardTitle>
                    <Badge variant="outline" className={statusStyles[application.status]}>{application.status}</Badge>
                </div>
                <CardDescription>{application.company_name}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {application.job_description}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Applied {formatDistanceToNow(application.applied_date, { addSuffix: true })}</span>
                <Button variant="ghost" size="sm" asChild>
                    <a href={application.job_link} target="_blank" rel="noopener noreferrer">
                        View Job <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    )
}

export function ApplicationGridView() {
    const groupedApps = mockJobApplications.reduce((acc, app) => {
        const date = format(app.applied_date, 'yyyy-MM-dd');
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(app);
        return acc;
    }, {} as Record<string, JobApplication[]>);

    const sortedGroups = Object.keys(groupedApps).sort().reverse();

  return (
    <div className="space-y-8">
        {sortedGroups.map(date => (
            <div key={date}>
                <h2 className="mb-4 font-semibold text-muted-foreground">{format(new Date(date), 'EEEE, MMMM d')}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedApps[date].map(app => (
                        <ApplicationCard key={app.job_id} application={app} />
                    ))}
                </div>
            </div>
        ))}
    </div>
  );
}
