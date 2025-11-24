import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Scale,
  CheckCircle,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

// Define the form validation schema
const lawyerRequestSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().min(10, { message: 'Valid phone number is required' }),
  scamType: z.enum(['phone', 'email', 'business'], {
    required_error: 'Please select a scam type',
  }),
  description: z.string().min(20, { message: 'Please provide at least 20 characters describing your situation' }),
  location: z.string().min(2, { message: 'Location is required' }),
  financialLoss: z.string().optional(),
  urgencyLevel: z.enum(['low', 'medium', 'high'], {
    required_error: 'Please select an urgency level',
  }),
  preferredContact: z.enum(['email', 'phone', 'either'], {
    required_error: 'Please select your preferred contact method',
  }),
  scamReportId: z.number().optional(),
  termsAccepted: z.boolean()
    .refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
});

type LawyerRequestFormValues = z.infer<typeof lawyerRequestSchema>;

interface LawyerConnectionFormProps {
  scamReportId?: number;
  scamType?: 'phone' | 'email' | 'business';
  prefilledDescription?: string;
}

export default function LawyerConnectionForm({ 
  scamReportId, 
  scamType = 'phone',
  prefilledDescription = ''
}: LawyerConnectionFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scamReport, setScamReport] = useState<any>(null);
  
  // Initialize form
  const form = useForm<LawyerRequestFormValues>({
    resolver: zodResolver(lawyerRequestSchema),
    defaultValues: {
      fullName: user?.displayName || '',
      email: user?.email || '',
      phone: '',
      scamType: scamType,
      description: prefilledDescription,
      location: '',
      financialLoss: '',
      urgencyLevel: 'medium',
      preferredContact: 'email',
      scamReportId: scamReportId,
      termsAccepted: false,
    },
  });

  // Fetch scam report details if scamReportId is provided
  useEffect(() => {
    const fetchScamReportDetails = async () => {
      if (scamReportId) {
        try {
          const response = await fetch(`/api/scam-reports/${scamReportId}`);
          if (response.ok) {
            const reportData = await response.json();
            setScamReport(reportData);
            
            // Create a prefilled description based on the scam report
            let scamDescription = `I recently reported a ${reportData.scamType} scam. `;
            
            if (reportData.scamType === 'phone' && reportData.scamPhoneNumber) {
              scamDescription += `The scam involved phone number ${reportData.scamPhoneNumber}. `;
            } else if (reportData.scamType === 'email' && reportData.scamEmail) {
              scamDescription += `The scam involved email address ${reportData.scamEmail}. `;
            } else if (reportData.scamType === 'business' && reportData.scamBusinessName) {
              scamDescription += `The scam involved a business called ${reportData.scamBusinessName}. `;
            }
            
            scamDescription += `${reportData.description}`;
            
            // Update the form with the scam report information
            form.setValue('description', scamDescription);
            form.setValue('scamType', reportData.scamType);
            
            // Use city and state if available, otherwise use location for backward compatibility
            const locationStr = reportData.city && reportData.state 
              ? `${reportData.city}, ${reportData.state}` 
              : reportData.country || 'USA';
            
            form.setValue('location', locationStr);
          }
        } catch (error) {
          console.error('Error fetching scam report:', error);
        }
      }
    };
    
    fetchScamReportDetails();
  }, [scamReportId, form]);

  // Handle form submission
  const onSubmit = async (data: LawyerRequestFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Add the user ID if the user is logged in
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (user) {
        headers['X-User-ID'] = user.id.toString();
      }
      
      // Send the request data to the server
      const response = await fetch('/api/lawyer-requests', {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit lawyer request');
      }
      
      // Show success state
      setIsSuccess(true);
      toast({
        title: "Request Submitted",
        description: "Your request for legal assistance has been submitted successfully.",
      });
    } catch (error) {
      console.error('Error submitting lawyer request:', error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "There was an error submitting your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle />
            Request Submitted Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Thank You for Your Request</h2>
            <p className="text-muted-foreground max-w-lg">
              Your request for legal assistance has been submitted successfully.
              A qualified lawyer will contact you soon using your preferred contact method.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                What Happens Next
              </h3>
              <ul className="space-y-2 text-sm">
                <li>Your request is being processed</li>
                <li>A lawyer will be assigned to your case</li>
                <li>You'll be contacted within 1-2 business days</li>
                <li>The initial consultation will be scheduled</li>
              </ul>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Important Information
              </h3>
              <ul className="space-y-2 text-sm">
                <li>Check your email and spam folder</li>
                <li>Have any relevant documentation ready</li>
                <li>Prepare a timeline of events</li>
                <li>Write down any questions you have</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="outline" onClick={() => window.location.href = "/"}>
            Return to Home
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Scale />
          Connect with a Lawyer
        </CardTitle>
        <CardDescription className="text-primary-foreground/90">
          Get professional legal help for your scam situation
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3">
          <div className="flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-medium text-amber-800">Free Case Evaluation</h3>
            <p className="text-sm text-amber-700">
              Many of our partner lawyers offer free initial consultations to evaluate your case.
              Your information is confidential and will only be shared with verified legal professionals.
            </p>
          </div>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Your Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="City, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="preferredContact"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Preferred Contact Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="email" />
                          </FormControl>
                          <FormLabel className="font-normal">Email</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="phone" />
                          </FormControl>
                          <FormLabel className="font-normal">Phone</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="either" />
                          </FormControl>
                          <FormLabel className="font-normal">Either</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Case Information</h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="scamType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scam Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select scam type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="phone">Phone Scam</SelectItem>
                          <SelectItem value="email">Email Scam</SelectItem>
                          <SelectItem value="business">Business Scam</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="urgencyLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low - General Information</SelectItem>
                          <SelectItem value="medium">Medium - Need Help Soon</SelectItem>
                          <SelectItem value="high">High - Urgent Situation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="financialLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Financial Loss Amount (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Approximate amount lost" {...field} />
                    </FormControl>
                    <FormDescription>
                      This helps lawyers understand the scope of your case
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Describe Your Situation</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Please provide details about your situation, when it happened, and what you need help with..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Include relevant details to help lawyers understand your case better
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="termsAccepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 bg-muted">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I agree to the terms and conditions
                    </FormLabel>
                    <FormDescription>
                      By submitting this form, I agree that my information will be shared with legal professionals
                      in the BeAware network. I understand this is not establishing an attorney-client relationship
                      until I explicitly agree to engage with a specific lawyer.
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="min-w-[150px]"
              >
                {isSubmitting ? "Submitting..." : "Connect with a Lawyer"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}