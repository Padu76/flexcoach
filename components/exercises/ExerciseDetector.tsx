"use client";
import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import CameraOverlay from "@/components/ui/CameraOverlay";

export default function ExerciseDetector() {
  const webcamRef = useRef(null);
  const [positionStatus, setPositionStatus] = useState<
    "tooClose" | "tooFar" | "moveLeft" | "moveRight" | "ok"
  >("tooClose"); // simulazione

  useEffect(() => {
    // Simula un cambio di posizione dopo 3 secondi
    const timer = setTimeout(() => setPositionStatus("ok"), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Webcam
        ref={webcamRef}
        style={{ width: "100%", height: "auto", borderRadius: "10px" }}
      />
      <CameraOverlay positionStatus={positionStatus} />
    </div>
  );
}