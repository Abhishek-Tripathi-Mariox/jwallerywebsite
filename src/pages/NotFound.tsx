import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container section" style={{ textAlign: "center" }}>
      <h1 style={{ fontSize: 96, color: "var(--color-primary)" }}>404</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: 24 }}>Page not found.</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}
