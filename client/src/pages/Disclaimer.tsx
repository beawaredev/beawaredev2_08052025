import { Helmet } from "react-helmet";

export default function Disclaimer() {
  return (
    <div className="container mx-auto py-8 px-4">
      <Helmet>
        <title>Disclaimer | BeAware.fyi</title>
      </Helmet>
      
      <h1 className="text-3xl font-bold mb-6">Disclaimer</h1>
      
      <div className="prose max-w-none">
        <p className="mb-4">
          Last updated: May 21, 2025
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">User-Generated Content Disclaimer</h2>
        <p className="mb-4">
          The scam reports and information on BeAware.fyi are primarily submitted by users of the platform. 
          While we make reasonable efforts to review reports for accuracy and legitimacy, we cannot guarantee 
          that all information posted on this site is accurate, complete, or reliable.
        </p>
        
        <p className="mb-4">
          BeAware.fyi is not responsible for any inaccuracies or misrepresentations in user-submitted 
          reports. We do not endorse or verify the legitimacy of individuals, businesses, or entities 
          referenced in these reports beyond our standard review process.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">No Professional Advice</h2>
        <p className="mb-4">
          The information provided on BeAware.fyi, including text, graphics, links, and other material, 
          is for informational purposes only. It is not intended to be legal, financial, or professional advice.
        </p>
        
        <p className="mb-4">
          The AI assistant available on our platform provides general guidance based on common scam scenarios 
          but should not be considered professional advice. For situations requiring professional assistance, 
          we recommend consulting with qualified professionals such as lawyers, law enforcement, or financial advisors.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Use At Your Own Risk</h2>
        <p className="mb-4">
          Users access and use BeAware.fyi and its content at their own risk. We recommend that users 
          independently verify any information they find on our platform before taking any action based on it.
        </p>
        
        <p className="mb-4">
          BeAware.fyi is not liable for any actions taken or not taken based on the information provided 
          on our platform.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Not A Reporting Agency</h2>
        <p className="mb-4">
          BeAware.fyi is not a government agency, law enforcement entity, or official reporting channel for scams. 
          If you have been the victim of a scam, we encourage you to report it to the appropriate authorities, such as:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>Local police department</li>
          <li>Federal Trade Commission (FTC)</li>
          <li>FBI's Internet Crime Complaint Center (IC3)</li>
          <li>Your state's Attorney General's office</li>
          <li>Financial institutions involved in any transactions</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Educational Videos</h2>
        <p className="mb-4">
          The educational videos featured on BeAware.fyi may include content from third-party sources such as YouTube. 
          These videos are provided for educational purposes only, and BeAware.fyi does not claim ownership of this content 
          unless explicitly stated. We respect all applicable copyright laws and credit original content creators.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Limitation of Liability</h2>
        <p className="mb-4">
          To the maximum extent permitted by law, BeAware.fyi and its operators shall not be liable for any 
          direct, indirect, incidental, special, consequential, or punitive damages, including but not limited to, 
          damages for loss of profits, goodwill, use, data, or other intangible losses resulting from:
        </p>
        <ul className="list-disc pl-6 mb-4">
          <li>The use or inability to use the service</li>
          <li>Any inaccuracies or errors in user-submitted content</li>
          <li>Unauthorized access to or use of our servers and/or personal information stored therein</li>
          <li>Any interruption or cessation of transmission to or from our service</li>
          <li>Any viruses, trojan horses, or other harmful materials that may be transmitted through our service</li>
        </ul>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Indemnification</h2>
        <p className="mb-4">
          You agree to defend, indemnify, and hold harmless BeAware.fyi and its operators from and against any 
          claims, liabilities, damages, losses, and expenses, including, without limitation, reasonable attorney's 
          fees and costs, arising out of or in any way connected with your access to or use of the service or your 
          violation of these terms.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Changes to This Disclaimer</h2>
        <p className="mb-4">
          BeAware.fyi reserves the right to modify or replace this disclaimer at any time. We will notify users 
          of any changes by posting the updated disclaimer on this page. Your continued use of the site after any 
          such changes constitutes your acceptance of the new disclaimer.
        </p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p className="mb-4">
          If you have any questions about this disclaimer, please contact us at beaware.fyi@gmail.com.
        </p>
      </div>
    </div>
  );
}