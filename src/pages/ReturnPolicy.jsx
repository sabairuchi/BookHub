import React from 'react';
import SEO from '../components/SEO';
import './PolicyPages.css';

const ReturnPolicy = () => {
  return (
    <div className="policy-page container">
      <SEO title="Return & Refund Policy" description="Information regarding returns, exchanges, and refunds at Book Hub." />
      
      <div className="policy-header">
        <h1>Return & Refund Policy</h1>
        <p>We want you to love your books. If you don't, we're here to help.</p>
      </div>

      <div className="policy-content">
        <h2>Return Eligibility & Window</h2>
        <p>We accept returns of physical books within 30 days of the original delivery date. To be eligible for a return, your item must be unused, in the same condition that you received it, and in the original packaging.</p>

        <h2>Damaged Books or Wrong Product Received</h2>
        <p>If you receive a book that is damaged or defective, or if you receive the wrong title, please contact us immediately (within 48 hours of delivery) at support@bookhub.com with photos of the issue. We will arrange for a replacement to be sent to you at no additional cost, or issue a full refund including shipping charges.</p>

        <h2>Non-returnable Items</h2>
        <p>Several types of goods are exempt from being returned:</p>
        <ul>
          <li>Gift cards</li>
          <li>Downloadable software products or eBooks</li>
          <li>Books that show obvious signs of use, folded pages, or broken spines</li>
        </ul>

        <h2>The Exchange Process</h2>
        <p>We only replace items if they are defective or damaged. If you need to exchange it for the same item, send us an email at support@bookhub.com. If you want to exchange for a different title, you will need to return the original item and place a new order.</p>

        <h2>Refund Processing Time & Methods</h2>
        <p>Once your return is received and inspected, we will send you an email to notify you that we have received your returned item. We will also notify you of the approval or rejection of your refund.</p>
        <p>If approved, your refund will be processed, and a credit will automatically be applied to your original method of payment (Credit Card, PayPal, or UPI) within 5-7 business days.</p>
        <p>For Cash on Delivery (COD) orders, refunds will be issued to your bank account via NEFT/IMPS transfer. We will request your bank details when approving the refund.</p>

        <h2>Late or Missing Refunds</h2>
        <p>If you haven’t received a refund yet, first check your bank account again. Then contact your credit card company, it may take some time before your refund is officially posted. Next, contact your bank. There is often some processing time before a refund is posted.</p>
        <p>If you’ve done all of this and you still have not received your refund, please contact us at support@bookhub.com.</p>
      </div>
    </div>
  );
};

export default ReturnPolicy;
