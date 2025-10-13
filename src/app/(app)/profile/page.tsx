'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { ProfileCard } from '@/components/profile/ProfileCard';
import { LinksPanel } from '@/components/profile/LinksPanel';
import { NotesSidebar } from '@/components/profile/NotesSidebar';
import { NoteEditor } from '@/components/profile/NoteEditor';
import { ErrorBoundary } from '@/components/error-boundary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User
} from 'lucide-react';
import { type UserProfile } from '@/lib/firestore/profile';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { testFirebaseConnection, testNotesConnection } from '@/lib/firebase-test';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Testing...');

  // Test Firebase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      if (!user) return;
      
      try {
        console.log('🔍 Testing Firebase connection...');
        const connectionTest = await testFirebaseConnection();
        
        if (connectionTest.success) {
          setConnectionStatus('✅ Connected');
          console.log('✅ Firebase connection successful');
          
          // Test notes specifically
          const notesTest = await testNotesConnection(user.uid);
          if (notesTest.success) {
            console.log('✅ Notes connection successful');
          } else {
            console.error('❌ Notes connection failed:', notesTest.error);
            setConnectionStatus('⚠️ Notes connection failed');
          }
        } else {
          setConnectionStatus('❌ Connection failed');
          console.error('❌ Firebase connection failed:', connectionTest.error);
        }
      } catch (error) {
        setConnectionStatus('❌ Test failed');
        console.error('❌ Connection test error:', error);
      }
    };

    testConnection();
  }, [user]);


  const handleProfileSave = useCallback((updatedProfile: UserProfile) => {
    setProfile(updatedProfile);
  }, []);

  const handleNoteSelect = useCallback((noteId: string | null) => {
    setSelectedNoteId(noteId);
  }, []);

  const handleNewNote = useCallback(() => {
    // This will be handled by the NotesSidebar component
  }, []);

  const handleNoteUpdate = useCallback((note: any) => {
    // Handle note updates if needed
  }, []);


  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-2">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information, links, and notes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {user.email}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {connectionStatus}
          </Badge>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile & Links */}
        <div className="lg:col-span-1 space-y-6">
          <ErrorBoundary>
            <ProfileCard onSave={handleProfileSave} />
          </ErrorBoundary>
          <ErrorBoundary>
            <LinksPanel onSave={handleProfileSave} />
          </ErrorBoundary>
        </div>

        {/* Right Column - Notes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
            {/* Notes Sidebar */}
            <div className="xl:col-span-1">
              <ErrorBoundary>
                <NotesSidebar
                  selectedNoteId={selectedNoteId}
                  onNoteSelect={handleNoteSelect}
                  onNewNote={handleNewNote}
                />
              </ErrorBoundary>
            </div>
            
            {/* Note Editor */}
            <div className="xl:col-span-2">
              <ErrorBoundary>
                <NoteEditor
                  noteId={selectedNoteId}
                  onNoteUpdate={handleNoteUpdate}
                />
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">S</kbd>
              <span className="text-muted-foreground">Save note</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd>
              <span className="text-muted-foreground">Insert link</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Shift</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">P</kbd>
              <span className="text-muted-foreground">New note</span>
            </div>
            <div className="flex items-center space-x-2">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd>
              <span>+</span>
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Enter</kbd>
              <span className="text-muted-foreground">Add tag</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
