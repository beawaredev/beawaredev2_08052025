import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LawyerConnectionForm from '@/components/LawyerConnectionForm';
import { 
  Scale, 
  FileText, 
  User,
  CheckCircle,
  ClipboardList,
  DollarSign,
  HelpCircle,
  Shield,
  Clock,
  Lightbulb
} from 'lucide-react';

export default function LegalHelp() {
  const [activeTab, setActiveTab] = useState('connect');
  const [location] = useLocation();
  const [scamReportId, setScamReportId] = useState<number | undefined>(undefined);
  const [scamType, setScamType] = useState<'phone' | 'email' | 'business' | undefined>(undefined);
  
  // Parse URL parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reportId = searchParams.get('scamReportId');
    const type = searchParams.get('scamType') as 'phone' | 'email' | 'business' | null;
    
    if (reportId) {
      setScamReportId(parseInt(reportId, 10));
    }
    
    if (type && ['phone', 'email', 'business'].includes(type)) {
      setScamType(type);
    }
    
    // Ensure the connect tab is active when coming from a report
    if (reportId) {
      setActiveTab('connect');
    }
  }, [location]);
  
  return (
    <div className="container max-w-7xl py-6 space-y-8">
      <div className="text-center space-y-2 max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Legal Help for Scam Victims
        </h1>
        <p className="text-xl text-muted-foreground">
          Connect with qualified attorneys and get the support you need
        </p>
      </div>
      
      <Tabs defaultValue="connect" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-3xl mx-auto md:grid-cols-3">
          <TabsTrigger value="connect" className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            <span>Connect with a Lawyer</span>
            <span className="text-xs font-medium bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">Coming Soon</span>
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Legal Resources</span>
          </TabsTrigger>
          <TabsTrigger value="faq" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            <span>FAQ</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="connect" className="mt-6">
          {scamReportId && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex gap-3">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-800">Report Submitted Successfully</h3>
                <p className="text-sm text-green-700">
                  Your scam report has been submitted successfully. You can now connect with a qualified lawyer
                  to get legal assistance for your case. The form below has been pre-filled with information from your report.
                </p>
              </div>
            </div>
          )}
          <div className="p-8 bg-muted rounded-md text-center space-y-4">
            <h3 className="text-xl font-medium">Lawyer Connection Feature</h3>
            <div className="inline-block bg-amber-100 text-amber-800 py-1 px-3 rounded-full font-medium">
              Coming Soon
            </div>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're currently building our network of qualified lawyers who specialize in helping scam victims. 
              This feature will be available soon, allowing you to connect with legal professionals who can 
              assist with recovery options and legal advice.
            </p>
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Verified Professionals
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                All lawyers in our network are verified for credentials and experience in handling scam cases.
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Confidential Process
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Your information is kept confidential and only shared with the assigned legal professional.
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-amber-600" />
                  Quick Response
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Most requests receive a response within 1-2 business days from a qualified attorney.
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="resources" className="mt-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Know Your Rights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">As a scam victim, you have rights</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Right to report fraud to law enforcement agencies</li>
                    <li>Right to dispute fraudulent charges with financial institutions</li>
                    <li>Right to place fraud alerts on your credit reports</li>
                    <li>Right to seek compensation through civil litigation</li>
                    <li>Right to protection under consumer protection laws</li>
                  </ul>
                </div>
                
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm font-medium flex items-center gap-1 mb-1">
                    <Lightbulb className="h-4 w-4 text-amber-600" />
                    Important Note
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Time limitations may apply to your legal rights. Consult with a lawyer promptly to understand 
                    your specific situation and applicable statutes of limitations.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Financial Recovery Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Potential paths to recovery</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Disputing credit card or bank charges (typically within 60 days)</li>
                    <li>Filing complaints with FTC, CFPB, or state attorney general</li>
                    <li>Pursuing civil litigation against scammers if identifiable</li>
                    <li>Checking if your financial institution offers fraud protection</li>
                    <li>Exploring class action lawsuits for widespread scams</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium mb-1">Credit Card Fraud</p>
                    <p className="text-xs text-muted-foreground">
                      Federal law limits your liability to $50 for unauthorized charges
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm font-medium mb-1">Bank Transfer Fraud</p>
                    <p className="text-xs text-muted-foreground">
                      Report within 2 days to limit liability to $50, or within 60 days for $500
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Official Resources
              </CardTitle>
              <CardDescription>
                Government and nonprofit organizations that can help
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Federal Trade Commission (FTC)</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    File complaints and access recovery resources for various scam types.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Identity Theft</Badge>
                    <Badge variant="outline">Consumer Fraud</Badge>
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2 text-sm" asChild>
                    <a href="https://www.ftc.gov/scams" target="_blank" rel="noopener noreferrer">
                      Visit FTC Scam Resources →
                    </a>
                  </Button>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Consumer Financial Protection Bureau</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Handle complaints related to financial products and services.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Financial Scams</Badge>
                    <Badge variant="outline">Investment Fraud</Badge>
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2 text-sm" asChild>
                    <a href="https://www.consumerfinance.gov/complaint/" target="_blank" rel="noopener noreferrer">
                      Visit CFPB Complaint Center →
                    </a>
                  </Button>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-2">Internet Crime Complaint Center (IC3)</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    FBI resource for reporting internet-related criminal activity.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline">Online Fraud</Badge>
                    <Badge variant="outline">Phishing</Badge>
                  </div>
                  <Button variant="link" className="p-0 h-auto mt-2 text-sm" asChild>
                    <a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer">
                      Visit IC3 Website →
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Button asChild variant="outline">
                <Link to="/help">Visit our Scam Help Center for more resources</Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently Asked Questions
              </CardTitle>
              <CardDescription>
                Common questions about legal help for scam victims
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    What type of legal assistance can I expect?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      Our network attorneys can help with various aspects of scam recovery, including:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>Evaluating your legal options after being scammed</li>
                      <li>Assistance with filing complaints with appropriate agencies</li>
                      <li>Help with disputing fraudulent transactions</li>
                      <li>Guidance on recovering lost funds when possible</li>
                      <li>Representation in civil litigation against scammers (when identifiable)</li>
                      <li>Protection from collection actions on fraudulent debts</li>
                      <li>Identity theft recovery assistance</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    How much does legal help cost?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Many lawyers in our network offer free initial consultations to assess your case. 
                      After that, fee structures vary based on the type of case and attorney. Some may work 
                      on a contingency basis (taking a percentage of recovered funds), while others may charge 
                      hourly rates or flat fees for specific services. Always discuss fees clearly with your 
                      attorney before engaging their services. Some consumer protection cases may allow for 
                      recovery of attorney's fees from the opposing party if successful.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    Is there a statute of limitations for scam cases?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Yes, there are time limits for taking legal action, which vary by state and type of claim. 
                      Generally, fraud claims have a statute of limitations ranging from 1-6 years, depending on 
                      your state. For credit card disputes, you typically have 60 days from when the statement 
                      with the fraudulent charge was sent to you. For bank fraud, reporting within 2 business days 
                      limits your liability to $50, while waiting up to 60 days increases potential liability to $500. 
                      Beyond that, you may face unlimited liability. This is why prompt action is essential.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    Can I recover money from scammers who are overseas?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      Recovering money from overseas scammers is challenging but not always impossible. Your options may include:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mt-2">
                      <li>Working with your financial institution to reverse transactions</li>
                      <li>Reporting to international law enforcement through IC3 or Interpol</li>
                      <li>Checking if the scammer used a legitimate payment processor that may have fraud protection</li>
                      <li>Determining if the scammer has U.S.-based assets or connections</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      A lawyer can help assess the specific circumstances of your case and identify the most promising 
                      avenues for potential recovery.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>
                    What information should I prepare before speaking with a lawyer?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      To make your consultation most effective, gather the following:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                      <li>A chronological timeline of events related to the scam</li>
                      <li>All communications with the scammer (emails, texts, call logs)</li>
                      <li>Records of any payments or transfers made</li>
                      <li>Bank or credit card statements showing the transactions</li>
                      <li>Any receipts, contracts, or agreements involved</li>
                      <li>Screenshots or evidence of fraudulent websites or social media</li>
                      <li>Reports you've filed with police or other agencies</li>
                      <li>Any responses received from banks or other institutions</li>
                      <li>Contact information of any witnesses or other victims</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger>
                    How are lawyers in your network vetted?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground">
                      All lawyers in our network undergo a verification process that includes:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mt-2">
                      <li>Confirmation of active bar license in good standing</li>
                      <li>Verification of professional credentials and specializations</li>
                      <li>Review of experience handling scam and fraud cases</li>
                      <li>Evaluation of client feedback and professional reputation</li>
                      <li>Background checks for disciplinary actions or malpractice claims</li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-2">
                      Only attorneys who meet our standards for expertise in consumer protection, 
                      fraud recovery, and related practice areas are included in our referral network.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
          
          <div className="bg-muted rounded-lg p-6 text-center">
            <h3 className="text-xl font-medium mb-2">Still have questions?</h3>
            <p className="text-muted-foreground mb-4">
              Soon, you'll be able to connect with a lawyer who can address your specific situation.
            </p>
            <Button size="lg" onClick={() => setActiveTab('connect')} className="relative">
              <div className="flex items-center">
                <span>Connect with a Lawyer</span>
                <span className="ml-2 text-xs bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">Coming Soon</span>
              </div>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="text-center pb-8 pt-4">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you a lawyer interested in helping scam victims?
          </p>
          <Button className="relative">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              <span>Join Our Legal Network</span>
              <span className="text-xs bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">Coming Soon</span>
            </div>
          </Button>
          <p className="text-xs text-muted-foreground">
            Help victims recover from scams while growing your practice
          </p>
        </div>
      </div>
    </div>
  );
}