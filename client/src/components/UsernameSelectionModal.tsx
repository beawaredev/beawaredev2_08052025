import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api-helper';
import { getApiUrl } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  beawareUsername: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be no more than 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' })
});

type FormValues = z.infer<typeof formSchema>;
type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

interface UsernameSelectionModalProps {
  isOpen: boolean;
  onComplete: (username: string) => void;
  userEmail: string;
}

export default function UsernameSelectionModal({ isOpen, onComplete, userEmail }: UsernameSelectionModalProps) {
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [checkTimeoutId, setCheckTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      beawareUsername: '',
    },
  });

  // Function to check username availability
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    try {
      setUsernameStatus('checking');
      const response = await apiRequest(getApiUrl('auth/check-username'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameStatus('idle');
    }
  };

  // Debounced username checking
  const handleUsernameChange = (value: string) => {
    // Clear existing timeout
    if (checkTimeoutId) {
      clearTimeout(checkTimeoutId);
    }

    // Set new timeout for checking
    const timeoutId = setTimeout(() => {
      checkUsernameAvailability(value);
    }, 500); // 500ms delay

    setCheckTimeoutId(timeoutId);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (checkTimeoutId) {
        clearTimeout(checkTimeoutId);
      }
    };
  }, [checkTimeoutId]);

  async function onSubmit(values: FormValues) {
    if (usernameStatus !== 'available') {
      toast({
        title: "Username not available",
        description: "Please choose an available username.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Update user's BeAware username
      const response = await apiRequest(getApiUrl('auth/update-username'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          beawareUsername: values.beawareUsername,
        }),
      });

      if (response.ok) {
        toast({
          title: "Username saved!",
          description: `Your BeAware username "@${values.beawareUsername}" has been set.`,
        });
        onComplete(values.beawareUsername);
      } else {
        throw new Error('Failed to update username');
      }
    } catch (error) {
      console.error('Error updating username:', error);
      toast({
        title: "Error",
        description: "Failed to save username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Choose Your BeAware Username</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Welcome to BeAware! To protect your privacy, all reports use anonymous usernames. 
            Please choose your unique BeAware username.
          </p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="beawareUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>BeAware Username</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input 
                          placeholder="@username" 
                          {...field}
                          onChange={(e) => {
                            // Remove @ symbol if user types it
                            const value = e.target.value.replace(/^@/, '');
                            field.onChange(value);
                            handleUsernameChange(value);
                          }}
                          className={`pr-10 ${
                            usernameStatus === 'available' ? 'border-green-500' :
                            usernameStatus === 'taken' ? 'border-red-500' : ''
                          }`}
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {usernameStatus === 'checking' && (
                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                          )}
                          {usernameStatus === 'available' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {usernameStatus === 'taken' && (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </FormControl>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        This will be your anonymous identity on BeAware. Choose wisely!
                      </p>
                      {usernameStatus === 'available' && (
                        <p className="text-xs text-green-600">✓ Username is available!</p>
                      )}
                      {usernameStatus === 'taken' && (
                        <p className="text-xs text-red-600">✗ Username is already taken</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting || usernameStatus !== 'available'}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Setup
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}