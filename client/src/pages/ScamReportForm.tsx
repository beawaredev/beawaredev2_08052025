import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneIcon, MailIcon, BuildingIcon, CalendarIcon, FileIcon, UploadIcon, XIcon, FileTextIcon, ImageIcon } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { format } from 'date-fns';
import { LocationAutocompleteV2 } from '@/components/ui/location-autocomplete-v2';

// Simple validation schema
const formSchema = z.object({
  scamType: z.enum(['phone', 'email', 'business'], {
    required_error: 'Please select a scam type',
  }),
  scamPhoneNumber: z.string().optional().default(""),
  scamEmail: z.string().optional().default(""),
  scamBusinessName: z.string().optional().default(""),
  incidentDate: z.string().optional().default(() => new Date().toISOString().split('T')[0]),
  // Location fields
  country: z.string().default("USA"),
  city: z.string().min(1, 'City is required').default(""),
  state: z.string().min(1, 'State is required').default(""),
  zipCode: z.string().optional().default(""),
  description: z.string().min(5, 'Description must be at least 5 characters').default(""),
  connectWithLawyer: z.boolean().default(false),
  hasProofDocument: z.boolean().default(false),
  proofDocument: z.any().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ScamReportForm() {
  const [_, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Default values for the form
  const defaultValues: Partial<FormValues> = {
    scamType: 'phone',
    scamPhoneNumber: '',
    scamEmail: '',
    scamBusinessName: '',
    incidentDate: format(new Date(), 'yyyy-MM-dd'),
    country: 'USA',
    city: '',
    state: '',
    zipCode: '',
    description: '',
    connectWithLawyer: false,
    hasProofDocument: false,
    proofDocument: undefined,
  };
  
  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });
  
  // Watch for changes to scam type
  const scamType = form.watch('scamType');
  const connectWithLawyer = form.watch('connectWithLawyer');


  
  // Submit handler for the form
  const onSubmit = async (values: FormValues) => {
    setSubmissionAttempted(true);
    
    // Perform validation checks
    if (Object.keys(form.formState.errors).length > 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the form errors before submitting',
        variant: 'destructive',
      });
      return;
    }
    
    // Check authentication
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to submit a report',
        variant: 'destructive',
      });
      setLocation('/login');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Basic validation check
      if (!values.scamType) {
        throw new Error("Please select a scam type");
      }
      
      const result = await submitReport(values);
      
      // Show success message
      toast({
        title: 'Report Submitted',
        description: 'Your scam report has been submitted successfully'
      });
      
      // If lawyer connection was requested and handled by the submission
      if (values.connectWithLawyer && result?.report?.id) {
        setLocation(`/legal-help?scamReportId=${result.report.id}&scamType=${values.scamType}`);
      } else {
        // Otherwise go to reports page
        setLocation('/reports');
      }
    } catch (error) {
      toast({
        title: 'Submission Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper method for submission (with file upload support)
  const submitReport = async (values: FormValues) => {
    const apiUrl = getApiUrl('scam-reports');
    
    // Handle file upload if a file is selected
    if (selectedFile) {
      // Create FormData for multipart submission
      const formData = new FormData();
      
      // Add the file with the correct field name to match server middleware
      formData.append('proofFile', selectedFile);
      
      // Add all form fields directly to the formData
      formData.append('scamType', values.scamType);
      formData.append('incidentDate', values.incidentDate);
      formData.append('country', values.country || 'USA');
      formData.append('city', values.city);
      formData.append('state', values.state);
      formData.append('zipCode', values.zipCode || '');
      formData.append('description', values.description);
      
      if (values.scamPhoneNumber) formData.append('scamPhoneNumber', values.scamPhoneNumber);
      if (values.scamEmail) formData.append('scamEmail', values.scamEmail);
      if (values.scamBusinessName) formData.append('scamBusinessName', values.scamBusinessName);
      
      formData.append('connectWithLawyer', values.connectWithLawyer.toString());
      formData.append('hasProofDocument', 'true');
      
      // Make the fetch request with FormData
      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers: {
          'x-user-id': user!.id.toString(),
          'x-user-email': user!.email
        },
        body: formData
      });
      
      return handleResponse(response);
    } else {
      // Standard JSON submission without file
      const reportData = {
        scamType: values.scamType,
        incidentDate: values.incidentDate,
        country: values.country || 'USA',
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        description: values.description,
        scamPhoneNumber: values.scamPhoneNumber || "",
        scamEmail: values.scamEmail || "",
        scamBusinessName: values.scamBusinessName || "",
        connectWithLawyer: values.connectWithLawyer,
        hasProofDocument: false
      };
      
      // Make the fetch request
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user!.id.toString(),
          'x-user-email': user!.email
        },
        body: JSON.stringify(reportData)
      });
      
      return handleResponse(response);
    }
  };
  
  // Helper to handle the response
  const handleResponse = async (response: Response) => {
    
    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle file upload not implemented error specifically
      if (response.status === 501) {
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }
        throw new Error(errorData.message || "File upload is not currently supported");
      }
      
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse as JSON, fall back to text if it fails
    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { success: true, message: responseText };
    }
    
    return data;
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">

      
      {user ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="scamType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">What type of scam did you experience?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="phone" id="phone" />
                            <PhoneIcon className="h-4 w-4 text-primary mr-1" />
                            <FormLabel htmlFor="phone" className="font-normal cursor-pointer">Phone</FormLabel>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="email" id="email" />
                            <MailIcon className="h-4 w-4 text-primary mr-1" />
                            <FormLabel htmlFor="email" className="font-normal cursor-pointer">Email</FormLabel>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="business" id="business" />
                            <BuildingIcon className="h-4 w-4 text-primary mr-1" />
                            <FormLabel htmlFor="business" className="font-normal cursor-pointer">Business</FormLabel>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 space-y-6">
                {/* Phone Number Field (shown when scamType === 'phone') */}
                {scamType === 'phone' && (
                  <FormField
                    control={form.control}
                    name="scamPhoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter the scam phone number" 
                            {...field} 
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Email Field (shown when scamType === 'email') */}
                {scamType === 'email' && (
                  <FormField
                    control={form.control}
                    name="scamEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter the scam email address" 
                            type="email"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Business Name Field (shown when scamType === 'business') */}
                {scamType === 'business' && (
                  <FormField
                    control={form.control}
                    name="scamBusinessName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter the fraudulent business name" 
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                {/* Date Field */}
                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>When did this scam occur?</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Location Field */}
                <FormField
                  control={form.control}
                  name="city"
                  render={() => (
                    <FormItem>
                      <FormLabel>Where did this scam occur? (U.S. locations only)</FormLabel>
                      <FormControl>
                        <LocationAutocompleteV2
                          onLocationSelected={(locationData) => {
                            form.setValue('city', locationData.city);
                            form.setValue('state', locationData.state);
                            form.setValue('zipCode', locationData.zipCode);
                            form.setValue('country', 'USA');
                          }}
                          defaultValue={{
                            city: form.watch('city'),
                            state: form.watch('state'),
                            zipCode: form.watch('zipCode')
                          }}
                        />
                      </FormControl>
                      {(form.formState.errors.city || form.formState.errors.state) && (
                        <p className="text-sm font-medium text-destructive">
                          Please select a valid location
                        </p>
                      )}
                    </FormItem>
                  )}
                />
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Please describe what happened in detail..." 
                          className="min-h-32" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Provide as much detail as possible about the scam
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                
{/* File Upload - One Step Process */}
                <FormField
                  control={form.control}
                  name="proofDocument"
                  render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Upload Proof Document (Optional)</FormLabel>
                      <FormDescription>
                        Attach a PDF, JPEG, or PNG file (max 10MB) as evidence of the scam
                      </FormDescription>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Check file size (max 10MB)
                                if (file.size > 10 * 1024 * 1024) {
                                  toast({
                                    title: "File too large",
                                    description: "Please upload a file smaller than 10MB",
                                    variant: "destructive"
                                  });
                                  e.target.value = '';
                                  return;
                                }
                                setSelectedFile(file);
                                onChange(file);
                                form.setValue('hasProofDocument', true);
                              }
                            }}
                          />
                          <Button 
                            type="button" 
                            variant="outline"
                            className="w-full flex items-center justify-center gap-2"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <UploadIcon className="h-4 w-4" />
                            {selectedFile ? 'Change File' : 'Upload Document'}
                          </Button>
                        </div>
                        
                        {selectedFile && (
                          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                              {selectedFile.type.includes('pdf') ? (
                                <FileTextIcon className="h-5 w-5 text-primary" />
                              ) : (
                                <ImageIcon className="h-5 w-5 text-primary" />
                              )}
                              <div className="text-sm truncate max-w-[240px]">
                                {selectedFile.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full"
                              onClick={() => {
                                setSelectedFile(null);
                                onChange(undefined);
                                form.setValue('hasProofDocument', false);
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              <XIcon className="h-4 w-4" />
                              <span className="sr-only">Remove file</span>
                            </Button>
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Lawyer Connection Option */}
                <div className="mt-6 p-4 bg-muted rounded-md">
                  <FormField
                    control={form.control}
                    name="connectWithLawyer"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={true}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-base font-medium flex items-center gap-2">
                            Connect with a lawyer about this scam
                            <span className="text-xs font-medium bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">Coming Soon</span>
                          </FormLabel>
                          <FormDescription>
                            This feature will soon allow you to be connected with a qualified lawyer who can help with legal advice or recovery options after submitting your report.
                          </FormDescription>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
              <CardFooter>
                {submissionAttempted && Object.keys(form.formState.errors).length > 0 && (
                  <div className="mb-4 text-red-500 text-sm">
                    <p>Please fix the following issues:</p>
                    <ul className="list-disc pl-5">
                      {Object.entries(form.formState.errors).map(([field, error]) => (
                        <li key={field}>{error?.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 sm:flex-none sm:w-auto"
                    onClick={() => setLocation('/reports')}
                  >
                    Cancel
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </form>
        </Form>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 border rounded-lg bg-muted/50">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-center mb-4">You need to be logged in to submit a scam report</p>
          <Button onClick={() => setLocation('/login')}>
            Log In
          </Button>
        </div>
      )}
    </div>
  );
}