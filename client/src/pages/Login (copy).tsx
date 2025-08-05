import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { FcGoogle } from 'react-icons/fc';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon, ShieldAlertIcon } from 'lucide-react';

// Form validation schema
const formSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [firebaseAuthStatus, setFirebaseAuthStatus] = useState<'loading' | 'available' | 'error'>('loading');
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const { login, loginWithGoogle } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Check Firebase auth setup on component mount
  useEffect(() => {
    // Check if we just completed a Google login
    const googleLoginSuccess = localStorage.getItem('googleLoginSuccess');
    if (googleLoginSuccess === 'true') {
      console.log('Google login success detected, redirecting to dashboard');
      localStorage.removeItem('googleLoginSuccess');
      setLocation('/dashboard');
      return;
    }
    
    const checkFirebaseAuth = async () => {
      try {
        if (!import.meta.env.VITE_FIREBASE_API_KEY || 
            !import.meta.env.VITE_FIREBASE_PROJECT_ID || 
            !import.meta.env.VITE_FIREBASE_APP_ID) {
          setFirebaseAuthStatus('error');
          setFirebaseError('Missing Firebase configuration. Please check environment variables.');
          return;
        }
        
        // Check if we can access Firebase Auth
        const currentHost = window.location.hostname;
        console.log(`Checking Firebase Auth for domain: ${currentHost}`);
        
        if (auth) {
          // Firebase auth is available
          setFirebaseAuthStatus('available');
        } else {
          setFirebaseAuthStatus('error');
          setFirebaseError('Firebase auth is not initialized properly');
        }
      } catch (error) {
        console.error('Error checking Firebase auth:', error);
        setFirebaseAuthStatus('error');
        setFirebaseError(error instanceof Error ? error.message : 'Unknown Firebase auth error');
      }
    };
    
    checkFirebaseAuth();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setIsLoading(true);
      console.log(`Attempting login with email: ${values.email}`);
      
      // Call login function
      await login(values.email, values.password);
      
      // After login, get user from localStorage to verify role
      const userJson = localStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        console.log('Login successful, user data:', {
          id: userData.id, 
          email: userData.email,
          role: userData.role,
          displayName: userData.displayName
        });
        
        // If it's the admin user, navigate to admin panel directly
        if (userData.role === 'admin' && values.email === 'admin@scamreport.com') {
          console.log('Admin user detected, redirecting to admin panel');
          setLocation('/admin');
          return;
        }
      }
      
      // Default navigation
      setLocation('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  }
  
  async function handleGoogleSignIn() {
    try {
      setIsGoogleLoading(true);
      await loginWithGoogle();
      setLocation('/dashboard');
    } catch (error) {
      console.error('Google login error:', error);
    } finally {
      setIsGoogleLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center mb-4">
            <h1 className="text-2xl font-bold text-primary">BeAware</h1>
            <p className="text-xs text-muted-foreground">Powered by you</p>
          </div>
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Log in'}
              </Button>
            </form>
          </Form>

          <div className="mt-4">
            <Separator className="my-4" />
            
            <Button 
              variant="outline" 
              className="w-full mb-4 flex items-center justify-center gap-2"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? 'Logging in...' : (
                <>
                  <FcGoogle size={20} />
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                <a
                  href="/forgot-password"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Forgot your password?
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <a
                  href="/register"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Register
                </a>
              </p>
            </div>
          </div>
          
          {/* Firebase Auth Status */}
          {firebaseAuthStatus === 'error' && (
            <Alert variant="destructive" className="mt-4">
              <ShieldAlertIcon className="h-4 w-4" />
              <AlertTitle>Firebase Authentication Error</AlertTitle>
              <AlertDescription>
                {firebaseError || 'There was a problem with Firebase authentication configuration.'}
                <p className="text-xs mt-2">
                  Please ensure your Firebase project is correctly configured and that this domain
                  is added to the authorized domains in Firebase console.
                </p>
              </AlertDescription>
            </Alert>
          )}
          
          {firebaseAuthStatus === 'loading' && (
            <div className="mt-4 flex items-center justify-center p-4">
              <div className="animate-pulse">Checking authentication status...</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}