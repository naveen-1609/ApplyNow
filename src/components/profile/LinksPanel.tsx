'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Copy, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X,
  Link as LinkIcon,
  Globe
} from 'lucide-react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { 
  getUserProfile, 
  updateUserProfile,
  addCustomLink,
  updateCustomLink,
  removeCustomLink,
  validateUrl,
  type UserProfile 
} from '@/lib/firestore/profile';
import { useToast } from '@/hooks/use-toast';

interface LinksPanelProps {
  onSave?: (profile: UserProfile) => void;
}

interface LinkData {
  label: string;
  url: string;
}

export function LinksPanel({ onSave }: LinksPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editData, setEditData] = useState<LinkData>({ label: '', url: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showAddForm, setShowAddForm] = useState(false);

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const profileData = await getUserProfile(user.uid);
        setProfile(profileData);
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load profile data',
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, toast]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (field: string, value: string) => {
      if (!user || !profile) return;
      
      try {
        setSaving(true);
        await updateUserProfile(user.uid, { [field]: value });
        
        const updatedProfile = { ...profile, [field]: value, updatedAt: Date.now() };
        setProfile(updatedProfile);
        onSave?.(updatedProfile);
        
        toast({
          title: 'Saved',
          description: 'Link updated successfully',
        });
      } catch (error) {
        console.error('Error saving link:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save link',
        });
      } finally {
        setSaving(false);
      }
    }, 700),
    [user, profile, onSave, toast]
  );

  const startEditing = (field: string, currentValue: string) => {
    setEditing(field);
    setEditData({ label: '', url: currentValue });
    setErrors({});
  };

  const startEditingCustom = (index: number, link: LinkData) => {
    setEditing(`custom-${index}`);
    setEditData(link);
    setErrors({});
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditData({ label: '', url: '' });
    setErrors({});
    setShowAddForm(false);
  };

  const validateLink = (data: LinkData): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!data.label.trim()) {
      newErrors.label = 'Label is required';
    }
    
    if (!data.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!validateUrl(data.url)) {
      newErrors.url = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveField = async (field: string) => {
    if (!validateLink({ label: field, url: editData.url })) {
      return;
    }
    
    await debouncedSave(field, editData.url);
    setEditing(null);
    setEditData({ label: '', url: '' });
  };

  const saveCustomLink = async (index: number) => {
    if (!validateLink(editData)) {
      return;
    }
    
    try {
      setSaving(true);
      if (editing?.startsWith('custom-')) {
        await updateCustomLink(user!.uid, index, editData);
      } else {
        await addCustomLink(user!.uid, editData);
      }
      
      // Reload profile to get updated data
      const updatedProfile = await getUserProfile(user!.uid);
      setProfile(updatedProfile);
      onSave?.(updatedProfile!);
      
      toast({
        title: 'Saved',
        description: 'Link updated successfully',
      });
    } catch (error) {
      console.error('Error saving custom link:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save link',
      });
    } finally {
      setSaving(false);
      setEditing(null);
      setEditData({ label: '', url: '' });
      setShowAddForm(false);
    }
  };

  const deleteCustomLink = async (index: number) => {
    if (!user) return;
    
    try {
      setSaving(true);
      await removeCustomLink(user.uid, index);
      
      // Reload profile to get updated data
      const updatedProfile = await getUserProfile(user.uid);
      setProfile(updatedProfile);
      onSave?.(updatedProfile!);
      
      toast({
        title: 'Deleted',
        description: 'Link removed successfully',
      });
    } catch (error) {
      console.error('Error deleting link:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete link',
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
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

  const openLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const presetLinks = [
    { key: 'portfolioUrl', label: 'Portfolio' },
    { key: 'linkedinUrl', label: 'LinkedIn' },
    { key: 'githubUrl', label: 'GitHub' },
  ];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded flex-1"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Failed to load links</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Links
          {saving && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Saving...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Links */}
        {presetLinks.map((link) => {
          const value = profile[link.key as keyof UserProfile] as string;
          const isEditing = editing === link.key;
          
          return (
            <div key={link.key} className="flex items-center space-x-3">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium w-20">{link.label}</span>
              
              {isEditing ? (
                <div className="flex items-center space-x-2 flex-1">
                  <Input
                    value={editData.url}
                    onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                    placeholder={`Enter ${link.label} URL`}
                    className={errors.url ? 'border-red-500' : ''}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => saveField(link.key)}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 flex-1">
                  {value ? (
                    <>
                      <span 
                        className="text-blue-600 hover:text-blue-800 cursor-pointer flex-1 truncate"
                        onClick={() => openLink(value)}
                        title={value}
                      >
                        {value}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(value)}
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openLink(value)}
                        title="Open link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-muted-foreground flex-1">Not set</span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(link.key, value)}
                    title={`Edit ${link.label}`}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Links */}
        {profile.customLinks && profile.customLinks.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-medium text-muted-foreground">Custom Links</h4>
            {profile.customLinks.map((link, index) => {
              const isEditing = editing === `custom-${index}`;
              
              return (
                <div key={index} className="flex items-center space-x-3">
                  <LinkIcon className="w-4 h-4" />
                  <span className="text-sm font-medium w-20 truncate">{link.label}</span>
                  
                  {isEditing ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <Input
                        value={editData.label}
                        onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                        placeholder="Label"
                        className={errors.label ? 'border-red-500' : ''}
                        autoFocus
                      />
                      <Input
                        value={editData.url}
                        onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                        placeholder="URL"
                        className={errors.url ? 'border-red-500' : ''}
                      />
                      <Button size="sm" onClick={() => saveCustomLink(index)}>
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={cancelEditing}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 flex-1">
                      <span 
                        className="text-blue-600 hover:text-blue-800 cursor-pointer flex-1 truncate"
                        onClick={() => openLink(link.url)}
                        title={link.url}
                      >
                        {link.url}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(link.url)}
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openLink(link.url)}
                        title="Open link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditingCustom(index, link)}
                        title="Edit link"
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCustomLink(index)}
                        title="Delete link"
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Custom Link */}
        {showAddForm ? (
          <div className="pt-4 border-t">
            <div className="flex items-center space-x-2">
              <Input
                value={editData.label}
                onChange={(e) => setEditData({ ...editData, label: e.target.value })}
                placeholder="Link label"
                className={errors.label ? 'border-red-500' : ''}
              />
              <Input
                value={editData.url}
                onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                placeholder="https://example.com"
                className={errors.url ? 'border-red-500' : ''}
              />
              <Button size="sm" onClick={() => saveCustomLink(-1)}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={cancelEditing}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {(errors.label || errors.url) && (
              <div className="mt-2 space-y-1">
                {errors.label && <p className="text-sm text-red-500">{errors.label}</p>}
                {errors.url && <p className="text-sm text-red-500">{errors.url}</p>}
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Link
          </Button>
        )}
      </CardContent>
    </Card>
  );
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