import { useEffect, useRef, useState } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils, NormalizedLandmark } from '@mediapipe/tasks-vision';
import Webcam from 'react-webcam';
import type { WorkoutSession } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import FeedbackDisplay from './FeedbackDisplay';

type ExerciseDetectorProps = {
  session: WorkoutSession;
};

export default function ExerciseDetector({ session }: ExerciseDetectorProps) {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [poseLandmarker, setPoseLandmarker] = useState<PoseLandmarker | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string[]>([]);

  useEffect(() => {
    const initializePoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      setPoseLandmarker(landmarker);
      setLoading(false);
    };

    initializePoseLandmarker();
  }, []);

  useEffect(() => {
    if (!poseLandmarker || !webcamRef.current || !canvasRef.current) return;

    const video = webcamRef.current.video;
    if (!video) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    const drawingUtils = new DrawingUtils(canvasCtx!);

    let lastVideoTime = -1;

    const detectPose = async () => {
      if (!video || video.readyState < 2) {
        requestAnimationFrame(detectPose);
        return;
      }

      if (video.currentTime === lastVideoTime) {
        requestAnimationFrame(detectPose);
        return;
      }

      lastVideoTime = video.currentTime;

      poseLandmarker.detectForVideo(video, performance.now(), (result) => {
        canvasCtx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        if (result.landmarks) {
          for (const landmarks of result.landmarks) {
            drawingUtils.drawLandmarks(landmarks);
            drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS);
          }
        }
      });

      requestAnimationFrame(detectPose);
    };

    detectPose();
  }, [poseLandmarker]);

  return (
    <div className="relative w-full max-w-screen-md mx-auto">
      {loading && <LoadingSpinner />}
      <Webcam ref={webcamRef} className="w-full" mirrored />
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
      <FeedbackDisplay feedback={feedback} />
    </div>
  );
}
