import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import AIChatAssistant from "@/components/ScamHelp/AIChatAssistant";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  Handshake as HandshakeIcon,
  ArrowRight as ArrowRightIcon,
} from "lucide-react";

const CHECKLIST_ROUTE = "/secure-your-digital-presence";

const ScamHelp: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header — aligned like Dashboard */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scam Help Center</h1>
          <p className="text-muted-foreground mt-1">
            Resources and assistance for scam victims
          </p>
          <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
            <HandshakeIcon className="h-4 w-4 text-primary" />
            We research and partner with industry leaders to provide security at
            a cheaper price — unlocking your digital confidence.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Link to={CHECKLIST_ROUTE}>
            <Button className="gap-1">
              Open Security Checklist
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
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
            {/* Government Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Government Resources</CardTitle>
                <CardDescription>
                  Official agencies that can help
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    Federal Trade Commission (FTC)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The primary federal agency handling consumer fraud
                    complaints.
                  </p>
                  <a
                    href="https://reportfraud.ftc.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Report Fraud to FTC
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold">
                    FBI Internet Crime Complaint Center (IC3)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    For reporting internet-related crimes including scams and
                    fraud.
                  </p>
                  <a
                    href="https://www.ic3.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    File a Complaint with IC3
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold">
                    Consumer Financial Protection Bureau (CFPB)
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Handles complaints related to financial products and
                    services.
                  </p>
                  <a
                    href="https://www.consumerfinance.gov/complaint/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Submit a CFPB Complaint
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Identity Theft Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Identity Theft Resources</CardTitle>
                <CardDescription>
                  Help for identity theft victims
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">IdentityTheft.gov</h3>
                  <p className="text-sm text-muted-foreground">
                    Federal government's official website for reporting identity
                    theft and creating recovery plans.
                  </p>
                  <a
                    href="https://www.identitytheft.gov"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Report Identity Theft
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold">
                    Credit Bureaus - Fraud Alerts
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Place a fraud alert with one of the three major credit
                    bureaus.
                  </p>
                  <div className="flex flex-col space-y-1 mt-1">
                    <a
                      href="https://www.equifax.com/personal/credit-report-services/credit-fraud-alerts/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Equifax
                    </a>
                    <a
                      href="https://www.experian.com/fraud/center.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Experian
                    </a>
                    <a
                      href="https://www.transunion.com/fraud-alerts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      TransUnion
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Legal Resources</CardTitle>
                <CardDescription>
                  Getting legal help for scam victims
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Legal Aid</h3>
                  <p className="text-sm text-muted-foreground">
                    Free or low-cost legal help for those who qualify.
                  </p>
                  <a
                    href="https://www.lsc.gov/about-lsc/what-legal-aid/get-legal-help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Find Legal Aid Near You
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold">
                    State Attorney General Offices
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your state's attorney general can help with consumer
                    protection issues.
                  </p>
                  <a
                    href="https://www.naag.org/find-my-ag/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Find Your State's Attorney General
                  </a>
                </div>
                <div>
                  <h3 className="font-semibold">BeAware Lawyer Connection</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with lawyers specializing in scam recovery through
                    our platform.
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-primary">Find a Lawyer</span>
                    <span className="text-xs font-medium bg-amber-100 text-amber-800 py-0.5 px-2 rounded-full">
                      Coming Soon
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Recovery */}
            <Card>
              <CardHeader>
                <CardTitle>Financial Recovery</CardTitle>
                <CardDescription>
                  Steps to recover financially from scams
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">
                    Contact Financial Institutions
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Immediately contact your bank, credit card company, or other
                    financial institutions if you've sent money to scammers.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Report to Payment Services</h3>
                  <p className="text-sm text-muted-foreground">
                    If you used a payment service, report the scam to them.
                  </p>
                  <div className="flex flex-col space-y-1 mt-1">
                    <a
                      href="https://www.paypal.com/us/smarthelp/article/how-do-i-report-potential-fraud,-spoof-or-unauthorized-transactions-to-paypal-faq2422"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      PayPal
                    </a>
                    <a
                      href="https://cash.app/help/us/en-us/6482-recognize-scams"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Cash App
                    </a>
                    <a
                      href="https://www.westernunion.com/us/en/fraudawareness/fraud-report-fraud.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Western Union
                    </a>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold">Monitor Your Credit</h3>
                  <p className="text-sm text-muted-foreground">
                    Check your credit reports regularly for suspicious activity.
                  </p>
                  <a
                    href="https://www.annualcreditreport.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
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
              <CardDescription>
                Common questions about scams and recovery
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>
                    What should I do first if I've been scammed?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      If you've been scammed, take these immediate steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Stop all communication with the scammer</li>
                      <li>Document everything related to the scam</li>
                      <li>
                        If you've shared financial information, contact your
                        bank
                      </li>
                      <li>
                        Report the scam to the appropriate authorities (FTC, FBI
                        IC3, etc.)
                      </li>
                      <li>
                        If you've shared personal info, consider a credit freeze
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    Can I get my money back after being scammed?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Recovery depends on how you paid, how quickly you
                      reported, and the type of scam.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    How do I protect myself from future scams?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="mb-2">
                      To reduce your risk of being scammed again:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>Be wary of unsolicited contacts</li>
                      <li>Research companies thoroughly</li>
                      <li>Use secure payment methods</li>
                      <li>Enable two-factor authentication</li>
                      <li>Monitor your statements and credit reports</li>
                      <li>Keep devices and software updated</li>
                      <li>Use strong, unique passwords</li>
                      <li>Be skeptical of “too good to be true” offers</li>
                      <li>Check our database regularly</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                  <AccordionTrigger>
                    Should I report a scam if I didn't lose money?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Yes! Reporting helps protect others and track patterns.
                    </p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-5">
                  <AccordionTrigger>
                    Do I need a lawyer to help with a scam?
                  </AccordionTrigger>
                  <AccordionContent>
                    <p>
                      Not every case needs a lawyer, but legal assistance can
                      help in complex or high-loss cases.
                    </p>
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
