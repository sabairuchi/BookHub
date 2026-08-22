import React from 'react';
import { CreditCard, Smartphone, DollarSign, Wallet } from 'lucide-react';

const PaymentMethods = ({ formData, handleChange, handlePaymentMethodChange, errors }) => {
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
          className={`payment-method-btn ${formData.paymentMethod === 'paypal' ? 'selected' : ''}`}
          onClick={() => handlePaymentMethodChange('paypal')}
        >
          <Wallet size={24} />
          PayPal
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
          <div className="form-group">
            <label>Card Number *</label>
            <input 
              type="text" 
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleChange}
              className={errors.cardNumber ? 'error' : ''}
              placeholder="0000 0000 0000 0000"
              maxLength="19"
            />
            {errors.cardNumber && <span className="error-msg">{errors.cardNumber}</span>}
          </div>
          <div className="form-group">
            <label>Cardholder Name *</label>
            <input 
              type="text" 
              name="cardName"
              value={formData.cardName}
              onChange={handleChange}
              className={errors.cardName ? 'error' : ''}
              placeholder="Name on card"
            />
            {errors.cardName && <span className="error-msg">{errors.cardName}</span>}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date *</label>
              <input 
                type="text" 
                name="cardExpiry"
                value={formData.cardExpiry}
                onChange={handleChange}
                className={errors.cardExpiry ? 'error' : ''}
                placeholder="MM/YY"
                maxLength="5"
              />
              {errors.cardExpiry && <span className="error-msg">{errors.cardExpiry}</span>}
            </div>
            <div className="form-group">
              <label>CVV *</label>
              <input 
                type="password" 
                name="cardCvv"
                value={formData.cardCvv}
                onChange={handleChange}
                className={errors.cardCvv ? 'error' : ''}
                placeholder="123"
                maxLength="4"
              />
              {errors.cardCvv && <span className="error-msg">{errors.cardCvv}</span>}
            </div>
          </div>
        </div>
      )}

      {formData.paymentMethod === 'upi' && (
        <div className="payment-details">
          <div className="form-group">
            <label>UPI ID *</label>
            <input 
              type="text" 
              name="upiId"
              value={formData.upiId}
              onChange={handleChange}
              className={errors.upiId ? 'error' : ''}
              placeholder="username@bank"
            />
            {errors.upiId && <span className="error-msg">{errors.upiId}</span>}
          </div>
        </div>
      )}

      {formData.paymentMethod === 'paypal' && (
        <div className="payment-details">
          <p className="payment-msg">You will be redirected to PayPal to complete your purchase securely.</p>
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
