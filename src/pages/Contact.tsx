import { useEffect, useState } from "react";
import {
  FiClock,
  FiMail,
  FiMapPin,
  FiMessageCircle,
  FiPhone,
  FiSend,
} from "react-icons/fi";
import { fetchSupportInfo, submitContact } from "../services/api";
import { toast } from "../store/toastStore";
import "./Contact.css";

interface FormState {
  fullName: string;
  email: string;
  mobileNumber: string;
  interest: string;
  message: string;
  consent: boolean;
}

const blank: FormState = {
  fullName: "",
  email: "",
  mobileNumber: "",
  interest: "general",
  message: "",
  consent: false,
};

const INTERESTS = [
  { v: "general",  l: "General Enquiry" },
  { v: "product",  l: "Product Information" },
  { v: "order",    l: "Order / Delivery" },
  { v: "support",  l: "Support" },
  { v: "wholesale", l: "Wholesale / Bulk" },
  { v: "feedback", l: "Feedback" },
  { v: "other",    l: "Other" },
];

export default function Contact() {
  const [form, setForm] = useState<FormState>(blank);
  const [submitting, setSubmitting] = useState(false);
  const [support, setSupport] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const r = await fetchSupportInfo();
      if (r?.code === 1) setSupport(r.data);
    })();
  }, []);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((s) => ({ ...s, [k]: v }));

  const validate = (): string | null => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Please enter a valid email address";
    const phone = form.mobileNumber.replace(/\D/g, "");
    if (phone.length < 10) return "Please enter a valid 10-digit mobile number";
    if (!form.consent)
      return "Please agree to the terms before submitting";
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.warning(err);
      return;
    }
    setSubmitting(true);
    const res = await submitContact({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      mobileNumber: form.mobileNumber.replace(/\D/g, ""),
      interest: form.interest,
      message: form.message.trim(),
      consent: form.consent,
    });
    setSubmitting(false);
    if (res?.code === 1) {
      toast.success("Thank you! We'll get back to you shortly.");
      setForm(blank);
    } else {
      toast.error(res?.message || "Could not submit. Please try again.");
    }
  };

  // The public /user/support-info endpoint already flattens credentials, so
  // we just read top-level fields. Empty strings → row is hidden.
  const phone = support?.phone || "";
  const email = support?.email || "";
  const whatsapp = support?.whatsapp || "";
  const address = support?.address || "";
  const workingHours = support?.workingHours || "";
  const hasAnyInfo = !!(phone || email || whatsapp || address || workingHours);

  return (
    <div className="contact-page container">
      <header className="contact-hero">
        <h1>Contact Us</h1>
        <p>
          We'd love to hear from you. Drop us a line and our team will reach out
          shortly.
        </p>
      </header>

      <div className="contact-grid">
        <aside className="contact-info">
          <h3>Get in touch</h3>
          {phone && (
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <FiPhone />
              </span>
              <div>
                <strong>Phone</strong>
                <a href={`tel:${String(phone).replace(/\s+/g, "")}`}>{phone}</a>
              </div>
            </div>
          )}
          {whatsapp && (
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <FiMessageCircle />
              </span>
              <div>
                <strong>WhatsApp</strong>
                <a
                  href={`https://wa.me/${String(whatsapp).replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {whatsapp}
                </a>
              </div>
            </div>
          )}
          {email && (
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <FiMail />
              </span>
              <div>
                <strong>Email</strong>
                <a href={`mailto:${email}`}>{email}</a>
              </div>
            </div>
          )}
          {address && (
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <FiMapPin />
              </span>
              <div>
                <strong>Address</strong>
                <span>{address}</span>
              </div>
            </div>
          )}
          {workingHours && (
            <div className="contact-info-row">
              <span className="contact-info-icon">
                <FiClock />
              </span>
              <div>
                <strong>Working hours</strong>
                <span>{workingHours}</span>
              </div>
            </div>
          )}
          {!hasAnyInfo && (
            <p className="contact-info-empty">
              Use the form and we'll get back to you over email.
            </p>
          )}
        </aside>

        <form className="contact-form" onSubmit={onSubmit} noValidate>
          <label>
            <span>Full Name</span>
            <input
              type="text"
              placeholder="Your name"
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </label>

          <label>
            <span>
              Email <em>*</em>
            </span>
            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </label>

          <label>
            <span>
              Phone Number <em>*</em>
            </span>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              inputMode="numeric"
              value={form.mobileNumber}
              onChange={(e) =>
                set("mobileNumber", e.target.value.replace(/[^\d+\s]/g, ""))
              }
              required
            />
          </label>

          <label>
            <span>
              Services you're interested in <em>*</em>
            </span>
            <select
              value={form.interest}
              onChange={(e) => set("interest", e.target.value)}
            >
              {INTERESTS.map((o) => (
                <option key={o.v} value={o.v}>
                  {o.l}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Message</span>
            <textarea
              rows={4}
              placeholder="Tell us a bit about what you need…"
              value={form.message}
              onChange={(e) => set("message", e.target.value)}
            />
          </label>

          <label className="contact-consent">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => set("consent", e.target.checked)}
            />
            <span>
              I hereby authorise Swarnaz to send me notifications via SMS,
              Email, RCS and others as per the{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button
            type="submit"
            className="btn btn-primary contact-submit"
            disabled={submitting}
          >
            <FiSend /> {submitting ? "Sending…" : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
}
