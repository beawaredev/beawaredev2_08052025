import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Removed unused import
import { MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

// Pre-defined responses for common scam queries
const PREDEFINED_RESPONSES: Record<string, string> = {
  'phone': `**If you've been scammed via phone:**
1. Report the scam to the FTC at ReportFraud.ftc.gov
2. Report the number to your phone carrier
3. Block the number on your phone
4. Add your number to the Do Not Call Registry (donotcall.gov)
5. Consider using a call-blocking app or service
6. If you shared any personal information, monitor your accounts closely
7. If you lost money, contact your financial institution immediately
8. Document all details about the call for your records`,

  'email': `**If you've been scammed via email:**
1. Report phishing emails to reportphishing@apwg.org
2. Forward the email to the FTC at spam@uce.gov
3. Report to the FBI's Internet Crime Complaint Center (IC3)
4. Change passwords for any accounts that may be compromised
5. Monitor your credit reports for suspicious activity
6. Enable two-factor authentication on your important accounts
7. Never click suspicious links or download attachments from unknown senders
8. Consider using email filtering software and security features`,

  'business': `**If you've been scammed by a fake business:**
1. Report to the Better Business Bureau (BBB)
2. File a complaint with your state's consumer protection office
3. File a report with the FTC at ReportFraud.ftc.gov
4. Report to your state's Attorney General's office
5. If you paid with a credit card, contact your card issuer to dispute the charge
6. Share your experience on consumer review sites to warn others
7. Keep all receipts, emails, and documentation related to the transaction
8. Check if others have reported the same business on BeAware`,

  'money': `**If you've lost money in a scam:**
1. Contact your bank or financial institution immediately
2. If you used a credit card, contact your card issuer to dispute the charges
3. If you wired money, contact the wire transfer company immediately
4. If you paid with gift cards, contact the gift card issuer
5. Report the financial loss to local police and get a police report
6. File a report with the FTC at ReportFraud.ftc.gov
7. Document all communication with the scammer
8. Watch for follow-up scams - sometimes scammers will pose as recovery services`,

  'identity': `**If your identity was stolen:**
1. Place a fraud alert on your credit reports (Experian, Equifax, TransUnion)
2. Request credit reports from all three bureaus and review them carefully
3. Report identity theft to the FTC at IdentityTheft.gov
4. File a police report with your local law enforcement
5. Freeze your credit if necessary
6. Change passwords for all your accounts using a password manager
7. Monitor your credit reports and financial statements regularly
8. Consider using identity theft protection services`,

  'online': `**If you've encountered an online scam:**
1. Report it to the platform where it occurred (social media, marketplace, etc.)
2. Take screenshots of all communications for evidence
3. Report to the FBI's Internet Crime Complaint Center (IC3)
4. Use secure payment methods with buyer protection for online purchases
5. Never share personal information on unsecured websites
6. Be wary of deals that seem too good to be true
7. Check website URLs carefully before entering sensitive information
8. Use a credit card rather than debit card for online purchases when possible`,

  'romance': `**If you've been targeted by a romance scam:**
1. Stop all communication with the scammer immediately
2. Report the profile to the dating site or social media platform
3. File a report with the FTC at ReportFraud.ftc.gov
4. If you sent money, contact your financial institution right away
5. Report to the FBI's Internet Crime Complaint Center (IC3)
6. Don't feel embarrassed - these scammers are professionals at manipulation
7. Save all communications as evidence
8. Reach out to a trusted friend or therapist for emotional support`,

  'investment': `**If you've been scammed by a fake investment opportunity:**
1. Report to the SEC (Securities and Exchange Commission)
2. Report to FINRA (Financial Industry Regulatory Authority)
3. Contact your state securities regulator
4. Report to the FTC at ReportFraud.ftc.gov
5. File a report with the FBI's Internet Crime Complaint Center (IC3)
6. If offshore, consider reporting to international authorities
7. Document all details about the investment for your records
8. Be wary of recovery scams targeting victims of investment fraud`,

  'crypto': `**If you've been scammed in a cryptocurrency scam:**
1. Report to the FTC at ReportFraud.ftc.gov
2. File a report with the FBI's Internet Crime Complaint Center (IC3)
3. Report to your crypto exchange if applicable
4. Contact your wallet provider
5. Document all transaction IDs and addresses involved
6. Be aware that cryptocurrency transactions are usually irreversible
7. Report to the Securities and Exchange Commission if it was an investment scam
8. Be cautious of recovery services promising to get your crypto back`,

  'elderly': `**If an elderly person has been scammed:**
1. Report to the FTC at ReportFraud.ftc.gov
2. Contact the elder fraud hotline at 1-833-FRAUD-11 (1-833-372-8311)
3. Report to Adult Protective Services in your state
4. File a police report with local law enforcement
5. Notify banks and financial institutions
6. Consider getting legal advice about guardianship options if necessary
7. Help monitor accounts for suspicious activity
8. Be aware that scammers often repeatedly target the elderly`,

  'tech support': `**If you've experienced a tech support scam:**
1. Report to the FTC at ReportFraud.ftc.gov
2. Report to Microsoft or Apple if scammers impersonated those companies
3. Uninstall any software the scammer installed on your device
4. Disconnect from the internet immediately if they still have access
5. Change all your passwords from a different device
6. Run a comprehensive antivirus and malware scan
7. Consider restoring your device to factory settings if necessary
8. Never call phone numbers from pop-up warnings on your device`,

  'help': `I can help with advice for different types of scams. Try asking about:
- What to do if you lost money in a scam
- Steps to take after a phone scam
- How to handle email phishing
- What to do if your identity was stolen
- How to report a fake business
- Dealing with an online marketplace scam
- Recovery from a romance scam
- Steps after an investment or cryptocurrency scam
- Helping an elderly family member who was scammed
- Recovering from a tech support scam`
};

export default function ScamHelpChatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m the BeAware Scam Help Assistant. I can provide guidance on what to do if you\'ve experienced a scam.\n\nYou can ask me about:\n- What to do after a phone scam\n- Steps to take after email phishing\n- Reporting fake businesses\n- Recovering from financial loss\n- Identity theft protection\n- Romance or investment scams\n\nWhat type of scam situation can I help you with today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollAreaRef.current) {
      const scrollArea = scrollAreaRef.current;
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Check for predefined responses first
      let botResponse: string | null = null;
      
      // Check if any predefined keyword is in the message
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes('phone') || lowerInput.includes('call') || lowerInput.includes('caller')) {
        botResponse = PREDEFINED_RESPONSES.phone;
      } else if (lowerInput.includes('email') || lowerInput.includes('phish') || lowerInput.includes('mail')) {
        botResponse = PREDEFINED_RESPONSES.email;
      } else if (lowerInput.includes('business') || lowerInput.includes('company') || lowerInput.includes('store') || lowerInput.includes('shop')) {
        botResponse = PREDEFINED_RESPONSES.business;
      } else if (lowerInput.includes('money') || lowerInput.includes('paid') || lowerInput.includes('payment') || lowerInput.includes('financial')) {
        botResponse = PREDEFINED_RESPONSES.money;
      } else if (lowerInput.includes('identity') || lowerInput.includes('id') || lowerInput.includes('personal information') || lowerInput.includes('identity theft')) {
        botResponse = PREDEFINED_RESPONSES.identity;
      } else if (lowerInput.includes('online') || lowerInput.includes('internet') || lowerInput.includes('website') || lowerInput.includes('marketplace')) {
        botResponse = PREDEFINED_RESPONSES.online;
      } else if (lowerInput.includes('romance') || lowerInput.includes('dating') || lowerInput.includes('relationship') || lowerInput.includes('love')) {
        botResponse = PREDEFINED_RESPONSES.romance;
      } else if (lowerInput.includes('investment') || lowerInput.includes('stock') || lowerInput.includes('financial advisor') || lowerInput.includes('broker')) {
        botResponse = PREDEFINED_RESPONSES.investment;
      } else if (lowerInput.includes('crypto') || lowerInput.includes('bitcoin') || lowerInput.includes('cryptocurrency') || lowerInput.includes('blockchain')) {
        botResponse = PREDEFINED_RESPONSES.crypto;
      } else if (lowerInput.includes('elderly') || lowerInput.includes('senior') || lowerInput.includes('grandparent') || lowerInput.includes('old person')) {
        botResponse = PREDEFINED_RESPONSES.elderly;
      } else if (lowerInput.includes('tech support') || lowerInput.includes('computer help') || lowerInput.includes('fix computer') || lowerInput.includes('microsoft') || lowerInput.includes('apple support')) {
        botResponse = PREDEFINED_RESPONSES['tech support'];
      } else if (lowerInput.includes('help') || lowerInput.includes('what') || lowerInput.includes('how') || lowerInput.includes('assistance')) {
        botResponse = PREDEFINED_RESPONSES.help;
      }
      
      // If no predefined response, provide a general help message with suggestions
      if (!botResponse) {
        botResponse = "I understand you're concerned about a scam situation. To provide the most helpful guidance, could you share more details about what happened?\n\nFor example, try mentioning any of these categories:\n- Phone scam (unwanted calls, robocalls)\n- Email phishing or online scam\n- Fake business or service\n- Romance or relationship scam\n- Lost money or financial fraud\n- Identity theft concerns\n- Cryptocurrency or investment scam\n- Tech support scam\n\nThe more specific you can be, the better advice I can provide.";
      }
    
      // Add bot response
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error getting chatbot response:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSendMessage();
    }
  };

  return (
    <Card className="w-full h-[600px] max-h-[80vh] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Scam Help Assistant
        </CardTitle>
        <CardDescription>
          Get guidance on what to do if you've been scammed
        </CardDescription>
      </CardHeader>
      <Tabs defaultValue="chat">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
          <TabsTrigger value="chat" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Chat</TabsTrigger>
          <TabsTrigger value="resources" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Resources</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="flex-grow flex flex-col mt-0">
          <CardContent className="flex-grow overflow-hidden p-4">
            <ScrollArea className="h-[350px] pr-4" ref={scrollAreaRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-lg px-4 py-2 bg-muted">
                      <p>Typing<span className="animate-pulse">...</span></p>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <div className="flex w-full gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()}>
                Send
              </Button>
            </div>
          </CardFooter>
        </TabsContent>
        <TabsContent value="resources" className="flex-grow mt-0 p-4">
          <div className="prose prose-sm dark:prose-invert">
            <h3>Government Resources</h3>
            <ul>
              <li><a href="https://reportfraud.ftc.gov/" target="_blank" rel="noopener noreferrer">FTC Report Fraud</a> - Report all types of scams and fraud</li>
              <li><a href="https://www.identitytheft.gov/" target="_blank" rel="noopener noreferrer">IdentityTheft.gov</a> - Report and recover from identity theft</li>
              <li><a href="https://www.ic3.gov/" target="_blank" rel="noopener noreferrer">FBI Internet Crime Complaint Center (IC3)</a> - Report internet-related crimes</li>
              <li><a href="https://www.usa.gov/state-consumer" target="_blank" rel="noopener noreferrer">State Consumer Protection Offices</a> - Find your state's consumer protection resources</li>
              <li><a href="https://www.donotcall.gov/" target="_blank" rel="noopener noreferrer">National Do Not Call Registry</a> - Reduce telemarketing calls</li>
              <li><a href="https://www.consumerfinance.gov/complaint/" target="_blank" rel="noopener noreferrer">CFPB Complaint Portal</a> - File complaints about financial products and services</li>
            </ul>
            
            <h3>Financial Protection</h3>
            <ul>
              <li><a href="https://www.annualcreditreport.com" target="_blank" rel="noopener noreferrer">AnnualCreditReport.com</a> - Get free credit reports from all three bureaus</li>
              <li><a href="https://www.consumer.ftc.gov/articles/what-know-about-credit-freezes-and-fraud-alerts" target="_blank" rel="noopener noreferrer">Credit Freezes & Fraud Alerts</a> - How to place a credit freeze</li>
              <li><a href="https://www.fdic.gov/resources/consumers/consumer-assistance-topics/index.html" target="_blank" rel="noopener noreferrer">FDIC Consumer Assistance</a> - Help with banking issues</li>
            </ul>

            <h3>Specialized Resources</h3>
            <ul>
              <li><a href="https://www.irs.gov/identity-theft-fraud-scams/tax-scams-consumer-alerts" target="_blank" rel="noopener noreferrer">IRS Tax Scam Alerts</a> - Information on tax-related scams</li>
              <li><a href="https://www.sec.gov/tcr" target="_blank" rel="noopener noreferrer">SEC Complaint Center</a> - Report investment scams</li>
              <li><a href="https://www.bbb.org/scamtracker" target="_blank" rel="noopener noreferrer">BBB Scam Tracker</a> - Report and find scams in your area</li>
              <li><a href="https://www.aarp.org/money/scams-fraud/" target="_blank" rel="noopener noreferrer">AARP Fraud Resource Center</a> - Resources for seniors</li>
            </ul>
            
            <h3>Essential Steps After Being Scammed</h3>
            <ol>
              <li><strong>Stop all communication</strong> with the scammer immediately.</li>
              <li><strong>Document everything</strong> - save messages, emails, screenshots, phone numbers, and any other evidence.</li>
              <li><strong>Report the scam</strong> to the appropriate authorities (FTC, IC3, local police).</li>
              <li><strong>Alert your financial institutions</strong> if money was involved or financial information was shared.</li>
              <li><strong>Change your passwords</strong> for any accounts that may be compromised, starting with email and banking.</li>
              <li><strong>Place a fraud alert or credit freeze</strong> with the three major credit bureaus (Experian, Equifax, TransUnion).</li>
              <li><strong>Monitor your accounts</strong> closely for any suspicious activity for several months.</li>
              <li><strong>Be wary of follow-up scams</strong> - scammers often share lists of victims for secondary "recovery" scams.</li>
            </ol>

            <h3>Report Scams on BeAware.fyi</h3>
            <p>Help protect others by <a href="/report" className="font-medium">reporting the scam</a> on our platform. Your report can help others avoid falling victim to the same scam.</p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}