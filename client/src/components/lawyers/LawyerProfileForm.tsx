import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
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
  FileText,
  CheckCircle,
  BookOpen,
  Building,
  MapPin,
  Phone,
  Mail,
  Link as LinkIcon,
  Upload,
  DollarSign
} from 'lucide-react';

// Define the form validation schema
const lawyerProfileSchema = z.object({
  barNumber: z.string().min(2, { message: 'Bar number is required' }),
  yearsOfExperience: z.coerce.number().min(1, { message: 'Years of experience must be at least 1' }),
  firmName: z.string().optional(),
  primarySpecialization: z.enum(['consumer_fraud', 'identity_theft', 'financial_recovery', 'general_practice', 'cyber_crime'], {
    required_error: 'Please select a primary specialization',
  }),
  secondarySpecializations: z.array(z.enum(['consumer_fraud', 'identity_theft', 'financial_recovery', 'general_practice', 'cyber_crime'])).optional(),
  officeLocation: z.string().min(2, { message: 'Office location is required' }),
  officePhone: z.string().min(10, { message: 'Valid office phone is required' }),
  officeEmail: z.string().email({ message: 'Valid office email is required' }),
  bio: z.string().min(50, { message: 'Bio must be at least 50 characters' }).max(1000, { message: 'Bio must not exceed 1000 characters' }),
  profilePhotoUrl: z.string().url().optional().or(z.literal('')),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  acceptingNewClients: z.boolean().default(true),
  offersFreeConsultation: z.boolean().default(false),
  consultationFee: z.string().optional(),
  caseTypes: z.array(z.string()).min(1, { message: 'Please specify at least one case type' }),
  verificationDocumentPath: z.any().optional(), // This will be handled by file upload
  termsAccepted: z.boolean()
    .refine(val => val === true, {
      message: 'You must accept the terms and conditions',
    }),
});

type LawyerProfileFormValues = z.infer<typeof lawyerProfileSchema>;

