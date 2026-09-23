import { PrivacyContactLink } from '@/components/PrivacyContactLink';

export default function TermsOfUsePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Terms of Use</h1>
      <p className="mb-4">
        Welcome to OpenQase! These Terms of Use (&ldquo;Terms&rdquo;) govern your access to and use of our website and services (collectively, the &ldquo;Service&rdquo;). Please read these Terms carefully before using the Service.
      </p>

      <h2 className="text-2xl font-semibold mb-2">1. Acceptance of Terms</h2>
      <p className="mb-4">
        By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, do not use the Service.
      </p>

      <h2 className="text-2xl font-semibold mb-2">2. Changes to Terms</h2>
      <p className="mb-4">
        We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the new Terms on this page. Your continued use of the Service after any such changes constitutes your acceptance of the new Terms.
      </p>

      <h2 className="text-2xl font-semibold mb-2">3. Use of the Service</h2>
      <p className="mb-4">
        You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to use the Service:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li>In any way that violates any applicable federal, state, local, or international law or regulation.</li>
        <li>To engage in any conduct that restricts or inhibits anyone&apos;s use or enjoyment of the Service, or which, as determined by us, may harm OpenQase or users of the Service or expose them to liability.</li>
        <li>To impersonate or attempt to impersonate OpenQase, an OpenQase employee, another user, or any other person or entity.</li>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">4. Intellectual Property</h2>
      <p className="mb-4">
        The Service and its original content, features, and functionality are and will remain the exclusive property of OpenQase and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
      </p>

      <h2 className="text-2xl font-semibold mb-2">5. Termination</h2>
      <p className="mb-4">
        We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
      </p>

      <h2 className="text-2xl font-semibold mb-2">6. Disclaimer of Warranties</h2>
      <p className="mb-4">
        The Service is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis. OpenQase makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
      </p>

      <h2 className="text-2xl font-semibold mb-2">7. Limitation of Liability</h2>
      <p className="mb-4">
        In no event shall OpenQase, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.
      </p>

      <h2 className="text-2xl font-semibold mb-2">8. Governing Law</h2>
      <p className="mb-4">
        These Terms shall be governed and construed in accordance with the laws of Australia, without regard to its conflict of law provisions.
      </p>

      <h2 className="text-2xl font-semibold mb-2">9. Contact Us</h2>
      <p className="mb-4">
        If you have any questions about these Terms, please contact us via <PrivacyContactLink />.
      </p>
    </div>
  );
} 