import React from 'react';
import { CreditCard, Smartphone, DollarSign } from 'lucide-react';

const PaymentMethods = ({ formData, handlePaymentMethodChange }) => {
  return (
    <div className="checkout-section">
      <h2>Payment Method</h2>
      
      <div className="payment-methods">
        <button 
          type="button"
          className={`payment-method-btn ${formData.paymentMethod === 'card' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethodChange('card')}
        >
          <CreditCard size={24} />
          Credit/Debit Card
        </button>
        <button 
          type="button"
          className={`payment-method-btn ${formData.paymentMethod === 'upi' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethodChange('upi')}
        >
          <Smartphone size={24} />
          UPI
        </button>
        <button 
          type="button"
          className={`payment-method-btn ${formData.paymentMethod === 'cod' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethodChange('cod')}
        >
          <DollarSign size={24} />
          Cash on Delivery
        </button>
      </div>

      {formData.paymentMethod === 'card' && (
        <div className="payment-details">
          <p className="payment-msg">Credit/Debit Card payments are processed securely via the Razorpay Checkout overlay.</p>
        </div>
      )}

      {formData.paymentMethod === 'upi' && (
        <div className="payment-details">
          <p className="payment-msg">UPI payments (Google Pay, PhonePe, Paytm, etc.) are processed securely via the Razorpay Checkout overlay.</p>
        </div>
      )}

      {formData.paymentMethod === 'cod' && (
        <div className="payment-details">
          <p className="payment-msg">You will pay in cash when the order is delivered to your address.</p>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
