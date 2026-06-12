import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import { sendOtp, verifyOtp, resendOtp } from "../services/api";
import { API_BASE_URL } from "../lib/axios";

// Show a "use 123456" hint when running against a local backend — the dev
// backend has no SMS provider, but the auth controller accepts 123456 as a
// universal OTP. Production builds pointing at the live API skip this hint.
const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.)/.test(
  API_BASE_URL,
);
import { useAuthStore } from "../store";
import { useLogoStore } from "../store/logoStore";
import { useGuestStore } from "../store/guestStore";
import { A } from "../assets/figma";
import "./Login.css";

// Backend currently sends a 6-digit OTP; the Figma shows 4 boxes for visual
// design. We support 4 or 6 dynamically based on what the user types.
const OTP_LEN = 6;

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const primaryLogo = useLogoStore((s) => s.byType.primary?.imageUrl);
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(""));
  const [txnId, setTxnId] = useState("");
  const [step, setStep] = useState<"id" | "otp">("id");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (step === "otp") otpRefs.current[0]?.focus();
  }, [step]);

  const isPhone = (s: string) => /^\d{10}$/.test(s.replace(/\D/g, ""));

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const v = identifier.trim();
    if (!isPhone(v)) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    const phone = v.replace(/\D/g, "");
    const res: any = await sendOtp(phone);
    setLoading(false);
    if (res?.code === 1) {
      setTxnId(res.data?.txnId || "");
      setStep("otp");
    } else {
      setError(res?.message || "Failed to send OTP");
    }
  };

  const handleResend = async () => {
    setError("");
    const phone = identifier.replace(/\D/g, "");
    const res: any = await resendOtp(phone);
    if (res?.code === 1) setTxnId(res.data?.txnId || txnId);
    else setError(res?.message || "Could not resend OTP");
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length < 4) { setError("Enter the full code"); return; }
    setLoading(true);
    const phone = identifier.replace(/\D/g, "");
    const res: any = await verifyOtp(phone, code, txnId);
    setLoading(false);
    if (res?.code === 1 && res?.data?.token) {
      setAuth(res.data.token, { _id: res.data.userId, mobileNumber: phone });
      // Push any guest cart/wishlist items to the server, then redirect.
      // Failures inside merge are swallowed and logged — we never block login.
      try {
        await useGuestStore.getState().mergeIntoServer();
      } catch (e) {
        console.warn("Guest merge failed:", e);
      }
      const next = searchParams.get("next");
      navigate(next && next.startsWith("/") ? next : "/");
    } else {
      setError(res?.message || "Invalid OTP");
    }
  };

  const setOtpDigit = (i: number, val: string) => {
    const ch = val.replace(/\D/g, "").slice(-1);
    setOtp((arr) => {
      const next = [...arr];
      next[i] = ch;
      return next;
    });
    if (ch && i < OTP_LEN - 1) otpRefs.current[i + 1]?.focus();
  };

  const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  };

  return (
    <div className="login-page">
      <button className="login-back" onClick={() => (step === "otp" ? setStep("id") : navigate(-1))}>
        <FiArrowLeft /> Back
      </button>

      <div className="login-card">
        <img src={primaryLogo || A.logo} alt="Swarnaz" className="login-logo" />

        {step === "id" ? (
          <>
            <p className="login-sub">Login to continue</p>
            {error && <div className="login-error">{error}</div>}
            <form onSubmit={handleSendOtp}>
              <label className="login-label">Mobile Number</label>
              <input
                type="tel"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="Enter your 10-digit mobile number"
                className="login-input"
                autoComplete="tel"
                inputMode="numeric"
              />
              <button className="login-cta" disabled={loading}>
                {loading ? "Please wait..." : "Continue"}
              </button>
            </form>
            <div className="login-divider"><span>NEW TO SWARNAZ?</span></div>
            <p className="login-legal">
              By continuing, you agree to Swarnaz's Terms of Service and Privacy Policy.
              We'll send you an OTP for verification.
            </p>
          </>
        ) : (
          <>
            <h2 className="login-otp-title">Enter OTP</h2>
            <p className="login-sub">We've sent a verification code to {identifier}</p>
            {isLocalApi && (
              <div
                style={{
                  background: "#fff8e1",
                  border: "1px solid #f4d97a",
                  color: "#7a5b00",
                  padding: "8px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  margin: "0 0 12px",
                  textAlign: "center",
                }}
              >
                Dev mode: SMS is not configured locally. Use OTP <strong>123456</strong>.
              </div>
            )}
            {error && <div className="login-error">{error}</div>}
            <form onSubmit={handleVerify}>
              <div className="otp-row">
                {Array.from({ length: OTP_LEN }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => setOtpDigit(i, e.target.value)}
                    onKeyDown={(e) => onOtpKey(i, e)}
                    className="otp-box"
                  />
                ))}
              </div>
              <button className="login-cta" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
            <p className="login-resend">
              Didn't receive the code?{" "}
              <button type="button" onClick={handleResend} className="login-link">Resend OTP</button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
