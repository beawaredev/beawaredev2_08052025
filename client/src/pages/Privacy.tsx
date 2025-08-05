import { Helmet } from "react-helmet";

export default function Privacy() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Privacy Policy | BeAware.fyi</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4">
          Last updated: May 21, 2025
        </p>
        
        <p className="mb-4">
          At BeAware.fyi, we take your privacy seriously. This Privacy Policy explains how we collect, use, 
          disclose, and safeguard your information when you visit our website or use our services.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Information We Collect</h2>
        <p className="mb-4">
          We collect information that you voluntarily provide to us when you:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Register for an account</li>
          <li>Submit a scam report</li>
          <li>Contact us via email or contact forms</li>
          <li>Participate in user surveys or provide feedback</li>
        </ul>
        
        <p className="mb-4">
          This information may include:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Personal identifiers (name, email address)</li>
          <li>Authentication information for your account</li>
          <li>Content of scam reports you submit</li>
          <li>Communication records between you and BeAware.fyi</li>
        </ul>
        
        <p className="mb-4">
          We also automatically collect certain information when you visit our website, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Log data (IP address, browser type, pages visited)</li>
          <li>Device information (device type, operating system)</li>
          <li>Usage information (how you interact with our Service)</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">How We Use Your Information</h2>
        <p className="mb-4">
          We use the information we collect to:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Create and maintain your account</li>
          <li>Process and display scam reports</li>
          <li>Improve our website and services</li>
          <li>Communicate with you about your account or our services</li>
          <li>Respond to your inquiries and support requests</li>
          <li>Monitor and analyze usage patterns</li>
          <li>Detect, prevent, and address technical issues</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Disclosure of Your Information</h2>
        <p className="mb-4">
          We may share information in the following situations:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li><strong>Public Scam Reports:</strong> Information you submit in scam reports (excluding your personal identifiers) may be publicly visible to help others identify scams.</li>
          <li><strong>Legal Compliance:</strong> We may disclose information where required by law or to protect our rights, privacy, safety, or property.</li>
          <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf (hosting, email delivery, analytics).</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Data Security</h2>
        <p className="mb-4">
          We have implemented appropriate technical and organizational security measures designed to protect 
          the security of any personal information we process. However, no method of transmission over the 
          Internet or electronic storage is 100% secure, so we cannot guarantee absolute security.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Your Data Protection Rights</h2>
        <p className="mb-4">
          Depending on your location, you may have certain rights regarding your personal information, including:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>The right to access personal information we hold about you</li>
          <li>The right to request correction of inaccurate information</li>
          <li>The right to request deletion of your personal information</li>
          <li>The right to opt out of marketing communications</li>
        </ul>
        <p className="mb-4">
          To exercise these rights, please contact us at beaware.fyi@gmail.com.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Websites</h2>
        <p className="mb-4">
          Our website may contain links to third-party websites that are not owned or controlled by BeAware.fyi. 
          We have no control over and assume no responsibility for the content, privacy policies, or practices 
          of any third-party websites or services.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Children's Privacy</h2>
        <p className="mb-4">
          Our Service is not intended for use by children under the age of 13. We do not knowingly collect 
          personal information from children under 13. If you become aware that a child has provided us with 
          personal information, please contact us at beaware.fyi@gmail.com.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Privacy Policy</h2>
        <p className="mb-4">
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the 
          new Privacy Policy on this page and updating the "last updated" date. You are advised to review this 
          Privacy Policy periodically for any changes.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this Privacy Policy, please contact us at beaware.fyi@gmail.com.
        </p>
      </div>
    </div>
  );
}