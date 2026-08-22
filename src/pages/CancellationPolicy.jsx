import React from 'react';
import SEO from '../components/SEO';
import './PolicyPages.css';

const CancellationPolicy = () => {
  return (
    <div className="policy-page container">
      <SEO title="Cancellation Policy" description="Information regarding how to cancel an order at Book Hub." />
      
      <div className="policy-header">
        <h1>Cancellation Policy</h1>
        <p>Need to cancel your order? Here is everything you need to know.</p>
      </div>

      <div className="policy-content">
        <h2>Order Cancellation Before Shipping</h2>
        <p>You can cancel your order for a full refund as long as it has not yet been dispatched from our warehouse. Orders are typically processed within 12-24 hours. To request a cancellation, please immediately contact our support team at support@bookhub.com or use the cancellation option in your Order History dashboard.</p>

        <h2>Cancellation After Shipping</h2>
        <p>Once an order has been handed over to our shipping partners and a tracking number has been generated, it cannot be cancelled. In this case, you must wait for the package to be delivered and then initiate a return process as outlined in our Return & Refund Policy.</p>

        <h2>Refund Timelines</h2>
        <p>If your cancellation request is approved before shipping, we will process the refund immediately. The time it takes for the funds to reflect in your account depends on your payment method:</p>
        <ul>
          <li><strong>Credit/Debit Cards:</strong> 5-7 business days</li>
          <li><strong>UPI:</strong> 1-3 business days</li>
          <li><strong>PayPal:</strong> 1-3 business days</li>
        </ul>

        <h2>Exceptions</h2>
        <p>Digital products, such as eBooks or audiobooks, are delivered instantly and are completely exempt from cancellation once the purchase is confirmed.</p>

        <h2>Customer Support Information</h2>
        <p>If you have any issues cancelling your order or have questions about this policy, please reach out to us:</p>
        <ul>
          <li>Email: support@bookhub.com</li>
          <li>Phone: 1-800-BOOK-HUB (Mon-Fri, 9am - 6pm)</li>
        </ul>
      </div>
    </div>
  );
};

export default CancellationPolicy;
