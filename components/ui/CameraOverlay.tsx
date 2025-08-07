
'use client';

import React from 'react';
import '../styles/Overlay.css';

type OverlayProps = {
  positionStatus: string;
};

const CameraOverlay: React.FC<OverlayProps> = ({ positionStatus }) => {
  return (
    <div className="camera-overlay">
      {positionStatus === 'too_close' && <p>Allontanati</p>}
      {positionStatus === 'too_far' && <p>Avvicinati</p>}
      {positionStatus === 'too_left' && <p>Spostati a destra</p>}
      {positionStatus === 'too_right' && <p>Spostati a sinistra</p>}
    </div>
  );
};

export default CameraOverlay;
