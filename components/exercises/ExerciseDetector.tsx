
'use client';

import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';
import type { WorkoutSession } from '@/types';

type Props = {
  session: WorkoutSession;
};

export default function ExerciseDetector({ session }: Props) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const init = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm'
      );
      const detector = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
      setPoseLandmarker(detector);
    };

    init();
  }, []);

  useEffect(() => {
    if (!poseLandmarker || !webcamRef.current || !canvasRef.current) return;

    const interval = setInterval(() => {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== 4) return;

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      poseLandmarker.detectForVideo(video, performance.now()).then((result) => {
        const pose = result.landmarks[0];
        if (pose) {
          const center = pose[0].x;
          if (center < 0.4) setFeedback('Spostati a destra');
          else if (center > 0.6) setFeedback('Spostati a sinistra');
          else setFeedback('Posizione OK');
        }
      });
    }, 1000 / 10);

    return () => clearInterval(interval);
  }, [poseLandmarker]);

  return (
    <div className="relative w-full max-w-2xl">
      <Webcam ref={webcamRef} style={{ position: 'absolute', width: '100%' }} />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <div className="absolute bottom-2 left-0 right-0 text-center text-white text-xl bg-black/50 p-2 rounded">
        {feedback}
      </div>
    </div>
  );
}
