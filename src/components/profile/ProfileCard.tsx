'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Edit3, 
  Check, 
  X,
  Camera,
  Save
} from 'lucide-react';
import { useAuth } from '@/hooks/use-optimized-auth';
import { 
  getUserProfile, 
  updateUserProfile, 
  validateEmail, 
  validatePhone,
  type UserProfile 
} from '@/lib/firestore/profile';
import { useToast } from '@/hooks/use-toast';

interface ProfileCardProps {
  onSave?: (profile: UserProfile) => void;
}

export function ProfileCard({ onSave }: ProfileCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const profileData = await getUserProfile(user.uid);
        
        if (profileData) {
          setProfile(profileData);
        } else {
          // Create default profile
          const defaultProfile: UserProfile = {
            name: user.displayName || '',
            headline: '',
            email: user.email || '',
            phone: '',
            location: '',
            photoUrl: user.photoURL || '',
            portfolioUrl: '',
            linkedinUrl: '',
            githubUrl: '',
            customLinks: [],
            updatedAt: Date.now(),
          };
          setProfile(defaultProfile);
        }
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
          description: 'Profile updated successfully',
        });
      } catch (error) {
        console.error('Error saving profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to save profile',
        });
      } finally {
        setSaving(false);
      }
    }, 700),
    [user, profile, onSave, toast]
  );

  const startEditing = (field: string, currentValue: string) => {
    setEditing(field);
    setEditValue(currentValue);
    setErrors({});
  };

  const cancelEditing = () => {
    setEditing(null);
    setEditValue('');
    setErrors({});
  };

  const validateField = (field: string, value: string): boolean => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'email':
        if (value && !validateEmail(value)) {
          newErrors.email = 'Please enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (value && !validatePhone(value)) {
          newErrors.phone = 'Please enter a valid phone number';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else {
          delete newErrors.name;
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveField = async (field: string) => {
    if (!validateField(field, editValue)) {
      return;
    }
    
    await debouncedSave(field, editValue);
    setEditing(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveField(field);
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Failed to load profile</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Profile
          {saving && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Save className="w-3 h-3 animate-spin" />
              Saving...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile.photoUrl} alt={profile.name} />
              <AvatarFallback>
                {profile.name ? profile.name.charAt(0).toUpperCase() : <User className="w-6 h-6" />}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-1 -right-1 w-6 h-6 p-0"
              onClick={() => startEditing('photoUrl', profile.photoUrl)}
            >
              <Camera className="w-3 h-3" />
            </Button>
          </div>
          
          <div className="flex-1 space-y-3">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Name</label>
              {editing === 'name' ? (
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'name')}
                    className={errors.name ? 'border-red-500' : ''}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => saveField('name')}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-md -m-2"
                  onClick={() => startEditing('name', profile.name)}
                >
                  <span className="text-lg font-semibold">{profile.name || 'Click to add name'}</span>
                  <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
            </div>

            {/* Headline */}
            <div>
              <label className="text-sm font-medium text-muted-foreground">Headline</label>
              {editing === 'headline' ? (
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, 'headline')}
                    placeholder="e.g., Software Engineer, Product Manager"
                  />
                  <Button size="sm" onClick={() => saveField('headline')}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-md -m-2"
                  onClick={() => startEditing('headline', profile.headline)}
                >
                  <span className="text-muted-foreground">{profile.headline || 'Click to add headline'}</span>
                  <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
          
          {/* Email */}
          <div className="flex items-center space-x-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            {editing === 'email' ? (
              <div className="flex items-center space-x-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'email')}
                  className={errors.email ? 'border-red-500' : ''}
                  type="email"
                  autoFocus
                />
                <Button size="sm" onClick={() => saveField('email')}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-md -m-2 flex-1"
                onClick={() => startEditing('email', profile.email)}
              >
                <span>{profile.email || 'Click to add email'}</span>
                <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          {errors.email && <p className="text-sm text-red-500 ml-7">{errors.email}</p>}

          {/* Phone */}
          <div className="flex items-center space-x-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            {editing === 'phone' ? (
              <div className="flex items-center space-x-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'phone')}
                  className={errors.phone ? 'border-red-500' : ''}
                  type="tel"
                  autoFocus
                />
                <Button size="sm" onClick={() => saveField('phone')}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-md -m-2 flex-1"
                onClick={() => startEditing('phone', profile.phone)}
              >
                <span>{profile.phone || 'Click to add phone'}</span>
                <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          {errors.phone && <p className="text-sm text-red-500 ml-7">{errors.phone}</p>}

          {/* Location */}
          <div className="flex items-center space-x-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            {editing === 'location' ? (
              <div className="flex items-center space-x-2 flex-1">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, 'location')}
                  placeholder="e.g., San Francisco, CA"
                  autoFocus
                />
                <Button size="sm" onClick={() => saveField('location')}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={cancelEditing}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div 
                className="flex items-center justify-between group cursor-pointer hover:bg-muted/50 p-2 rounded-md -m-2 flex-1"
                onClick={() => startEditing('location', profile.location)}
              >
                <span>{profile.location || 'Click to add location'}</span>
                <Edit3 className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
        </div>
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
