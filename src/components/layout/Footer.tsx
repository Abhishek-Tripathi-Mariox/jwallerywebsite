import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa";
import { FiPhone, FiMail, FiMapPin } from "react-icons/fi";
import { fetchSupportInfo } from "../../services/api";
import "./Footer.css";

interface SupportInfo {
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  workingHours?: string;
}

export default function Footer() {
  const [support, setSupport] = useState<SupportInfo>({});

  useEffect(() => {
    (async () => {
      const r = await fetchSupportInfo();
      if (r?.code === 1 && r.data) setSupport(r.data);
    })();
  }, []);

  return (
    <footer className="site-footer">
      <div className="footer-divider" />
      <div className="container footer-grid">
        <div>
          <div className="footer-brand">SWARNAZ</div>
          <p className="footer-about">
            India's most trusted jewellery brand.<br />
            Crafting timeless elegance since 1970.
          </p>
          <div className="socials">
            <a href="#" aria-label="Facebook"><FaFacebookF /></a>
            <a href="#" aria-label="Instagram"><FaInstagram /></a>
            <a href="#" aria-label="Twitter"><FaTwitter /></a>
            <a href="#" aria-label="YouTube"><FaYoutube /></a>
          </div>
        </div>

        <div>
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/about-us">About Us</Link></li>
            <li><Link to="/our-story">Our Story</Link></li>
            <li><Link to="/store-locator">Store Locator</Link></li>
          </ul>
        </div>

        <div>
          <h4>Customer Service</h4>
          <ul>
            <li><Link to="/orders">Track Order</Link></li>
            <li><Link to="/shipping-policy">Shipping Policy</Link></li>
            <li><Link to="/return-policy">Return Policy</Link></li>
            <li><Link to="/help">Help</Link></li>
            <li><Link to="/contact-us">Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4>Contact Us</h4>
          <ul className="contact">
            {support.phone && (
              <li>
                <FiPhone />
                <div>
                  <strong>{support.phone}</strong>
                  {support.workingHours && <span>{support.workingHours}</span>}
                </div>
              </li>
            )}
            {support.email && (
              <li>
                <FiMail />
                <strong>{support.email}</strong>
              </li>
            )}
            {support.address && (
              <li>
                <FiMapPin />
                <span>{support.address}</span>
              </li>
            )}
            {!support.phone && !support.email && !support.address && (
              <li>
                <Link to="/contact-us">Get in touch →</Link>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {new Date().getFullYear()} SWARNAZ. All rights reserved. | Designed with ❤ in India</span>
          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
