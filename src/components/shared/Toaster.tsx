import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle, FiX } from "react-icons/fi";
import { useToastStore, type ToastVariant } from "../../store/toastStore";
import "./Toaster.css";

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: FiCheckCircle,
  error: FiAlertCircle,
  info: FiInfo,
  warning: FiAlertTriangle,
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="toaster-root" role="status" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div key={t.id} className={`toast toast-${t.variant}`}>
            <Icon className="toast-icon" />
            <span className="toast-msg">{t.message}</span>
            <button
              className="toast-close"
              onClick={() => dismiss(t.id)}
              aria-label="Dismiss"
            >
              <FiX />
            </button>
          </div>
        );
      })}
    </div>
  );
}
