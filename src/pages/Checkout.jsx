import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../context/ShopContext';
import SEO from '../components/SEO';
import ShippingAddress from '../components/checkout/ShippingAddress';
import PaymentMethods from '../components/checkout/PaymentMethods';
import OrderSummary from '../components/checkout/OrderSummary';
import { orderAPI } from '../services/api';
import './Checkout.css';

const Checkout = () => {
  const { cart, cartTotal, clearCart, user, openLoginModal } = useShop();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) {
      openLoginModal();
      navigate('/cart');
    }
  }, [user, navigate, openLoginModal]);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    shippingMethod: 'standard',
    paymentMethod: 'card',
    cardNumber: '',
    cardName: '',
    cardExpiry: '',
    cardCvv: '',
    upiId: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);

  const shippingCost = formData.shippingMethod === 'express' ? 199 : 0;

  useEffect(() => {
    if (cart.length === 0 && !isSubmitting) {
      navigate('/cart');
    }
  }, [cart, navigate, isSubmitting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePaymentMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
  };

  const handleApplyCoupon = () => {
    if (couponCode.toLowerCase() === 'bookhub10') {
      setDiscount(cartTotal * 0.1);
      alert('10% discount applied!');
    } else {
      setDiscount(0);
      alert('Invalid coupon code. Try BOOKHUB10');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const requiredFields = ['email', 'phone', 'firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'country'];
    
    requiredFields.forEach(field => {
      if (!formData[field].trim()) {
        newErrors[field] = 'This field is required';
      }
    });

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    // Since card and UPI inputs are securely handled inside the Razorpay Checkout overlay,
    // we do not require local card/UPI field validations.
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      
      const finalTotal = cartTotal + shippingCost - discount;
      const orderData = {
        ...formData,
        total: finalTotal,
        couponCode,
        items: cart.map(item => ({ id: item.id, quantity: item.quantity, price: item.price }))
      };

      // 1. Cash on Delivery Flow
      if (formData.paymentMethod === 'cod') {
        try {
          const newOrder = await orderAPI.createOrder(orderData);
          await clearCart();
          navigate('/order-success', { state: { order: newOrder } });
        } catch (err) {
          console.error("Error creating COD order:", err);
          alert(err.response?.data?.message || 'Failed to place order. Please try again.');
          setIsSubmitting(false);
        }
        return;
      }

      // 2. Razorpay Payment Gateway Flow
      try {
        if (!window.Razorpay) {
          alert("Payment gateway SDK failed to load. Please check your internet connection and try again.");
          setIsSubmitting(false);
          return;
        }

        // Call backend to create Razorpay Order
        const rzpSession = await orderAPI.createRazorpayOrder({
          shippingMethod: formData.shippingMethod,
          couponCode: couponCode
        });

        // 3. Simulation Mode for Placeholder Keys
        const isPlaceholder = rzpSession.key_id === 'rzp_test_your_key_id' || !rzpSession.key_id || rzpSession.key_id.includes('your_key_id');

        if (isPlaceholder) {
          const confirmPayment = window.confirm(
            `[Demo Mode] Simulating secure payment via Razorpay\n\nTotal Amount: $${finalTotal.toFixed(2)}\n\nClick OK to simulate payment success, or Cancel to simulate payment failure.`
          );

          if (confirmPayment) {
            const mockResponse = {
              razorpay_order_id: rzpSession.order_id,
              razorpay_payment_id: 'pay_mock_' + Math.floor(100000 + Math.random() * 900000),
              razorpay_signature: 'sig_mock_' + Math.floor(100000 + Math.random() * 900000)
            };

            const paymentDetails = {
              razorpay_order_id: mockResponse.razorpay_order_id,
              razorpay_payment_id: mockResponse.razorpay_payment_id,
              razorpay_signature: mockResponse.razorpay_signature,
              checkoutData: orderData
            };

            const verifiedOrder = await orderAPI.verifyPayment(paymentDetails);
            await clearCart();
            navigate('/order-success', { state: { order: verifiedOrder } });
          } else {
            console.log("Mock payment cancelled by user.");
            setIsSubmitting(false);
          }
          return;
        }

        const options = {
          key: rzpSession.key_id,
          amount: rzpSession.amount,
          currency: rzpSession.currency,
          name: "BookHub",
          description: "Purchase of Books",
          order_id: rzpSession.order_id,
          handler: async function (response) {
            try {
              // Send payment details to backend for verification
              const paymentDetails = {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                checkoutData: orderData
              };
              const verifiedOrder = await orderAPI.verifyPayment(paymentDetails);
              await clearCart();
              navigate('/order-success', { state: { order: verifiedOrder } });
            } catch (verifErr) {
              console.error("Payment verification failed:", verifErr);
              alert(verifErr.response?.data?.message || 'Payment verification failed. Please contact support.');
              setIsSubmitting(false);
            }
          },
          prefill: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            contact: formData.phone
          },
          theme: {
            color: "#0F4C81"
          },
          modal: {
            ondismiss: function () {
              console.log("Razorpay payment modal closed by the user.");
              setIsSubmitting(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        console.error("Razorpay order creation failed:", err);
        alert(err.response?.data?.message || 'Failed to initiate secure payment. Please try again.');
        setIsSubmitting(false);
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (cart.length === 0 && !isSubmitting) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="checkout-page container">
      <SEO title="Checkout" description="Complete your secure purchase at Book Hub." />
      <h1>Checkout</h1>
      
      <form onSubmit={handleSubmit} className="checkout-grid">
        <div className="checkout-form-container">
          <ShippingAddress 
            formData={formData} 
            handleChange={handleChange} 
            errors={errors} 
          />
          
          <div className="checkout-section">
            <h2>Shipping Method</h2>
            <div className="radio-options">
              <label className={`radio-card ${formData.shippingMethod === 'standard' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="shippingMethod" 
                  value="standard" 
                  checked={formData.shippingMethod === 'standard'}
                  onChange={handleChange}
                />
                <div className="radio-label-content">
                  <span className="radio-title">Standard Delivery</span>
                  <span className="radio-subtitle">3-5 business days</span>
                </div>
                <span className="radio-price">Free</span>
              </label>
              <label className={`radio-card ${formData.shippingMethod === 'express' ? 'selected' : ''}`}>
                <input 
                  type="radio" 
                  name="shippingMethod" 
                  value="express" 
                  checked={formData.shippingMethod === 'express'}
                  onChange={handleChange}
                />
                <div className="radio-label-content">
                  <span className="radio-title">Express Delivery</span>
                  <span className="radio-subtitle">1-2 business days</span>
                </div>
                <span className="radio-price">+$199.00</span>
              </label>
            </div>
          </div>

          <PaymentMethods 
            formData={formData} 
            handleChange={handleChange} 
            handlePaymentMethodChange={handlePaymentMethodChange}
            errors={errors}
          />
        </div>
        
        <OrderSummary 
          cart={cart}
          cartTotal={cartTotal}
          shippingCost={shippingCost}
          discount={discount}
          couponCode={couponCode}
          setCouponCode={setCouponCode}
          handleApplyCoupon={handleApplyCoupon}
          isSubmitting={isSubmitting}
        />
      </form>
    </div>
  );
};

export default Checkout;
