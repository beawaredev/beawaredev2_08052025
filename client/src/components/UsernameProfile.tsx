import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Edit3, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getApiUrl } from '@/lib/api';

interface UsernameProfileProps {
  user: {
    id: number;
    email: string;
    displayName: string;
    beawareUsername: string | null;
    hasChangedUsername?: boolean;
  };
  onUserUpdate: (updatedUser: any) => void;
}

export default function UsernameProfile({ user, onUserUpdate }: UsernameProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user.beawareUsername || '');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) {
      toast({
        title: "Invalid Username",
        description: "Username cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (newUsername === user.beawareUsername) {
      setIsEditing(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await apiRequest(getApiUrl('auth/change-username'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          newUsername: newUsername.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          // Update user data
          onUserUpdate(data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          toast({
            title: "Username Updated",
            description: `Your username has been changed to ${newUsername}`,
          });
          
          setIsEditing(false);
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Update Failed",
          description: errorData.message || "Failed to update username",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: "Update Error",
        description: "An error occurred while updating your username",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setNewUsername(user.beawareUsername || '');
    setIsEditing(false);
  };

  return (
    <div>
      {isEditing ? (
        <div className="space-y-3">
          <Input
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="Enter new username"
            disabled={isLoading}
          />
          <div className="flex space-x-2">
            <Button
              onClick={handleUsernameChange}
              disabled={isLoading}
              size="sm"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              Cancel
            </Button>
          </div>
          {!user.hasChangedUsername && (
            <p className="text-xs text-muted-foreground">
              You can change your username once. Choose carefully!
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user.beawareUsername || 'Not set'}</span>
          {!user.hasChangedUsername && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-primary hover:underline font-normal"
            >
              Edit
            </Button>
          )}
          {user.hasChangedUsername && (
            <span className="text-xs text-muted-foreground">(Change used)</span>
          )}
        </div>
      )}
    </div>
  );
}