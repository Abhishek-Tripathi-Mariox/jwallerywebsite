import { useRef, useState } from "react";
import { FiX, FiRotateCw } from "react-icons/fi";
import "./Spin360Viewer.css";

interface Spin360ViewerProps {
  frames: string[];
  onClose: () => void;
}

// Pixels of horizontal drag needed to advance one frame — lower = more
// sensitive spin. Tuned for a 20-36 frame turntable set.
const PX_PER_FRAME = 8;

export default function Spin360Viewer({ frames, onClose }: Spin360ViewerProps) {
  const [index, setIndex] = useState(0);
  const dragRef = useRef<{ startX: number; startIndex: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const stepTo = (clientX: number) => {
    if (!dragRef.current) return;
    const delta = clientX - dragRef.current.startX;
    const steps = Math.trunc(delta / PX_PER_FRAME);
    const next =
      (((dragRef.current.startIndex - steps) % frames.length) + frames.length) %
      frames.length;
    setIndex(next);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startIndex: index };
    setDragging(true);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    stepTo(e.clientX);
  };
  const handlePointerUp = () => {
    dragRef.current = null;
    setDragging(false);
  };

  return (
    <div className="spin360">
      <img
        src={frames[index]}
        alt={`360° view frame ${index + 1}`}
        className="spin360-img"
        draggable={false}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      {!dragging && (
        <div className="spin360-hint">
          <FiRotateCw /> Drag to rotate
        </div>
      )}
      <button
        type="button"
        className="spin360-close"
        aria-label="Exit 360° view"
        onClick={onClose}
      >
        <FiX />
      </button>
    </div>
  );
}
