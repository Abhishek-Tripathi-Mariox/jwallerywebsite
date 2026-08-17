import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";
import "./CancelOrderModal.css";

// Kept in sync with the mobile app's OrderCancellationModal default reason
// list so the cancellation flow reads the same on both platforms.
const REASONS = [
  "Change of mind",
  "Delay in delivery",
  "Price concerns",
  "Mistakes in delivery",
  "Accidental order placement",
];

interface Props {
  open: boolean;
  orderId?: string;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (reason: string, feedback: string) => void;
}

export default function CancelOrderModal({ open, orderId, submitting, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [showError, setShowError] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (open) {
      setReason(null);
      setFeedback("");
      setShowError(false);
      setConfirming(false);
    }
  }, [open, orderId]);

  if (!open) return null;

  const handleContinue = () => {
    if (!reason) {
      setShowError(true);
      return;
    }
    setConfirming(true);
  };

  return (
    <div className="cancel-modal-overlay" onClick={onClose}>
      <div className="cancel-modal" onClick={(e) => e.stopPropagation()}>
        <button className="cancel-modal-close" onClick={onClose} aria-label="Close">
          <FiX />
        </button>

        {!confirming ? (
          <>
            <h3 className="cancel-modal-title">Order Cancellation</h3>
            <p className="cancel-modal-sub">
              Before you cancel, please let us know the reason. Every bit of feedback helps!
            </p>

            <div className="cancel-reasons">
              {REASONS.map((r) => {
                const selected = reason === r;
                return (
                  <button
                    type="button"
                    key={r}
                    className={`cancel-reason-row ${selected ? "selected" : ""}`}
                    onClick={() => {
                      setReason(r);
                      setShowError(false);
                    }}
                  >
                    <span className={`cancel-radio ${selected ? "selected" : ""}`}>
                      {selected && <span className="cancel-radio-dot" />}
                    </span>
                    {r}
                  </button>
                );
              })}
            </div>

            {showError && <p className="cancel-error">Please select a cancellation reason.</p>}

            <textarea
              className="cancel-feedback"
              placeholder="Anything you want to share? (Optional)"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />

            <button className="btn btn-outline-primary cancel-continue-btn" onClick={handleContinue}>
              Continue
            </button>
          </>
        ) : (
          <>
            <h3 className="cancel-modal-title">Cancel this order?</h3>
            <p className="cancel-modal-sub">
              Reason: <strong>{reason}</strong>
              <br />
              This can't be undone once submitted.
            </p>
            <div className="cancel-confirm-actions">
              <button
                className="btn btn-outline-primary"
                onClick={() => setConfirming(false)}
                disabled={submitting}
              >
                Go back
              </button>
              <button
                className="btn btn-primary cancel-confirm-btn"
                onClick={() => reason && onSubmit(reason, feedback)}
                disabled={submitting}
              >
                {submitting ? "Cancelling..." : "Yes, cancel order"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
