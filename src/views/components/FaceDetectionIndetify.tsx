import React, { useRef, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { createLabeledFaceDescriptors } from '../../pages/utils';

const nameMap: { [key: string]: string } = {
    person1: 'Miguel Angel',
    person2: 'María',
    // Añade más nombres según tus etiquetas
  };
const VideoComponent = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL); // Añade esta línea para cargar el modelo SsdMobilenetv1
    };

    const getVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the camera: ", err);
      }
    };

    loadModels().then(getVideo);
  }, []);

  useEffect(() => {
    const handleVideoPlay = async () => {
      const labeledFaceDescriptors = await createLabeledFaceDescriptors();

      const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

      const intervalId = setInterval(async () => {
        if (videoRef.current && canvasRef.current) {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (detections.length > 0) {
            const resizedDetections = faceapi.resizeResults(detections, {
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });

            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor));
            results.forEach((result, i) => {
                const box = resizedDetections[i].detection.box;
                const originalLabel = result.toString();
                console.log(originalLabel)
                const displayName = nameMap[originalLabel] || originalLabel; // Usa el nombre personalizado si está mapeado, de lo contrario usa el original
                const drawBox = new faceapi.draw.DrawBox(box, { label: displayName });
                if (canvasRef.current) {
                  drawBox.draw(canvasRef.current);
                }
              });
          }
        }
      }, 100);

      return () => clearInterval(intervalId);
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('play', handleVideoPlay);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('play', handleVideoPlay);
      }
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} autoPlay muted style={{ width: '600px', height: '400px' }}></video>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }}></canvas>
    </div>
  );
};

export default VideoComponent;
