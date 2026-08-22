import React from 'react';
import SEO from '../components/SEO';
import './PolicyPages.css';

const PrivacyPolicy = () => {
  return (
    <div className="policy-page container">
      <SEO title="Privacy Policy" description="Learn how Book Hub collects, uses, and protects your personal information." />
      
      <div className="policy-header">
        <h1>Privacy Policy</h1>
        <p>Last Updated: October 2023</p>
      </div>

      <div className="policy-content">
        <h2>1. Information We Collect</h2>
        <p>At Book Hub, we respect your privacy and are committed to protecting the personal information you share with us. We collect information to provide better services to our users.</p>
        
        <h3>Personal Information</h3>
        <p>We may collect personal information that you provide to us when you register an account, make a purchase, subscribe to our newsletter, or contact our customer support. This includes:</p>
        <ul>
          <li>Name and Email address</li>
          <li>Shipping and Billing addresses</li>
          <li>Phone number</li>
          <li>Account credentials (usernames and passwords)</li>
        </ul>

        <h3>Payment Information</h3>
        <p>All payment transactions are processed through secure third-party payment gateways. We do not store your complete credit card numbers or UPI PINs on our servers. We only retain the transaction ID and basic payment status for accounting purposes.</p>

        <h2>2. Cookies & Analytics</h2>
        <p>We use cookies and similar tracking technologies to track activity on our website and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. We use them for:</p>
        <ul>
          <li>Maintaining your session (keeping you logged in)</li>
          <li>Remembering your cart contents</li>
          <li>Understanding how you use our website via Google Analytics</li>
        </ul>

        <h2>3. How Information is Used</h2>
        <p>The information we collect is used in various ways, including to:</p>
        <ul>
          <li>Process and fulfill your orders</li>
          <li>Communicate with you regarding your orders, inquiries, or support requests</li>
          <li>Send promotional emails and newsletters (you can opt-out at any time)</li>
          <li>Improve our website, product offerings, and customer service</li>
          <li>Prevent fraudulent transactions and monitor against theft</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information. Your personal information is contained behind secured networks and is only accessible by a limited number of persons who have special access rights.</p>

        <h2>5. Your User Rights</h2>
        <p>Depending on your location, you may have the right to:</p>
        <ul>
          <li>Access the personal data we hold about you</li>
          <li>Request correction of inaccurate data</li>
          <li>Request deletion of your personal data</li>
          <li>Opt-out of marketing communications</li>
        </ul>

        <h2>6. Third-Party Services</h2>
        <p>We may employ third-party companies and individuals due to the following reasons: to facilitate our Service, to provide the Service on our behalf, or to assist us in analyzing how our Service is used. These third parties have access to your Personal Information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>

        <h2>7. Children's Privacy</h2>
        <p>Our website is not intended for use by children under the age of 13. We do not knowingly collect personal identifiable information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.</p>

        <h2>8. Policy Updates</h2>
        <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.</p>

        <h2>9. Contact Information</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p>Email: privacy@bookhub.com<br/>Phone: 1-800-BOOK-HUB</p>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
