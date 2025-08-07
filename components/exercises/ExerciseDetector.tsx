
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils';
import { POSE_CONNECTIONS } from '@mediapipe/pose';
import Webcam from 'react-webcam';
import { usePoseTracking } from '@/hooks/usePoseTracking';
import FeedbackDisplay from './FeedbackDisplay';

const ExerciseDetector = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [feedback, setFeedback] = useState([]);
  const [calibration, setCalibration] = useState('Calibrazione in corso...');

  const onResults = (results) => {
    if (!results.poseLandmarks) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.save();
    canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks, { color: '#FF0000', lineWidth: 2 });
    canvasCtx.restore();

    // Feedback tecnico
    const newFeedback = [];
    const leftShoulder = results.poseLandmarks[11];
    const rightShoulder = results.poseLandmarks[12];
    const leftHip = results.poseLandmarks[23];
    const rightHip = results.poseLandmarks[24];

    const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
    const hipHeight = (leftHip.y + rightHip.y) / 2;

    // Calibrazione utente (distanza dalla webcam)
    if (shoulderWidth > 0.3) {
      setCalibration('Allontanati dalla webcam');
    } else if (shoulderWidth < 0.1) {
      setCalibration('Avvicinati alla webcam');
    } else {
      setCalibration('✅ Posizione ottimale');
    }

    if (leftShoulder.y > leftHip.y) {
      newFeedback.push({ message: 'Schiena curva', color: 'red' });
    } else {
      newFeedback.push({ message: 'Postura corretta', color: 'green' });
    }

    setFeedback(newFeedback);
  };

  const videoRef = usePoseTracking(onResults);

  useEffect(() => {
    if (webcamRef.current && canvasRef.current) {
      canvasRef.current.width = 640;
      canvasRef.current.height = 480;
    }
  }, []);

  return (
    <div className="relative w-[640px] h-[480px] mx-auto">
      <Webcam ref={videoRef} width={640} height={480} className="absolute" />
      <canvas ref={canvasRef} className="absolute top-0 left-0 z-10" />
      <div className="absolute bottom-2 left-2 bg-black/70 text-white p-2 rounded z-20 text-sm">{calibration}</div>
      <FeedbackDisplay feedback={feedback} />
    </div>
  );
};

export default ExerciseDetector;
