import { PrivacyContactLink } from '@/components/PrivacyContactLink';

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">Cookie Policy</h1>
      <p className="mb-4">
        This Cookie Policy explains how OpenQase (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.
      </p>

      <h2 className="text-2xl font-semibold mb-2">1. What are cookies?</h2>
      <p className="mb-4">
        Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
      </p>
      <p className="mb-4">
        Cookies set by the website owner (in this case, OpenQase) are called &ldquo;first-party cookies&rdquo;. Cookies set by parties other than the website owner are called &ldquo;third-party cookies&rdquo;. Third-party cookies enable third-party features or functionality to be provided on or through the website (e.g., advertising, interactive content, and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.
      </p>

      <h2 className="text-2xl font-semibold mb-2">2. Why do we use cookies?</h2>
      <p className="mb-4">
        We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our website to operate, and we refer to these as &ldquo;essential&rdquo; or &ldquo;strictly necessary&rdquo; cookies. Other cookies also enable us to track and target the interests of our users to enhance the experience on our Online Properties. Third parties serve cookies through our website for advertising, analytics, and other purposes. This is described in more detail below.
      </p>

      <h2 className="text-2xl font-semibold mb-2">3. Types of cookies we use</h2>
      <ul className="list-disc list-inside mb-4">
        <li className="font-semibold">Essential website cookies:</li>
        <p className="mb-2 ml-4">These cookies are strictly necessary to provide you with services available through our website and to use some of its features, such as access to secure areas.</p>
        <li className="font-semibold">Performance and functionality cookies:</li>
        <p className="mb-2 ml-4">These cookies are used to enhance the performance and functionality of our website but are non-essential to their use. However, without these cookies, certain functionality may become unavailable.</p>
        <li className="font-semibold">Analytics and customization cookies:</li>
        <p className="mb-2 ml-4">These cookies collect information that is used either in aggregate form to help us understand how our website is being used or how effective our marketing campaigns are, or to help us customize our website for you.</p>
        <li className="font-semibold">Advertising cookies:</li>
        <p className="mb-2 ml-4">These cookies are used to make advertising messages more relevant to you. They perform functions like preventing the same ad from continuously reappearing, ensuring that ads are properly displayed for advertisers, and in some cases selecting advertisements that are based on your interests.</p>
      </ul>

      <h2 className="text-2xl font-semibold mb-2">4. How can I control cookies?</h2>
      <p className="mb-4">
        You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent Manager. The Cookie Consent Manager allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.
      </p>
      <p className="mb-4">
        The Cookie Consent Manager can be found in the notification banner and on our website. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.
      </p>

      <h2 className="text-2xl font-semibold mb-2">5. Changes to this Cookie Policy</h2>
      <p className="mb-4">
        We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use or for other operational, legal or regulatory reasons. Please therefore re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
      </p>

      <h2 className="text-2xl font-semibold mb-2">6. Where can I get further information?</h2>
      <p className="mb-4">
        If you have any questions about our use of cookies or other technologies, please contact us via <PrivacyContactLink />.
      </p>
    </div>
  );
} 