import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AIChatAssistant from '@/components/ScamHelp/AIChatAssistant';

const ScamHelp: React.FC = () => {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-2">Scam Help Center</h1>
      <p className="text-muted-foreground mb-8">Resources and assistance for scam victims</p>
      
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3">
          <TabsTrigger value="chat">AI Chat Assistant</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="mt-6">
          <AIChatAssistant />
        </TabsContent>
        
        <TabsContent value="resources" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Government Resources</CardTitle>
                <CardDescription>Official agencies that can help</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Federal Trade Commission (FTC)</h3>
                  <p className="text-sm text-muted-foreground">The primary federal agency handling consumer fraud complaints.</p>
                  <a href="https://reportfraud.ftc.gov" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Report Fraud to FTC
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold">FBI Internet Crime Complaint Center (IC3)</h3>
                  <p className="text-sm text-muted-foreground">For reporting internet-related crimes including scams and fraud.</p>
                  <a href="https://www.ic3.gov" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    File a Complaint with IC3
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold">Consumer Financial Protection Bureau (CFPB)</h3>
                  <p className="text-sm text-muted-foreground">Handles complaints related to financial products and services.</p>
                  <a href="https://www.consumerfinance.gov/complaint/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Submit a CFPB Complaint
                  </a>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Identity Theft Resources</CardTitle>
                <CardDescription>Help for identity theft victims</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">IdentityTheft.gov</h3>
                  <p className="text-sm text-muted-foreground">Federal government's official website for reporting identity theft and creating recovery plans.</p>
                  <a href="https://www.identitytheft.gov" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Report Identity Theft
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold">Credit Bureaus - Fraud Alerts</h3>
                  <p className="text-sm text-muted-foreground">Place a fraud alert with one of the three major credit bureaus.</p>
                  <div className="flex flex-col space-y-1 mt-1">
                    <a href="https://www.equifax.com/personal/credit-report-services/credit-fraud-alerts/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Equifax
                    </a>
                    <a href="https://www.experian.com/fraud/center.html" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Experian
                    </a>
                    <a href="https://www.transunion.com/fraud-alerts" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      TransUnion
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Legal Resources</CardTitle>
                <CardDescription>Getting legal help for scam victims</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Legal Aid</h3>
                  <p className="text-sm text-muted-foreground">Free or low-cost legal help for those who qualify.</p>
                  <a href="https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Find Legal Aid Near You
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold">State Attorney General Offices</h3>
                  <p className="text-sm text-muted-foreground">Your state's attorney general can help with consumer protection issues.</p>
                  <a href="https://www.naag.org/find-my-ag/" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Find Your State's Attorney General
                  </a>
                </div>
                
                <div>
                  <h3 className="font-semibold">BeAware Lawyer Connection</h3>
                  <p className="text-sm text-muted-foreground">Connect with lawyers specializing in scam recovery through our platform.</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-primary">Find a Lawyer</span>
                    <span className="text-xs font-medium bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">Coming Soon</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Financial Recovery</CardTitle>
                <CardDescription>Steps to recover financially from scams</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Contact Financial Institutions</h3>
                  <p className="text-sm text-muted-foreground">Immediately contact your bank, credit card company, or other financial institutions if you've sent money to scammers.</p>
                </div>
                
                <div>
                  <h3 className="font-semibold">Report to Payment Services</h3>
                  <p className="text-sm text-muted-foreground">If you used a payment service, report the scam to them.</p>
                  <div className="flex flex-col space-y-1 mt-1">
                    <a href="https://www.paypal.com/us/smarthelp/article/how-do-i-report-potential-fraud,-spoof-or-unauthorized-transactions-to-paypal-faq2422" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      PayPal
                    </a>
                    <a href="https://cash.app/help/us/en-us/6482-recognize-scams" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Cash App
                    </a>
                    <a href="https://www.westernunion.com/us/en/fraudawareness/fraud-report-fraud.html" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Western Union
                    </a>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold">Monitor Your Credit</h3>
                  <p className="text-sm text-muted-foreground">Check your credit reports regularly for suspicious activity.</p>
                  <a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                    Get Free Credit Reports
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
              <CardDescription>Common questions about scams and recovery</CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What should I do first if I've been scammed?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">If you've been scammed, take these immediate steps:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Stop all communication with the scammer</li>
                      <li>Document everything related to the scam (conversations, receipts, etc.)</li>
                      <li>If you've shared financial information, contact your bank or credit card company</li>
                      <li>Report the scam to the appropriate authorities (FTC, FBI IC3, etc.)</li>
                      <li>If you've shared personal information, consider a credit freeze</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Can I get my money back after being scammed?</AccordionTrigger>
                  <AccordionContent>
                    <p>Recovery depends on several factors including how you paid, how quickly you reported the fraud, and the type of scam. Here are some possibilities:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li><strong>Credit Card Payments:</strong> You may be able to dispute the charge and request a chargeback</li>
                      <li><strong>Bank Transfers:</strong> Contact your bank immediately; they might be able to stop or reverse the transfer</li>
                      <li><strong>Wire Transfers:</strong> These are difficult to recover once sent</li>
                      <li><strong>Payment Apps:</strong> Services like PayPal may offer some buyer protection</li>
                      <li><strong>Cryptocurrency:</strong> These transactions are typically irreversible</li>
                    </ul>
                    <p className="mt-2">The sooner you report the fraud, the better your chances of recovery.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>How do I protect myself from future scams?</AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">To reduce your risk of being scammed again:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Be wary of unsolicited contacts (calls, emails, texts) asking for personal information or money</li>
                      <li>Research companies thoroughly before doing business with them</li>
                      <li>Use secure payment methods with buyer protection</li>
                      <li>Enable two-factor authentication on all important accounts</li>
                      <li>Regularly monitor your financial statements and credit reports</li>
                      <li>Keep your devices and software updated</li>
                      <li>Use strong, unique passwords for each account</li>
                      <li>Be skeptical of "too good to be true" offers or urgent pressure tactics</li>
                      <li>Check our database regularly to stay informed about current scams</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>Should I report a scam if I didn't lose money?</AccordionTrigger>
                  <AccordionContent>
                    <p>Yes! Reporting scams even when you didn't lose money is incredibly valuable because:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>It helps authorities track scam patterns and trends</li>
                      <li>Your report could help prevent others from falling victim</li>
                      <li>It provides data that can be used to shut down scammers</li>
                      <li>It helps improve consumer education and awareness</li>
                    </ul>
                    <p className="mt-2">You can report the scam through our platform and to the FTC at reportfraud.ftc.gov.</p>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>Do I need a lawyer to help with a scam?</AccordionTrigger>
                  <AccordionContent>
                    <p>Not every scam situation requires a lawyer, but legal assistance can be valuable in certain circumstances:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                      <li>If you've lost a significant amount of money</li>
                      <li>If identity theft has led to complex legal issues</li>
                      <li>If you're being held responsible for fraudulent debts</li>
                      <li>If you need to recover assets through legal channels</li>
                      <li>If you want to pursue legal action against known scammers</li>
                    </ul>
                    <p className="mt-2">Our platform will soon be able to connect you with lawyers specializing in fraud recovery. <span className="text-xs font-medium bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full inline-block mt-1">Coming Soon</span></p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ScamHelp;