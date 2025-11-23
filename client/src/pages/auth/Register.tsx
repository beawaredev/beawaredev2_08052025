import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FcGoogle } from 'react-icons/fc';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api-helper';
import { getApiUrl } from '@/lib/api';
import { signInWithGoogle } from '@/lib/firebase';

// Form validation schema
const formSchema = z.object({
  displayName: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  beawareUsername: z.string()
    .min(3, { message: 'Username must be at least 3 characters' })
    .max(20, { message: 'Username must be less than 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [checkTimeoutId, setCheckTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const { register, loginWithGoogle } = useAuth();
  const [_, setLocation] = useLocation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: '',
      beawareUsername: '',
      email: '',
      password: '',
      confirmPassword: '',
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
    try {
      setIsLoading(true);
      console.log('Submitting registration with values:', {
        email: values.email,
        displayName: values.displayName,
      });
      
      // Enhanced debugging for registration
      try {
        await register(values.email, values.password, values.displayName, values.beawareUsername);
        console.log('Registration successful');
        // Redirect to login after successful registration
        setLocation('/login');
      } catch (registerError) {
        console.error('Detailed registration error:', registerError);
        
        // Try to get more details about the error
        let errorMessage = "Registration failed. Please try again.";
        
        if (registerError instanceof Error) {
          errorMessage = registerError.message;
        } else if (typeof registerError === 'object' && registerError !== null) {
          errorMessage = JSON.stringify(registerError);
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Registration error:', error);
      // Display error to user
      form.setError("root", { 
        type: "manual",
        message: error instanceof Error ? error.message : "Registration failed. Please try again."
      });
      
      // Add a visible error message
      form.setError("email", {
        type: "manual",
        message: "There was a problem with registration. Please try again."
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleGoogleSignIn() {
    try {
      setIsGoogleLoading(true);
      console.log('Starting Google signup process...');
      
      const result = await signInWithGoogle();
      
      if (result && result.user) {
        console.log('Google auth successful, preparing signup data...');
        
        // Store Google user data for signup confirmation
        const googleUserData = {
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Google User',
          googleId: result.user.uid
        };
        
        localStorage.setItem('pendingGoogleSignup', JSON.stringify(googleUserData));
        localStorage.setItem('handlingGoogleSignup', 'true');
        
        console.log('Redirecting to signup confirmation...');
        setLocation('/google-signup-confirm');
      } else {
        console.log('Google auth completed but waiting for redirect...');
        // Set a flag to check for redirect result after page reload
        localStorage.setItem('awaitingGoogleSignup', 'true');
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      form.setError("root", { 
        type: "manual",
        message: error instanceof Error ? error.message : "Google sign-up failed. Please try again."
      });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Google Sign Up Option First */}
          <div className="space-y-4">
            <Button 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? 'Creating account...' : (
                <>
                  <FcGoogle size={20} />
                  <span>Sign up with Google</span>
                </>
              )}
            </Button>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">
                <strong>Auto-generated username:</strong> Get a unique random username like "brave_fox_123" that you can change once after signup.
              </p>
            </div>
          </div>

          <div className="my-6">
            <Separator className="my-4" />
            <div className="text-center">
              <span className="text-sm text-muted-foreground bg-background px-2">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email and Password Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </Form>

          <div className="mt-4">
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <a
                href="/login"
                className="underline underline-offset-4 hover:text-primary"
              >
                Log in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}