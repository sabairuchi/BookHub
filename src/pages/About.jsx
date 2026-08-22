import React from 'react';
import { BookOpen, Users, Truck, ShieldCheck } from 'lucide-react';
import SEO from '../components/SEO';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      <SEO title="About Us" description="Learn about Book Hub's story, mission, and why we're the best place to buy books online." />
      
      <div className="about-hero">
        <div className="container about-hero-container">
          <div className="about-hero-content">
            <h1>Our Story</h1>
            <p>Connecting readers with their next favorite book since 2015. We believe in the magic of stories and the power of knowledge.</p>
          </div>
        </div>
      </div>

      <div className="container">
        <section className="about-section story-section">
          <div className="about-text">
            <h2>The Book Hub Journey</h2>
            <p>What started as a small local bookstore has grown into a global community of readers. Book Hub was founded on a simple premise: everyone should have access to great literature, regardless of where they live.</p>
            <p>Today, we stock over 10,000 titles across all genres. Our dedicated team of bibliophiles works tirelessly to curate the best collections, from timeless classics to modern bestsellers.</p>
          </div>
          <div className="about-image">
            <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&q=80&w=800" alt="Library interior" />
          </div>
        </section>

        <section className="about-section mission-section">
          <div className="about-image">
            <img src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800" alt="Person reading" />
          </div>
          <div className="about-text">
            <h2>Our Mission & Vision</h2>
            <h3>The Mission</h3>
            <p>To foster a lifelong love of reading by providing a vast, accessible, and affordable collection of books to readers worldwide.</p>
            <h3>The Vision</h3>
            <p>We envision a world where stories connect us all. We aim to be the most trusted and beloved platform for book discovery, empowering authors and inspiring readers in every corner of the globe.</p>
          </div>
        </section>

        <section className="why-choose-us-section">
          <h2 className="section-title">Why Choose Book Hub</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper"><BookOpen size={32} /></div>
              <h3>Massive Collection</h3>
              <p>Explore thousands of books across every imaginable genre, from indie authors to international bestsellers.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Users size={32} /></div>
              <h3>Customer Satisfaction</h3>
              <p>Our dedicated support team is here 24/7 to ensure your reading journey is perfectly smooth.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><Truck size={32} /></div>
              <h3>Fast Delivery</h3>
              <p>We partner with top logistics companies to ensure your books arrive quickly and safely at your doorstep.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon-wrapper"><ShieldCheck size={32} /></div>
              <h3>Secure Payments</h3>
              <p>Your transactions are 100% secure with our encrypted, industry-standard payment gateways.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
