import React from 'react';
import SEO from '../components/SEO';
import './PolicyPages.css';

const ShippingPolicy = () => {
  return (
    <div className="policy-page container">
      <SEO title="Shipping Policy" description="Information about Book Hub's shipping methods, delivery times, and costs." />
      
      <div className="policy-header">
        <h1>Shipping Policy</h1>
        <p>Learn how and when your books will be delivered.</p>
      </div>

      <div className="policy-content">
        <h2>Processing Time</h2>
        <p>All orders are processed within 1-2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped.</p>
        <p>During high volume periods (such as holidays or major book releases), processing may take an additional 1-2 days.</p>

        <h2>Shipping Methods & Estimated Delivery Times</h2>
        <p>We offer the following shipping methods:</p>
        <ul>
          <li><strong>Standard Shipping:</strong> 3-5 business days</li>
          <li><strong>Express Shipping:</strong> 1-2 business days</li>
        </ul>

        <h2>Shipping Charges & Free Shipping</h2>
        <p>Shipping charges for your order will be calculated and displayed at checkout.</p>
        <ul>
          <li><strong>Standard Shipping:</strong> Free for all orders within the country.</li>
          <li><strong>Express Shipping:</strong> A flat rate of $199.00 applies to all express orders.</li>
        </ul>

        <h2>International Shipping</h2>
        <p>Currently, we ship to select international destinations. International shipping rates vary based on the destination and package weight. Estimated delivery for international orders is 7-14 business days. Customers are responsible for any customs and import taxes that may apply.</p>

        <h2>Delivery Delays</h2>
        <p>While we strive to ensure timely delivery, Book Hub is not liable for delays caused by the courier company, postal service, or unforeseen natural circumstances. If your order is significantly delayed, please contact our support team.</p>

        <h2>Lost Packages & Incorrect Addresses</h2>
        <p>Book Hub is not responsible for lost or stolen packages confirmed to be delivered to the address entered for an order. We are also not responsible for orders shipped to incorrect or invalid addresses provided by the customer. Please verify your address at checkout.</p>
        <p>If your package is marked as delivered but you haven't received it, please contact the courier directly using your tracking number.</p>

        <h2>Order Tracking</h2>
        <p>When your order has shipped, you will receive an email notification from us which will include a tracking number you can use to check its status. Please allow 24 hours for the tracking information to become available.</p>
        <p>You can also use our Track Order page to check your order's real-time status.</p>
      </div>
    </div>
  );
};

export default ShippingPolicy;
