'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Save, 
  Share, 
  Share2, 
  Pin, 
  PinOff, 
  Tag, 
  Plus,
  X,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Code,
  Link,
  Heading1,
  Heading2,
  Heading3,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { 
  getNote, 
  updateNote, 
  toggleNoteSharing,
  type Note 
} from '@/lib/firestore/notes';
import { useToast } from '@/hooks/use-toast';

interface NoteEditorProps {
  noteId: string | null;
  onNoteUpdate?: (note: Note) => void;
}

export function NoteEditor({ noteId, onNoteUpdate }: NoteEditorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [pinned, setPinned] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Load note when noteId changes
  useEffect(() => {
    const loadNote = async () => {
      if (!user || !noteId) {
        setNote(null);
        setTitle('');
        setContent('');
        setTags([]);
        setPinned(false);
        setShared(false);
        setShareUrl('');
        return;
      }
      
      try {
        setLoading(true);
        const noteData = await getNote(user.uid, noteId);
        
        if (noteData) {
          setNote(noteData);
          setTitle(noteData.title);
          setContent(noteData.content);
          setTags(noteData.tags);
          setPinned(noteData.pinned);
          setShared(noteData.shared);
          setShareUrl(noteData.shared ? `${window.location.origin}/shared/${noteData.shareToken}` : '');
        }
      } catch (error) {
        console.error('Error loading note:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load note',
        });
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [user, noteId, toast]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (title: string, content: string, tags: string[], pinned: boolean) => {
      if (!user || !noteId) return;
      
      try {
        setSaving(true);
        await updateNote(user.uid, noteId, {
          title,
          content,
          tags,
          pinned,
        });
        
        // Update local note state
        if (note) {
          const updatedNote = {
            ...note,
            title,
            content,
            tags,
            pinned,
            updatedAt: Date.now(),
          };
          setNote(updatedNote);
          onNoteUpdate?.(updatedNote);
        }
        
        toast({
          title: 'Saved',
          description: 'Note updated successfully',
        });
      } catch (error) {
        console.error('Error saving note:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save note',
        });
      } finally {
        setSaving(false);
      }
    }, 700),
    [user, noteId, note, onNoteUpdate, toast]
  );

  // Auto-save when content changes
  useEffect(() => {
    if (noteId && (title !== note?.title || content !== note?.content || 
        JSON.stringify(tags) !== JSON.stringify(note?.tags) || pinned !== note?.pinned)) {
      debouncedSave(title, content, tags, pinned);
    }
  }, [title, content, tags, pinned, noteId, note, debouncedSave]);

  const handleTogglePin = async () => {
    const newPinned = !pinned;
    setPinned(newPinned);
    
    if (noteId) {
      await debouncedSave(title, content, tags, newPinned);
    }
  };

  const handleToggleShare = async () => {
    if (!user || !noteId) return;
    
    try {
      const newShared = !shared;
      const token = await toggleNoteSharing(user.uid, noteId, newShared);
      
      setShared(newShared);
      if (newShared && token) {
        setShareUrl(`${window.location.origin}/shared/${token}`);
        toast({
          title: 'Shared',
          description: 'Note is now publicly accessible',
        });
      } else {
        setShareUrl('');
        toast({
          title: 'Unshared',
          description: 'Note is no longer public',
        });
      }
    } catch (error) {
      console.error('Error toggling share:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update sharing settings',
      });
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      addTag();
    }
  };

  // Markdown formatting functions
  const insertFormatting = (before: string, after: string = '') => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newText);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  };

  const insertAtCursor = (text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const newText = content.substring(0, start) + text + content.substring(start);
    setContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const getWordCount = () => {
    return content.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = () => {
    return content.length;
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!noteId) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No note selected</h3>
            <p className="text-muted-foreground">
              Select a note from the sidebar to start editing
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <span>Note Editor</span>
            {saving && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Save className="w-3 h-3 animate-spin" />
                Saving...
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant={pinned ? "default" : "outline"}
              onClick={handleTogglePin}
              title={pinned ? "Unpin note" : "Pin note"}
            >
              {pinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant={shared ? "default" : "outline"}
              onClick={handleToggleShare}
              title={shared ? "Stop sharing" : "Share note"}
            >
              {shared ? <Share2 className="w-4 h-4" /> : <Share className="w-4 h-4" />}
            </Button>
            
            <Button
              size="sm"
              variant={showPreview ? "default" : "outline"}
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide preview" : "Show preview"}
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        {/* Title Input */}
        <Input
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-lg font-semibold"
        />
        
        {/* Tags */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Tags</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button size="sm" onClick={addTag}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="w-3 h-3 cursor-pointer" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0">
        <div className="h-full flex flex-col">
          {/* Toolbar */}
          <div className="border-b p-3">
            <div className="flex items-center space-x-1 flex-wrap">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('# ', '')}
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('## ', '')}
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('### ', '')}
                title="Heading 3"
              >
                <Heading3 className="w-4 h-4" />
              </Button>
              
              <div className="w-px h-6 bg-border mx-1" />
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('**', '**')}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('*', '*')}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('`', '`')}
                title="Code"
              >
                <Code className="w-4 h-4" />
              </Button>
              
              <div className="w-px h-6 bg-border mx-1" />
              
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('- ', '')}
                title="Bullet List"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('1. ', '')}
                title="Numbered List"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('> ', '')}
                title="Quote"
              >
                <Quote className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => insertFormatting('[', '](url)')}
                title="Link"
              >
                <Link className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Editor/Preview */}
          <div className="flex-1 p-4">
            {showPreview ? (
              <div className="h-full overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  {renderMarkdown(content)}
                </div>
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                placeholder="Start writing your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-full resize-none border-0 focus:ring-0 text-sm leading-relaxed"
                style={{ minHeight: '400px' }}
              />
            )}
          </div>
          
          {/* Footer */}
          <div className="border-t p-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                <span>{getWordCount()} words</span>
                <span>{getCharCount()} characters</span>
              </div>
              
              {shared && shareUrl && (
                <div className="flex items-center space-x-2">
                  <span>Shared:</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                  >
                    Copy link
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Simple markdown renderer
function renderMarkdown(content: string): JSX.Element {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  
  lines.forEach((line, index) => {
    if (line.startsWith('# ')) {
      elements.push(<h1 key={index} className="text-2xl font-bold mb-2">{line.substring(2)}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={index} className="text-xl font-semibold mb-2">{line.substring(3)}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={index} className="text-lg font-medium mb-2">{line.substring(4)}</h3>);
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic mb-2">{line.substring(2)}</blockquote>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(<li key={index} className="ml-4 mb-1">{line.substring(2)}</li>);
    } else if (line.match(/^\d+\. /)) {
      elements.push(<li key={index} className="ml-4 mb-1">{line.replace(/^\d+\. /, '')}</li>);
    } else if (line.trim()) {
      elements.push(<p key={index} className="mb-2">{line}</p>);
    } else {
      elements.push(<br key={index} />);
    }
  });
  
  return <div>{elements}</div>;
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
