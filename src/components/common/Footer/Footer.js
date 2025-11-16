import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './Footer.css';

const Footer = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const currentYear = new Date().getFullYear();

  // Contact information
  const contactInfo = {
    name: 'Olubiyi Isaac Anu',
    email: 'olubiyiisaacanu@gmail.com',
    whatsapp: '+2348145659286',
    whatsappUrl: 'https://wa.me/2348145659286'
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">🧠</span>
              King Ice Quiz App
            </div>
            <p className="footer-description">
              {isAdmin 
                ? 'Admin dashboard for managing quizzes, questions, users, and platform managements.'
                : 'Test your knowledge with our interactive quiz platform. Challenge yourself and climb the leaderboards!'
              }
            </p>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              {!isAdmin && (
                <>
                  <li><Link to="/quizzes">Quizzes</Link></li>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                </>
              )}
              {isAdmin && (
                <li><Link to="/admin">Admin Dashboard</Link></li>
              )}
              {isAuthenticated && <li><Link to="/profile">Profile</Link></li>}
            </ul>
          </div>

          {/* REMOVED: Categories section for regular users */}

          {isAdmin && (
            <div className="footer-section">
              <h4 className="footer-title">Admin Resources</h4>
              <ul className="footer-links">
                <li><Link to="/admin/quizzes">Manage Quizzes</Link></li>
                <li><Link to="/admin">Admin Dashboard</Link></li>
                <li><Link to="/admin/users">User Management</Link></li>
                <li><Link to="/admin/results">View Results</Link></li>
              </ul>
            </div>
          )}

          <div className="footer-section">
            <h4 className="footer-title">Support</h4>
            <ul className="footer-links">
              <li>
                <a 
                  href="#help-center" 
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`📚 Help Center\n\nNeed assistance? Here's how we can help:\n\n• Quiz Instructions & Rules\n• Account Management Help\n• Technical Support\n• Bug Reports\n• Feature Requests\n\nContact us directly for personalized help!`);
                  }}
                >
                  Help Center
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`📞 Contact Us\n\nWe'd love to hear from you!\n\n👤 ${contactInfo.name}\n📧 Email: ${contactInfo.email}\n💬 WhatsApp: ${contactInfo.whatsapp}\n\nFeel free to reach out for:\n• Technical Support\n• Partnership Opportunities\n• Feedback & Suggestions\n• General Inquiries\n\nWe typically respond within 24 hours!`);
                  }}
                >
                  Contact Us
                </a>
              </li>
              <li>
                <a 
                  href="#privacy" 
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`🔒 Privacy Policy\n\nYour privacy is important to us.\n\nDATA COLLECTION:\n• We collect only necessary information for quiz functionality\n• User profiles, quiz results, and progress data are stored securely\n• We never sell your personal information to third parties\n\nDATA USAGE:\n• To personalize your learning experience\n• To track your progress and achievements\n• To improve our platform and services\n\nYOUR RIGHTS:\n• Access and download your data anytime\n• Request account deletion\n• Opt-out of non-essential communications\n\nFor full privacy policy, contact: ${contactInfo.email}`);
                  }}
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="#terms" 
                  onClick={(e) => {
                    e.preventDefault();
                    alert(`📝 Terms of Service\n\nBy using King Ice Quiz App, you agree to:\n\nACCOUNT TERMS:\n• You must be at least 13 years old to use this platform\n• One account per user - no sharing or multiple accounts\n• Keep your login credentials secure and confidential\n\nCONTENT USAGE:\n• All quiz content is for educational purposes only\n• Do not copy, distribute, or misuse quiz materials\n• Respect intellectual property rights\n\nUSER CONDUCT:\n• No cheating, hacking, or exploiting platform vulnerabilities\n• Be respectful to other users in comments and interactions\n• No inappropriate or offensive content\n\nPLATFORM USAGE:\n• Service may be temporarily unavailable for maintenance\n• We reserve the right to remove inappropriate content\n• Terms may be updated - continued use means acceptance\n\nContact for questions: ${contactInfo.email}`);
                  }}
                >
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {currentYear} King Ice Quiz App. All rights reserved.
            {isAdmin && <span className="admin-footer-badge"> • Admin Mode</span>}
          </div>
          <div className="footer-social">
            <span>Follow us:</span>
            <a 
              href="https://wa.me/2348145659286" 
              aria-label="WhatsApp" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Chat with us on WhatsApp"
              className="social-icon whatsapp"
            >
              {/* WhatsApp SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893-.001-3.189-1.248-6.189-3.515-8.452"/>
              </svg>
            </a>
            <a 
              href="https://x.com/KingIceQuizApp?s=09" 
              aria-label="Twitter" 
              target="_blank" 
              rel="noopener noreferrer"
              title="Follow us on Twitter"
              className="social-icon twitter"
            >
              {/* Twitter (X) SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a 
              href={`mailto:${contactInfo.email}`}
              aria-label="Email" 
              title="Send us an email"
              className="social-icon email"
            >
              {/* Email SVG */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;