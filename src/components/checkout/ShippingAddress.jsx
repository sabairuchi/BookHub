import React from 'react';

const ShippingAddress = ({ formData, handleChange, errors }) => {
  return (
    <>
      <div className="checkout-section">
        <h2>Contact Information</h2>
        <div className="form-row">
          <div className="form-group">
            <label>Email Address *</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
              placeholder="Enter your email"
            />
            {errors.email && <span className="error-msg">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label>Phone Number *</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
              placeholder="Enter your phone number"
            />
            {errors.phone && <span className="error-msg">{errors.phone}</span>}
          </div>
        </div>
      </div>

      <div className="checkout-section">
        <h2>Shipping Address</h2>
        <div className="form-row">
          <div className="form-group">
            <label>First Name *</label>
            <input 
              type="text" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleChange}
              className={errors.firstName ? 'error' : ''}
              placeholder="First name"
            />
            {errors.firstName && <span className="error-msg">{errors.firstName}</span>}
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input 
              type="text" 
              name="lastName" 
              value={formData.lastName} 
              onChange={handleChange}
              className={errors.lastName ? 'error' : ''}
              placeholder="Last name"
            />
            {errors.lastName && <span className="error-msg">{errors.lastName}</span>}
          </div>
        </div>
        
        <div className="form-group">
          <label>Full Address *</label>
          <input 
            type="text" 
            name="address" 
            value={formData.address} 
            onChange={handleChange}
            className={errors.address ? 'error' : ''}
            placeholder="Street address, apartment, suite, etc."
          />
          {errors.address && <span className="error-msg">{errors.address}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>City *</label>
            <input 
              type="text" 
              name="city" 
              value={formData.city} 
              onChange={handleChange}
              className={errors.city ? 'error' : ''}
              placeholder="City"
            />
            {errors.city && <span className="error-msg">{errors.city}</span>}
          </div>
          <div className="form-group">
            <label>State/Province *</label>
            <input 
              type="text" 
              name="state" 
              value={formData.state} 
              onChange={handleChange}
              className={errors.state ? 'error' : ''}
              placeholder="State"
            />
            {errors.state && <span className="error-msg">{errors.state}</span>}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>ZIP / Postal Code *</label>
            <input 
              type="text" 
              name="zipCode" 
              value={formData.zipCode} 
              onChange={handleChange}
              className={errors.zipCode ? 'error' : ''}
              placeholder="ZIP code"
            />
            {errors.zipCode && <span className="error-msg">{errors.zipCode}</span>}
          </div>
          <div className="form-group">
            <label>Country *</label>
            <input 
              type="text" 
              name="country" 
              value={formData.country} 
              onChange={handleChange}
              className={errors.country ? 'error' : ''}
              placeholder="Country"
            />
            {errors.country && <span className="error-msg">{errors.country}</span>}
          </div>
        </div>
      </div>
    </>
  );
};

export default ShippingAddress;
