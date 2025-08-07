'use client'

import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';
import type { WorkoutSession } from '@/types';

type ExerciseDetectorProps = {
  session: WorkoutSession;
};

export default function ExerciseDetector({ session }: ExerciseDetectorProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);

  useEffect(() => {
    const initLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-assets/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      setPoseLandmarker(landmarker);
    };

    initLandmarker();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        poseLandmarker &&
        canvasRef.current
      ) {
        const video = webcamRef.current.video as HTMLVideoElement;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        poseLandmarker.detectForVideo(video, performance.now()).then((res) => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const drawingUtils = new DrawingUtils(ctx);
          res.landmarks?.[0]?.forEach((landmark: NormalizedLandmark) => {
            drawingUtils.drawLandmark(landmark);
          });
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [poseLandmarker]);

  return (
    <div className="relative w-full max-w-3xl aspect-video mx-auto">
      <Webcam ref={webcamRef} className="absolute inset-0 w-full h-full" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