export default function LawyerProfileForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  // Initialize form
  const form = useForm<LawyerProfileFormValues>({
    resolver: zodResolver(lawyerProfileSchema),
    defaultValues: {
      barNumber: '',
      yearsOfExperience: 0,
      firmName: '',
      primarySpecialization: 'consumer_fraud',
      secondarySpecializations: [],
      officeLocation: '',
      officePhone: '',
      officeEmail: '',
      bio: '',
      profilePhotoUrl: '',
      websiteUrl: '',
      acceptingNewClients: true,
      offersFreeConsultation: false,
      consultationFee: '',
      caseTypes: [],
      termsAccepted: false,
    },
  });

  const watchOffersFreeConsultation = form.watch('offersFreeConsultation');

  // Available case types for the checkbox group
  const caseTypes = [
    { id: 'consumer_fraud', label: 'Consumer Fraud' },
    { id: 'phone_scams', label: 'Phone Scams' },
    { id: 'email_scams', label: 'Email Scams' },
    { id: 'business_scams', label: 'Business Scams' },
    { id: 'identity_theft', label: 'Identity Theft' },
    { id: 'financial_scams', label: 'Financial Scams' },
    { id: 'cyber_crime', label: 'Cyber Crime' },
    { id: 'internet_scams', label: 'Internet Scams' },
    { id: 'recovery_services', label: 'Financial Recovery' },
  ];

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  // Handle form submission
  const onSubmit = async (data: LawyerProfileFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add all form fields to FormData
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'secondarySpecializations' || key === 'caseTypes') {
          // Convert arrays to JSON strings
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          // Convert booleans to strings
          formData.append(key, value.toString());
        } else if (value !== undefined && value !== null) {
          formData.append(key, value.toString());
        }
      });
      
      // Add the file if one was selected
      if (file) {
        formData.append('verificationDocument', file);
      }
      
      // Send the form data to the server
      const response = await fetch('/api/lawyer-profiles', {
        method: 'POST',
        headers: {
          'X-User-ID': '1', // Hardcoded for demo - would use actual user ID
          'X-User-Email': 'admin@scamreport.com', // Hardcoded for demo
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create lawyer profile');
      }
      
      // Show success state
      setIsSuccess(true);
      toast({
        title: "Profile Created",
        description: "Your lawyer profile has been submitted successfully and is now pending verification.",
      });
    } catch (error) {
      console.error('Error creating lawyer profile:', error);
      toast({
        title: "Submission Error",
        description: error instanceof Error ? error.message : "There was an error submitting your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="max-w-3xl mx-auto">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle />
            Profile Submitted Successfully
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold">Thank You for Joining Our Legal Network</h2>
            <p className="text-muted-foreground max-w-lg">
              Your profile has been submitted and is pending verification by our admin team.
              This typically takes 1-2 business days. You'll receive a notification once your 
              profile is verified.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Next Steps
              </h3>
              <ul className="space-y-2 text-sm">
                <li>Our team will review your credentials</li>
                <li>You'll be notified when your profile is verified</li>
                <li>Once verified, you'll begin receiving client leads</li>
                <li>You can update your profile at any time</li>
              </ul>
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Benefits
              </h3>
              <ul className="space-y-2 text-sm">
                <li>Receive qualified leads from scam victims</li>
                <li>Showcase your expertise in fraud recovery</li>
                <li>Help victims recover from financial harm</li>
                <li>Support the BeAware community mission</li>
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
    <Card className="max-w-3xl mx-auto">
      <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Scale />
          Register as a Legal Professional
        </CardTitle>
        <CardDescription className="text-primary-foreground/90">
          Join our network of attorneys to help scam victims recover and protect their rights
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Professional Information
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="barNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bar Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. NY12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="yearsOfExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="e.g. 5" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="firmName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Law Firm Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Your law firm name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="primarySpecialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Specialization</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your primary specialization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consumer_fraud">Consumer Fraud</SelectItem>
                          <SelectItem value="identity_theft">Identity Theft</SelectItem>
                          <SelectItem value="financial_recovery">Financial Recovery</SelectItem>
                          <SelectItem value="general_practice">General Practice</SelectItem>
                          <SelectItem value="cyber_crime">Cyber Crime</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="secondarySpecializations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Specializations (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          const currentValues = field.value || [];
                          if (!currentValues.includes(value as any)) {
                            field.onChange([...currentValues, value]);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Add specializations" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="consumer_fraud">Consumer Fraud</SelectItem>
                          <SelectItem value="identity_theft">Identity Theft</SelectItem>
                          <SelectItem value="financial_recovery">Financial Recovery</SelectItem>
                          <SelectItem value="general_practice">General Practice</SelectItem>
                          <SelectItem value="cyber_crime">Cyber Crime</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {field.value?.map((specialization) => (
                          <div 
                            key={specialization} 
                            className="flex items-center gap-1 bg-muted text-xs px-2 py-1 rounded-full"
                          >
                            {specialization.replace('_', ' ')}
                            <button
                              type="button"
                              className="text-muted-foreground hover:text-primary"
                              onClick={() => {
                                field.onChange(
                                  field.value?.filter((s) => s !== specialization)
                                );
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Contact Information
              </h3>
              
              <FormField
                control={form.control}
                name="officeLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Office Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="officePhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="Your office phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="officeEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Office Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Your office email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="profilePhotoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Photo URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Link to your profile photo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="websiteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your website URL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Bio & Expertise
              </h3>
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your experience, approach, and expertise in helping scam victims..." 
                        className="min-h-[120px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {field.value.length}/1000 characters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="caseTypes"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Case Types You Handle</FormLabel>
                      <FormDescription>
                        Select all that apply
                      </FormDescription>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      {caseTypes.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="caseTypes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={option.id}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, option.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== option.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {option.label}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Building className="h-5 w-5 text-primary" />
                Practice Settings
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="acceptingNewClients"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Accepting New Clients</FormLabel>
                        <FormDescription>
                          Are you currently taking new client referrals?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="offersFreeConsultation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Free Initial Consultation</FormLabel>
                        <FormDescription>
                          Do you offer a free initial consultation?
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              {!watchOffersFreeConsultation && (
                <FormField
                  control={form.control}
                  name="consultationFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consultation Fee</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. $150 per hour"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Verification Documents
              </h3>
              
              <div className="rounded-lg border p-4">
                <p className="text-sm mb-3">
                  To verify your credentials, please upload a copy of your bar card, 
                  law license, or other professional credentials.
                </p>
                
                <div className="flex items-center gap-3">
                  <Input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={handleFileChange}
                  />
                </div>
                
                {file && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Selected file: {file.name}
                  </p>
                )}
              </div>
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
                      I accept the terms and conditions
                    </FormLabel>
                    <FormDescription>
                      I confirm that all information provided is accurate, and I agree to the lawyer 
                      referral terms and privacy policy. I understand that my profile will be reviewed
                      before being approved.
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
                {isSubmitting ? "Submitting..." : "Submit Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}