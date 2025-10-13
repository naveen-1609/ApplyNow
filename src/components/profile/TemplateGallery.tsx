'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Mail, 
  Briefcase, 
  MessageSquare,
  Plus,
  X
} from 'lucide-react';

interface Template {
  id: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
  icon: React.ReactNode;
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
}

const templates: Template[] = [
  {
    id: 'resume-summary',
    title: 'Resume Summary',
    description: 'Professional summary for your resume',
    content: `# Professional Summary

Experienced [Your Role] with [X] years of expertise in [Key Skills]. Proven track record of [Key Achievements]. Passionate about [Your Passion/Interest] and committed to [Your Goal].

## Key Skills
- [Skill 1]
- [Skill 2]
- [Skill 3]

## Experience Highlights
- [Achievement 1]
- [Achievement 2]
- [Achievement 3]`,
    tags: ['resume', 'summary', 'professional'],
    icon: <FileText className="w-5 h-5" />,
  },
  {
    id: 'cover-letter-intro',
    title: 'Cover Letter Introduction',
    description: 'Strong opening paragraph for cover letters',
    content: `# Cover Letter Introduction

Dear [Hiring Manager's Name],

I am writing to express my strong interest in the [Job Title] position at [Company Name]. With [X] years of experience in [Relevant Field] and a proven track record of [Key Achievement], I am confident that I would be a valuable addition to your team.

## Why I'm Interested
- [Reason 1 - Company specific]
- [Reason 2 - Role specific]
- [Reason 3 - Personal growth]

## What I Bring
- [Unique Skill/Experience 1]
- [Unique Skill/Experience 2]
- [Unique Skill/Experience 3]`,
    tags: ['cover-letter', 'introduction', 'job-application'],
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: 'outreach-email',
    title: 'Networking Outreach',
    description: 'Professional networking email template',
    content: `# Networking Outreach Email

Subject: [Brief, specific subject line]

Hi [Name],

I hope this email finds you well. I came across your profile on [Platform] and was impressed by [Specific detail about their work/achievement].

## About Me
I'm a [Your Role] with experience in [Relevant Experience]. I'm particularly interested in [Specific Area] and noticed that you have extensive experience in this field.

## My Request
I would love to learn more about [Specific Topic] and would be grateful for a brief conversation about [Specific Question/Advice].

## Value Proposition
I'd be happy to share insights about [Your Expertise] or connect you with [Relevant Contact/Resource].

Would you be available for a 15-minute call this week or next?

Best regards,
[Your Name]`,
    tags: ['networking', 'outreach', 'email'],
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    id: 'project-description',
    title: 'Project Description',
    description: 'Template for describing projects and achievements',
    content: `# Project: [Project Name]

## Overview
[Brief description of the project, its purpose, and your role]

## Challenge
- [Problem 1]
- [Problem 2]
- [Problem 3]

## Solution
- [Solution 1]
- [Solution 2]
- [Solution 3]

## Technologies Used
- [Technology 1]
- [Technology 2]
- [Technology 3]

## Results
- [Quantifiable Result 1]
- [Quantifiable Result 2]
- [Quantifiable Result 3]

## Key Learnings
- [Learning 1]
- [Learning 2]
- [Learning 3]`,
    tags: ['project', 'portfolio', 'achievement'],
    icon: <Briefcase className="w-5 h-5" />,
  },
  {
    id: 'follow-up-email',
    title: 'Interview Follow-up',
    description: 'Thank you email after interviews',
    content: `# Interview Follow-up Email

Subject: Thank you for the [Interview Type] - [Position Title]

Dear [Interviewer's Name],

Thank you for taking the time to speak with me today about the [Position Title] role at [Company Name]. I enjoyed our conversation about [Specific Topic Discussed] and learning more about [Company/Team/Project].

## Key Takeaways
- [Insight 1 from the interview]
- [Insight 2 from the interview]
- [Insight 3 from the interview]

## Next Steps
I'm excited about the opportunity to [Specific Next Step] and look forward to hearing about the next steps in the process.

Please let me know if you need any additional information from me.

Best regards,
[Your Name]`,
    tags: ['interview', 'follow-up', 'thank-you'],
    icon: <Mail className="w-5 h-5" />,
  },
  {
    id: 'meeting-notes',
    title: 'Meeting Notes',
    description: 'Structured template for meeting notes',
    content: `# Meeting Notes: [Meeting Title]

**Date:** [Date]
**Time:** [Time]
**Attendees:** [List of attendees]

## Agenda
1. [Agenda Item 1]
2. [Agenda Item 2]
3. [Agenda Item 3]

## Discussion Points
### [Topic 1]
- [Key Point 1]
- [Key Point 2]

### [Topic 2]
- [Key Point 1]
- [Key Point 2]

## Decisions Made
- [Decision 1]
- [Decision 2]

## Action Items
- [ ] [Action Item 1] - [Owner] - [Due Date]
- [ ] [Action Item 2] - [Owner] - [Due Date]

## Next Meeting
- **Date:** [Date]
- **Time:** [Time]
- **Agenda:** [Brief agenda]`,
    tags: ['meeting', 'notes', 'organization'],
    icon: <FileText className="w-5 h-5" />,
  },
];

export function TemplateGallery({ onSelectTemplate, onClose }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Templates', count: templates.length },
    { id: 'resume', label: 'Resume', count: templates.filter(t => t.tags.includes('resume')).length },
    { id: 'cover-letter', label: 'Cover Letter', count: templates.filter(t => t.tags.includes('cover-letter')).length },
    { id: 'networking', label: 'Networking', count: templates.filter(t => t.tags.includes('networking')).length },
    { id: 'project', label: 'Project', count: templates.filter(t => t.tags.includes('project')).length },
    { id: 'interview', label: 'Interview', count: templates.filter(t => t.tags.includes('interview')).length },
  ];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.tags.includes(selectedCategory));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Choose a Template</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.label}
                <Badge variant="secondary" className="ml-2">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
          
          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {filteredTemplates.map((template) => (
              <Card 
                key={template.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      {template.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{template.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-1 mb-3">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded max-h-20 overflow-hidden">
                    {template.content.split('\n').slice(0, 3).join('\n')}...
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(template);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredTemplates.length === 0 && (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No templates found in this category</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
