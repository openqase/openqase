import { PrivacyContactLink } from '@/components/PrivacyContactLink';

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">
        Welcome to OpenQase! This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
      </p>

      <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
      <p className="mb-4">
        We may collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website or otherwise when you contact us.
      </p>
      <p className="mb-4">
        The personal information that we collect depends on the context of your interactions with us and the website, the choices you make and the products and features you use. The personal information we collect may include the following:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>Name</li>
        <li>Email address</li>
        <li>Contact information</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Information</h2>
      <p className="mb-4">
        We use personal information collected via our website for a variety of business purposes described below. We process your personal information for these purposes in reliance on our legitimate business interests, in order to enter into or perform a contract with you, with your consent, and/or for compliance with our legal obligations.
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>To provide, operate, and maintain our website</li>
        <li>To improve, personalize, and expand our website</li>
        <li>To understand and analyze how you use our website</li>
        <li>To develop new products, services, features, and functionality</li>
        <li>To communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the website, and for marketing and promotional purposes</li>
        <li>To send you emails</li>
        <li>To find and prevent fraud</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">3. Sharing Your Information</h2>
      <p className="mb-4">
        We may share your information with third-party vendors, service providers, contractors or agents who perform services for us or on our behalf and require access to such information to do that work. Examples include: payment processing, data analysis, email delivery, hosting services, customer service and marketing efforts.
      </p>

      <h2 className="text-2xl font-semibold mb-2">4. Security of Your Information</h2>
      <p className="mb-4">
        We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us, please be aware that despite our efforts, no security measures are perfect or impenetrable, and no method of data transmission can be guaranteed against any interception or other type of misuse.
      </p>

      <h2 className="text-2xl font-semibold mb-2">5. Changes to This Privacy Policy</h2>
      <p className="mb-4">
        We may update this Privacy Policy from time to time. The updated version will be indicated by an updated &quot;Revised&quot; date and the updated version will be effective as soon as it is accessible. We encourage you to review this Privacy Policy frequently to be informed of how we are protecting your information.
      </p>

      <h2 className="text-2xl font-semibold mb-2">6. Contact Us</h2>
      <p className="mb-4">
        If you have questions or comments about this Privacy Policy, please contact us via <PrivacyContactLink />.
      </p>
    </div>
  );
} 