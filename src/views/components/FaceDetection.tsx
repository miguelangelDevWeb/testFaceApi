import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';

const VideoComponent = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [noFaceDetected, setNoFaceDetected] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };

    const getVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true  });
        if (videoRef.current && stream) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
    };

    loadModels().then(getVideo);
  }, []);

  const handleVideoPlay = () => {
    setInterval(async () => {
      if (videoRef.current && canvasRef.current) {
        const detections = await faceapi.detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions()
        );

        if (detections.length > 0) {
          console.log('Face detected!');
          setNoFaceDetected(false);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        } else {
          setNoFaceDetected(true);
          if (audioRef.current && audioRef.current.paused) {
            audioRef.current.play();
          }
        }

        const displaySize = {
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
        };
        faceapi.matchDimensions(canvasRef.current, displaySize);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const context = canvasRef.current.getContext('2d');
        context?.clearRect(0, 0, displaySize.width, displaySize.height);
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
      }
    }, 100);
  };

  return (
    <div>
      <video  ref={videoRef} autoPlay onPlay={handleVideoPlay} style={{ width: '600px', height: '400px' }}></video>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }}></canvas>
      {noFaceDetected && <div style={{ color: 'red' }}>No face detected!</div>}
      <audio ref={audioRef} src="/lostSky.mp3"></audio>
    </div>
  );
};

export default VideoComponent;
