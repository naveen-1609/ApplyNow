'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Calendar, 
  Tag, 
  Share2, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { getSharedNote, type Note } from '@/lib/firestore/notes';
import { useToast } from '@/hooks/use-toast';
import { useParams } from 'next/navigation';

export default function SharedNotePage() {
  const params = useParams();
  const { toast } = useToast();
  const token = params.token as string;
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSharedNote = async () => {
      if (!token) {
        setError('Invalid share token');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const sharedNote = await getSharedNote(token);
        
        if (sharedNote) {
          setNote(sharedNote);
        } else {
          setError('Note not found or no longer shared');
        }
      } catch (error) {
        console.error('Error loading shared note:', error);
        setError('Failed to load note');
      } finally {
        setLoading(false);
      }
    };

    loadSharedNote();
  }, [token]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Copied',
        description: 'Link copied to clipboard',
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to copy link',
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardContent className="p-6 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Note Not Found</h1>
            <p className="text-muted-foreground mb-4">
              {error || 'This note may have been deleted or is no longer shared.'}
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{note.title || 'Untitled Note'}</CardTitle>
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Updated {formatDate(note.updatedAt)}</span>
                </div>
                
                {note.tags.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Tag className="w-4 h-4" />
                    <span>{note.tags.length} tag{note.tags.length !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyToClipboard}
                title="Copy link"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                title="Print note"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
          
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {note.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="prose prose-lg max-w-none">
            {renderMarkdown(note.content)}
          </div>
        </CardContent>
      </Card>
      
      {/* Footer */}
      <div className="text-center mt-6 text-sm text-muted-foreground">
        <p>This note was shared via Application Console</p>
      </div>
    </div>
  );
}

// Enhanced markdown renderer for shared notes
function renderMarkdown(content: string): JSX.Element {
  if (!content.trim()) {
    return <p className="text-muted-foreground italic">No content</p>;
  }
  
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inList = false;
  let listItems: string[] = [];
  
  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
          {listItems.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
    inList = false;
  };
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-3xl font-bold mb-4 mt-6 first:mt-0">
          {trimmedLine.substring(2)}
        </h1>
      );
    } else if (trimmedLine.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-2xl font-semibold mb-3 mt-5">
          {trimmedLine.substring(3)}
        </h2>
      );
    } else if (trimmedLine.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xl font-medium mb-2 mt-4">
          {trimmedLine.substring(4)}
        </h3>
      );
    } else if (trimmedLine.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote 
          key={index} 
          className="border-l-4 border-gray-300 pl-4 italic mb-4 text-gray-600"
        >
          {trimmedLine.substring(2)}
        </blockquote>
      );
    } else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      if (!inList) {
        flushList();
        inList = true;
      }
      listItems.push(trimmedLine.substring(2));
    } else if (trimmedLine.match(/^\d+\. /)) {
      if (!inList) {
        flushList();
        inList = true;
      }
      listItems.push(trimmedLine.replace(/^\d+\. /, ''));
    } else if (trimmedLine) {
      flushList();
      elements.push(
        <p key={index} className="mb-4 leading-relaxed">
          {formatInlineMarkdown(trimmedLine)}
        </p>
      );
    } else {
      flushList();
      elements.push(<br key={index} />);
    }
  });
  
  flushList();
  
  return <div>{elements}</div>;
}

// Format inline markdown (bold, italic, code, links)
function formatInlineMarkdown(text: string): JSX.Element {
  const parts: (string | JSX.Element)[] = [];
  let currentIndex = 0;
  
  // Handle bold text
  const boldRegex = /\*\*(.*?)\*\*/g;
  let match;
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index));
    }
    
    // Add the bold text
    parts.push(<strong key={match.index}>{match[1]}</strong>);
    currentIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }
  
  // Handle italic text
  const italicParts: (string | JSX.Element)[] = [];
  currentIndex = 0;
  
  parts.forEach((part, partIndex) => {
    if (typeof part === 'string') {
      const italicRegex = /\*(.*?)\*/g;
      let italicMatch;
      
      while ((italicMatch = italicRegex.exec(part)) !== null) {
        // Add text before the match
        if (italicMatch.index > currentIndex) {
          italicParts.push(part.substring(currentIndex, italicMatch.index));
        }
        
        // Add the italic text
        italicParts.push(<em key={`${partIndex}-${italicMatch.index}`}>{italicMatch[1]}</em>);
        currentIndex = italicMatch.index + italicMatch[0].length;
      }
      
      // Add remaining text
      if (currentIndex < part.length) {
        italicParts.push(part.substring(currentIndex));
      }
      currentIndex = 0;
    } else {
      italicParts.push(part);
    }
  });
  
  // Handle code
  const codeParts: (string | JSX.Element)[] = [];
  currentIndex = 0;
  
  italicParts.forEach((part, partIndex) => {
    if (typeof part === 'string') {
      const codeRegex = /`(.*?)`/g;
      let codeMatch;
      
      while ((codeMatch = codeRegex.exec(part)) !== null) {
        // Add text before the match
        if (codeMatch.index > currentIndex) {
          codeParts.push(part.substring(currentIndex, codeMatch.index));
        }
        
        // Add the code text
        codeParts.push(
          <code key={`${partIndex}-${codeMatch.index}`} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">
            {codeMatch[1]}
          </code>
        );
        currentIndex = codeMatch.index + codeMatch[0].length;
      }
      
      // Add remaining text
      if (currentIndex < part.length) {
        codeParts.push(part.substring(currentIndex));
      }
      currentIndex = 0;
    } else {
      codeParts.push(part);
    }
  });
  
  // Handle links
  const linkParts: (string | JSX.Element)[] = [];
  currentIndex = 0;
  
  codeParts.forEach((part, partIndex) => {
    if (typeof part === 'string') {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let linkMatch;
      
      while ((linkMatch = linkRegex.exec(part)) !== null) {
        // Add text before the match
        if (linkMatch.index > currentIndex) {
          linkParts.push(part.substring(currentIndex, linkMatch.index));
        }
        
        // Add the link
        linkParts.push(
          <a 
            key={`${partIndex}-${linkMatch.index}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {linkMatch[1]}
          </a>
        );
        currentIndex = linkMatch.index + linkMatch[0].length;
      }
      
      // Add remaining text
      if (currentIndex < part.length) {
        linkParts.push(part.substring(currentIndex));
      }
      currentIndex = 0;
    } else {
      linkParts.push(part);
    }
  });
  
  return <span>{linkParts}</span>;
}
