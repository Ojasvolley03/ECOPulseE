import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function LaunchScreen({ onOpen }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleOpen = () => {
    if (isExiting) return;

    setIsExiting(true);
    window.setTimeout(onOpen, 420);
  };

  return (
    <main className={`launch-screen ${isExiting ? 'launch-screen--exiting' : ''}`}>
      <button
        type="button"
        className="launch-mark"
        onClick={handleOpen}
        aria-label="Open EcoPulse"
      >
        <span className="launch-mark__halo" aria-hidden="true" />
        <span className="launch-mark__symbol" aria-hidden="true">
          <Trash2 strokeWidth={2.1} />
        </span>
      </button>

      <p className="launch-wordmark">EcoPulse</p>
    </main>
  );
}