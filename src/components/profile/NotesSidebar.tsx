'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, 
  Plus, 
  Pin, 
  PinOff, 
  Trash2, 
  Star,
  FileText,
  Tag,
  Filter,
  X
} from 'lucide-react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { 
  getUserNotes, 
  createNote, 
  deleteNote, 
  searchNotes,
  filterNotesByTags,
  type Note 
} from '@/lib/firestore/notes';
import { useToast } from '@/hooks/use-toast';
import { TemplateGallery } from './TemplateGallery';

interface NotesSidebarProps {
  selectedNoteId: string | null;
  onNoteSelect: (noteId: string | null) => void;
  onNewNote: () => void;
}

export function NotesSidebar({ selectedNoteId, onNoteSelect, onNewNote }: NotesSidebarProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  // Load notes
  useEffect(() => {
    const loadNotes = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userNotes = await getUserNotes(user.uid);
        setNotes(userNotes);
        setFilteredNotes(userNotes);
        
        // Extract unique tags
        const tags = new Set<string>();
        userNotes.forEach(note => {
          note.tags.forEach(tag => tags.add(tag));
        });
        setAvailableTags(Array.from(tags).sort());
      } catch (error) {
        console.error('Error loading notes:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load notes',
        });
      } finally {
        setLoading(false);
      }
    };

    loadNotes();
  }, [user, toast]);

  // Filter notes based on search and tags
  useEffect(() => {
    const filterNotes = async () => {
      if (!user) return;
      
      try {
        let filtered = notes;
        
        // Apply search filter
        if (searchTerm.trim()) {
          filtered = await searchNotes(user.uid, searchTerm);
        }
        
        // Apply tag filter
        if (selectedTags.length > 0) {
          filtered = await filterNotesByTags(user.uid, selectedTags);
          // If we have both search and tags, intersect the results
          if (searchTerm.trim()) {
            const searchResults = await searchNotes(user.uid, searchTerm);
            filtered = filtered.filter(note => 
              searchResults.some(searchNote => searchNote.id === note.id)
            );
          }
        }
        
        setFilteredNotes(filtered);
      } catch (error) {
        console.error('Error filtering notes:', error);
      }
    };

    filterNotes();
  }, [notes, searchTerm, selectedTags, user]);

  const handleCreateNote = async () => {
    if (!user) return;
    
    try {
      const newNote = await createNote(user.uid, {
        title: 'Untitled Note',
        content: '',
        tags: [],
        pinned: false,
      });
      
      // Reload notes
      const updatedNotes = await getUserNotes(user.uid);
      setNotes(updatedNotes);
      
      // Select the new note
      onNoteSelect(newNote);
      onNewNote();
      
      toast({
        title: 'Created',
        description: 'New note created',
      });
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create note',
      });
    }
  };

  const handleCreateFromTemplate = async (template: any) => {
    if (!user) return;
    
    try {
      const newNote = await createNote(user.uid, {
        title: template.title,
        content: template.content,
        tags: template.tags,
        pinned: false,
      });
      
      // Reload notes
      const updatedNotes = await getUserNotes(user.uid);
      setNotes(updatedNotes);
      
      // Select the new note
      onNoteSelect(newNote);
      onNewNote();
      
      setShowTemplateGallery(false);
      
      toast({
        title: 'Created',
        description: 'Note created from template',
      });
    } catch (error) {
      console.error('Error creating note from template:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create note from template',
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!user) return;
    
    try {
      await deleteNote(user.uid, noteId);
      
      // Reload notes
      const updatedNotes = await getUserNotes(user.uid);
      setNotes(updatedNotes);
      
      // Clear selection if deleted note was selected
      if (selectedNoteId === noteId) {
        onNoteSelect(null);
      }
      
      toast({
        title: 'Deleted',
        description: 'Note moved to trash',
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete note',
      });
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
  };

  const pinnedNotes = filteredNotes.filter(note => note.pinned);
  const regularNotes = filteredNotes.filter(note => !note.pinned);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            Notes
            <div className="flex items-center space-x-1">
              <Button size="sm" variant="outline" onClick={() => setShowTemplateGallery(true)}>
                <FileText className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={handleCreateNote}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </CardTitle>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Tags</span>
                {(searchTerm || selectedTags.length > 0) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={clearFilters}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => toggleTag(tag)}
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full px-6">
            <div className="space-y-4">
              {/* Pinned Notes */}
              {pinnedNotes.length > 0 && (
                <div>
                  <div className="flex items-center space-x-2 mb-3">
                    <Pin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Pinned</span>
                  </div>
                  <div className="space-y-2">
                    {pinnedNotes.map((note) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        isSelected={selectedNoteId === note.id}
                        onSelect={() => onNoteSelect(note.id)}
                        onDelete={() => handleDeleteNote(note.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular Notes */}
              {regularNotes.length > 0 && (
                <div>
                  {pinnedNotes.length > 0 && (
                    <div className="flex items-center space-x-2 mb-3 mt-6">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">All Notes</span>
                    </div>
                  )}
                  <div className="space-y-2">
                    {regularNotes.map((note) => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        isSelected={selectedNoteId === note.id}
                        onSelect={() => onNoteSelect(note.id)}
                        onDelete={() => handleDeleteNote(note.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {filteredNotes.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    {searchTerm || selectedTags.length > 0 
                      ? 'No notes match your filters' 
                      : 'No notes yet'
                    }
                  </p>
                  {!searchTerm && selectedTags.length === 0 && (
                    <Button size="sm" onClick={handleCreateNote}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create your first note
                    </Button>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
      
      {/* Template Gallery Modal */}
      {showTemplateGallery && (
        <TemplateGallery
          onSelectTemplate={handleCreateFromTemplate}
          onClose={() => setShowTemplateGallery(false)}
        />
      )}
    </>
  );
}

interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function NoteItem({ note, isSelected, onSelect, onDelete }: NoteItemProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getPreview = (content: string) => {
    // Remove markdown formatting for preview
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
    
    return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText;
  };

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-primary text-primary-foreground border-primary' 
          : 'hover:bg-muted border-transparent'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className={`font-medium text-sm truncate ${isSelected ? 'text-primary-foreground' : ''}`}>
          {note.title || 'Untitled Note'}
        </h4>
        <div className="flex items-center space-x-1 ml-2">
          {note.pinned && (
            <Pin className="w-3 h-3 text-muted-foreground" />
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className={`h-6 w-6 p-0 ${isSelected ? 'text-primary-foreground hover:bg-primary-foreground/20' : ''}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      {note.content && (
        <p className={`text-xs mb-2 line-clamp-2 ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
          {getPreview(note.content)}
        </p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {note.tags.slice(0, 2).map((tag) => (
            <Badge
              key={tag}
              variant={isSelected ? "secondary" : "outline"}
              className="text-xs h-5"
            >
              {tag}
            </Badge>
          ))}
          {note.tags.length > 2 && (
            <span className={`text-xs ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
              +{note.tags.length - 2}
            </span>
          )}
        </div>
        <span className={`text-xs ${isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
          {formatDate(note.updatedAt)}
        </span>
      </div>
    </div>
  );
}