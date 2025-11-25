import React from 'react';
import { Link } from 'react-router-dom';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <div className="privacy-policy-page">
      <div className="privacy-container">
        <div className="privacy-header">
          <Link to="/chat" className="back-button">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Chats
          </Link>
          <h1>Privacy Policy</h1>
          <p className="last-updated">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="privacy-content">
          <section className="policy-section">
            <h2>🔒 Message Security & End-to-End Encryption</h2>
            <div className="security-notice">
              <div className="security-badge">
                <span className="security-icon">🔒</span>
                <strong>End-to-End Encrypted</strong>
              </div>
              <p>Your personal messages and calls in King Ice Quiz Chat are secured with end-to-end encryption. This means only you and the person you're communicating with can read or listen to them, and nobody in between, not even King Ice Quiz.</p>
            </div>
          </section>

          <section className="policy-section">
            <h2>📱 Information We Collect</h2>
            <div className="info-grid">
              <div className="info-card">
                <h3>Account Information</h3>
                <p>When you create an account, we collect your username, email address, and profile information to provide our services.</p>
              </div>
              <div className="info-card">
                <h3>Chat Messages</h3>
                <p>Your messages are end-to-end encrypted and stored temporarily to deliver them to recipients. We cannot read the contents of your messages.</p>
              </div>
              <div className="info-card">
                <h3>Quiz Data</h3>
                <p>We collect your quiz scores, progress, and performance data to provide personalized learning experiences and track your improvement.</p>
              </div>
              <div className="info-card">
                <h3>Technical Information</h3>
                <p>We collect device information, IP addresses, and usage data to improve our services and ensure security.</p>
              </div>
            </div>
          </section>

          <section className="policy-section">
            <h2>🛡️ How We Use Your Information</h2>
            <ul className="usage-list">
              <li>
                <strong>Provide Services:</strong> To operate, maintain, and improve King Ice Quiz features
              </li>
              <li>
                <strong>Personalization:</strong> To customize your learning experience and recommend relevant quizzes
              </li>
              <li>
                <strong>Communication:</strong> To send you important updates about our services
              </li>
              <li>
                <strong>Security:</strong> To protect our services and users from fraud and abuse
              </li>
              <li>
                <strong>Analytics:</strong> To understand how users interact with our platform and improve it
              </li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>🔐 Data Security</h2>
            <div className="security-features">
              <div className="security-item">
                <span className="feature-icon">🔒</span>
                <div>
                  <h4>End-to-End Encryption</h4>
                  <p>All private messages are encrypted so only you and the recipient can read them.</p>
                </div>
              </div>
              <div className="security-item">
                <span className="feature-icon">🛡️</span>
                <div>
                  <h4>Secure Storage</h4>
                  <p>Your data is stored on secure servers with industry-standard protection measures.</p>
                </div>
              </div>
              <div className="security-item">
                <span className="feature-icon">🔍</span>
                <div>
                  <h4>Regular Audits</h4>
                  <p>We regularly review and update our security practices to protect your information.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="policy-section">
            <h2>📤 Data Sharing</h2>
            <p>We do not sell your personal information to third parties. We may share information only in the following circumstances:</p>
            <ul className="sharing-list">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect the rights and safety of our users</li>
              <li>With service providers who assist in operating our platform (under strict confidentiality agreements)</li>
            </ul>
          </section>

          <section className="policy-section">
            <h2>🗑️ Your Rights & Choices</h2>
            <div className="rights-grid">
              <div className="right-card">
                <h3>Access Your Data</h3>
                <p>You can access and download your personal data from your profile settings.</p>
              </div>
              <div className="right-card">
                <h3>Delete Account</h3>
                <p>You can permanently delete your account and associated data at any time.</p>
              </div>
              <div className="right-card">
                <h3>Control Communications</h3>
                <p>Manage your email preferences and notifications in your account settings.</p>
              </div>
              <div className="right-card">
                <h3>Export Data</h3>
                <p>Request a copy of all your personal data we have stored.</p>
              </div>
            </div>
          </section>

          <section className="policy-section">
            <h2>🌍 International Data Transfers</h2>
            <p>Your data may be processed on servers located outside of your country. We ensure appropriate safeguards are in place to protect your data in accordance with this privacy policy.</p>
          </section>

          <section className="policy-section">
            <h2>📝 Changes to This Policy</h2>
            <p>We may update this privacy policy from time to time. We will notify you of any significant changes by posting the new policy on this page and updating the "Last Updated" date.</p>
          </section>

          <section className="policy-section">
            <h2>📞 Contact Us</h2>
            <div className="contact-info">
              <p>If you have any questions about this Privacy Policy or our data practices, please contact us:</p>
              <div className="contact-methods">
                <div className="contact-method">
                  <strong>Email:</strong> olubiyiisaacanu@gmail.com
                </div>
                <div className="contact-method">
                  <strong>Address:</strong> King Ice Quiz Team, Nigeria
                </div>
              </div>
            </div>
          </section>

          <div className="policy-footer">
            <p>By using King Ice Quiz, you agree to the collection and use of information in accordance with this policy.</p>
            <div className="trust-badges">
              <span className="trust-badge">🔒 Secure</span>
              <span className="trust-badge">🛡️ Protected</span>
              <span className="trust-badge">✓ Trusted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;