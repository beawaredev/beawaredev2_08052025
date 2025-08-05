import { Helmet } from "react-helmet";

export default function Terms() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Terms of Service | BeAware.fyi</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4">
          Last updated: May 21, 2025
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By accessing or using the BeAware.fyi website ("Service"), you agree to be bound by these Terms of Service. 
          If you disagree with any part of the terms, you may not access the Service.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">2. User Accounts</h2>
        <p className="mb-4">
          When you create an account with us, you guarantee that the information you provide is accurate, complete, 
          and current at all times. Inaccurate, incomplete, or obsolete information may result in the immediate 
          termination of your account on the Service.
        </p>
        <p className="mb-4">
          You are responsible for maintaining the confidentiality of your account and password and for restricting 
          access to your computer, and you agree to accept responsibility for all activities that occur under your 
          account or password.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Content</h2>
        <p className="mb-4">
          Our Service allows you to post, link, store, share and otherwise make available certain information, text, 
          images, or other material ("Content"). By submitting Content to BeAware.fyi, you grant us the right to use, 
          modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service.
        </p>
        <p className="mb-4">
          You agree not to post Content that:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Is false, misleading, or fraudulent</li>
          <li>Is defamatory, abusive, or harassing</li>
          <li>Contains personal information about others without their consent</li>
          <li>Infringes on any patent, trademark, trade secret, copyright, or other intellectual property rights</li>
          <li>Violates any law or regulation</li>
          <li>Is otherwise inappropriate or harmful</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Report Accuracy</h2>
        <p className="mb-4">
          BeAware.fyi does not guarantee the accuracy, completeness, or reliability of any reports submitted by users. 
          All reports are submitted by community members and, while we make reasonable efforts to verify information, 
          we cannot guarantee that all information is accurate or current.
        </p>
        <p className="mb-4">
          You acknowledge that you use the information provided on this Service at your own risk, and you should 
          independently verify any information before taking action based upon it.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Intellectual Property</h2>
        <p className="mb-4">
          The Service and its original content (excluding Content provided by users), features, and functionality are 
          and will remain the exclusive property of BeAware.fyi and its licensors. The Service is protected by copyright, 
          trademark, and other laws of both the United States and foreign countries.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Limitation of Liability</h2>
        <p className="mb-4">
          In no event shall BeAware.fyi, nor its directors, employees, partners, agents, suppliers, or affiliates, be 
          liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, 
          loss of profits, data, use, goodwill, or other intangible losses, resulting from:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Your access to or use of or inability to access or use the Service;</li>
          <li>Any conduct or content of any third party on the Service;</li>
          <li>Any content obtained from the Service; and</li>
          <li>Unauthorized access, use or alteration of your transmissions or content.</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Termination</h2>
        <p className="mb-4">
          We may terminate or suspend your account and bar access to the Service immediately, without prior notice or 
          liability, under our sole discretion, for any reason whatsoever and without limitation, including but not 
          limited to a breach of the Terms.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Changes to Terms</h2>
        <p className="mb-4">
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. What constitutes 
          a material change will be determined at our sole discretion. By continuing to access or use our Service after 
          any revisions become effective, you agree to be bound by the revised terms.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Contact Us</h2>
        <p className="mb-4">
          If you have any questions about these Terms, please contact us at beaware.fyi@gmail.com.
        </p>
      </div>
    </div>
  );
}