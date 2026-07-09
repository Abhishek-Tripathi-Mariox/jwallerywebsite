import "@google/model-viewer";
import { FiX } from "react-icons/fi";
import "./Model3DViewer.css";

interface Model3DViewerProps {
  src: string;
  iosSrc?: string;
  alt: string;
  onClose: () => void;
}

export default function Model3DViewer({
  src,
  iosSrc,
  alt,
  onClose,
}: Model3DViewerProps) {
  return (
    <div className="model3d">
      <model-viewer
        src={src}
        ios-src={iosSrc}
        alt={alt}
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        className="model3d-viewer"
      />
      <button
        type="button"
        className="model3d-close"
        aria-label="Exit 3D view"
        onClick={onClose}
      >
        <FiX />
      </button>
    </div>
  );
}
