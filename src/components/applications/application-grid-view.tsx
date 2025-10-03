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
import { format, formatDistanceToNow } from 'date-fns';
import type { JobApplication, JobApplicationStatus } from '@/lib/types';
import { Button } from '../ui/button';
import { ExternalLink } from 'lucide-react';

const statusStyles: Record<JobApplicationStatus, string> = {
    Applied: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-300',
    Interviewing: 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300',
    Offer: 'border-green-500/50 bg-green-500/10 text-green-300',
    Rejected: 'border-red-500/50 bg-red-500/10 text-red-300',
    Ghosted: 'border-gray-500/50 bg-gray-500/10 text-gray-400',
};

function ApplicationCard({ application, onCardClick }: { application: JobApplication, onCardClick: (app: JobApplication) => void; }) {
    return (
        <Card onClick={() => onCardClick(application)} className="cursor-pointer hover:border-primary/50 transition-colors">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-lg leading-tight">{application.job_title}</CardTitle>
                    <Badge variant="outline" className={statusStyles[application.status]}>{application.status}</Badge>
                </div>
                <CardDescription>{application.company_name}</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {application.job_description || "No description provided."}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Applied {formatDistanceToNow(application.applied_date, { addSuffix: true })}</span>
                <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                    <a href={application.job_link} target="_blank" rel="noopener noreferrer">
                        View Job <ExternalLink className="ml-2 h-3 w-3" />
                    </a>
                </Button>
            </CardFooter>
        </Card>
    )
}

export function ApplicationGridView({ applications, onEdit }: { applications: JobApplication[], onEdit: (app: JobApplication) => void; }) {
    const groupedApps = applications.reduce((acc, app) => {
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
        {applications.length === 0 ? (
            <p className="text-center text-muted-foreground">You haven't added any applications yet.</p>
        ) : sortedGroups.map(date => (
            <div key={date}>
                <h2 className="mb-4 font-semibold text-muted-foreground">{format(new Date(date), 'EEEE, MMMM d')}</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupedApps[date].map(app => (
                        <ApplicationCard key={app.job_id} application={app} onCardClick={onEdit} />
                    ))}
                </div>
            </div>
        ))}
    </div>
  );
}
