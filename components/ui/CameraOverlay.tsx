"use client";
import React from "react";

type PositionStatus = "tooClose" | "tooFar" | "moveLeft" | "moveRight" | "ok";

const messages: Record<PositionStatus, string> = {
  tooClose: "Allontanati dalla fotocamera",
  tooFar: "Avvicinati alla fotocamera",
  moveLeft: "Spostati a sinistra",
  moveRight: "Spostati a destra",
  ok: "",
};

export default function CameraOverlay({ positionStatus }: { positionStatus: PositionStatus }) {
  const message = messages[positionStatus];

  if (!message) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        color: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        fontSize: "18px",
        zIndex: 1000,
      }}
    >
      {message}
    </div>
  );
}