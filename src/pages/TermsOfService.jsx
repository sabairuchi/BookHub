import React from 'react';
import SEO from '../components/SEO';
import './PolicyPages.css';

const TermsOfService = () => {
  return (
    <div className="policy-page container">
      <SEO title="Terms of Service" description="Read the Terms of Service for using the Book Hub platform." />
      
      <div className="policy-header">
        <h1>Terms of Service</h1>
        <p>Last Updated: October 2023</p>
      </div>

      <div className="policy-content">
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing or using the Book Hub website, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.</p>

        <h2>2. Eligibility</h2>
        <p>You must be at least 18 years of age to make purchases on this site. By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence.</p>

        <h2>3. Account Responsibility</h2>
        <p>If you create an account on our website, you are responsible for maintaining the security of your account and password. You are fully responsible for all activities that occur under the account. You must immediately notify Book Hub of any unauthorized uses of your account or any other breaches of security.</p>

        <h2>4. Product Availability & Pricing</h2>
        <p>All descriptions of products or product pricing are subject to change at any time without notice, at our sole discretion. We reserve the right to discontinue any product at any time. We do not warrant that the quality of any products, services, or information purchased or obtained by you will meet your expectations.</p>

        <h2>5. Orders and Payment</h2>
        <p>We reserve the right to refuse any order you place with us. In the event that we make a change to or cancel an order, we may attempt to notify you by contacting the e-mail and/or billing address/phone number provided at the time the order was made. We accept various payment methods, which are billed at the time your order is placed.</p>

        <h2>6. Shipping and Returns</h2>
        <p>Please review our Shipping Policy and Return Policy, which govern the delivery and return of our products, respectively. These policies form part of these Terms of Service.</p>

        <h2>7. Intellectual Property</h2>
        <p>All content included on this site, such as text, graphics, logos, images, audio clips, digital downloads, data compilations, and software, is the property of Book Hub or its content suppliers and protected by international copyright laws.</p>

        <h2>8. Limitation of Liability</h2>
        <p>In no case shall Book Hub, our directors, officers, employees, affiliates, agents, contractors, interns, suppliers, service providers or licensors be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind, including, without limitation lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages.</p>

        <h2>9. Governing Law</h2>
        <p>These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of the jurisdiction in which Book Hub operates.</p>

        <h2>10. Contact Details</h2>
        <p>Questions about the Terms of Service should be sent to us at:</p>
        <p>Email: legal@bookhub.com<br/>Phone: 1-800-BOOK-HUB</p>
      </div>
    </div>
  );
};

export default TermsOfService;
