import React, { useState } from 'react';
import SEO from '../components/SEO';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './FAQ.css';

const faqData = {
  "Ordering": [
    { question: "How do I place an order?", answer: "Browse our shop, add items to your cart, and proceed to checkout to complete your purchase securely." },
    { question: "Can I modify my order?", answer: "Orders can only be modified if they haven't shipped yet. Contact support immediately for modifications." },
    { question: "Can I cancel an order?", answer: "Yes, you can cancel an order before it is dispatched. See our Cancellation Policy for details." },
    { question: "Can I buy without creating an account?", answer: "Yes, you can checkout as a guest, but creating an account lets you track orders easily." },
    { question: "How do I reorder a previous purchase?", answer: "Log into your account, visit Order History, and click 'Reorder' next to your past purchase." }
  ],
  "Payments": [
    { question: "Which payment methods are accepted?", answer: "We accept Credit/Debit Cards, UPI, PayPal, and Cash on Delivery." },
    { question: "Is Cash on Delivery available?", answer: "Yes, Cash on Delivery is available for most locations within the country." },
    { question: "Is online payment secure?", answer: "Absolutely. We use industry-standard encryption and trusted third-party payment gateways." },
    { question: "Can I pay using UPI?", answer: "Yes, UPI is fully supported during checkout." },
    { question: "Why did my payment fail?", answer: "Payment failures can happen due to network issues or bank declines. Try again or use a different method." }
  ],
  "Shipping": [
    { question: "How long does shipping take?", answer: "Standard shipping takes 3-5 business days. Express shipping takes 1-2 business days." },
    { question: "Do you provide free shipping?", answer: "Yes, standard shipping is free on all domestic orders." },
    { question: "How do I track my order?", answer: "Use the 'Track Order' link in the footer with your Order ID and Email." },
    { question: "Do you deliver internationally?", answer: "Yes, we ship to select international destinations. Extra fees apply." },
    { question: "What happens if I'm unavailable during delivery?", answer: "The courier will typically try to deliver your package again the next business day." }
  ],
  "Returns": [
    { question: "How do I return a book?", answer: "Email support@bookhub.com within 30 days of delivery to initiate a return." },
    { question: "How long does refunds take?", answer: "Refunds take 5-7 business days to process after we receive the returned item." },
    { question: "Can I exchange a book?", answer: "We only process direct exchanges for damaged or defective items." },
    { question: "What if I receive a damaged book?", answer: "Contact us within 48 hours with photos, and we will send a replacement free of charge." },
    { question: "What if I receive the wrong book?", answer: "We will arrange a free pickup and dispatch the correct book immediately." }
  ],
  "Account": [
    { question: "How do I reset my password?", answer: "Click 'Forgot Password' on the login screen to receive a reset link." },
    { question: "How do I change my address?", answer: "Log in to your profile and navigate to 'Saved Addresses' to update it." },
    { question: "How do I update my profile?", answer: "Your profile details can be edited from your account dashboard." },
    { question: "How do I delete my account?", answer: "Contact support from your registered email address to request account deletion." }
  ],
  "Books": [
    { question: "Are all books original?", answer: "Yes, all our books are 100% original and sourced directly from verified publishers." },
    { question: "Are ebooks available?", answer: "Currently, we only sell physical books, but ebooks are coming soon!" },
    { question: "Can I preorder upcoming books?", answer: "Yes, highly anticipated books are available for preorder with special badges in the shop." },
    { question: "How do I know if a book is in stock?", answer: "Out of stock books will clearly display an 'Out of Stock' label on their product page." },
    { question: "Can I request a book that's unavailable?", answer: "Yes! Use our Contact form to suggest books you'd like us to stock." }
  ],
  "Technical": [
    { question: "Website not loading", answer: "Try clearing your browser cache or trying a different network." },
    { question: "Coupon not working", answer: "Ensure the coupon hasn't expired and you meet all cart requirements." },
    { question: "Unable to checkout", answer: "Make sure all required fields are filled out properly in the checkout form." },
    { question: "Cart items disappeared", answer: "Ensure you are logged in, or check if you cleared your browser cookies." },
    { question: "Login problems", answer: "Try resetting your password. If issues persist, contact support." }
  ]
};

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState("Ordering");
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setOpenIndex(null); // Close any open FAQ when switching categories
  };

  return (
    <div className="faq-page container">
      <SEO 
        title="Frequently Asked Questions" 
        description="Find answers to common questions about Book Hub orders, shipping, and returns." 
      />
      
      <div className="faq-header">
        <h1>Frequently Asked Questions</h1>
        <p>Can't find the answer you're looking for? Reach out to our customer support team.</p>
      </div>

      <div className="faq-layout">
        <div className="faq-sidebar">
          <h3>Categories</h3>
          <ul className="faq-category-list">
            {Object.keys(faqData).map((category) => (
              <li 
                key={category} 
                className={activeCategory === category ? 'active' : ''}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </li>
            ))}
          </ul>
        </div>

        <div className="faq-content">
          <h2>{activeCategory}</h2>
          <div className="faq-list">
            {faqData[activeCategory].map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openIndex === index ? 'active' : ''}`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="faq-question">
                  <h3>{faq.question}</h3>
                  {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
                {openIndex === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
