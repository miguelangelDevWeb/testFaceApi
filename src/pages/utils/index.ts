import * as faceapi from 'face-api.js';

export const createLabeledFaceDescriptors = async () => {
  const label = 'Miguel Angel'; // Etiqueta para la persona

  // Lista de imágenes de la persona a identificar
  const imagePaths = [
    '/images/person1.jpg',
    '/images/person2.jpg',
    '/images/person3.jpg',
    '/images/person4.jpg',
    '/images/person5.jpg',
    '/images/person6.jpg',
    '/images/person7.jpg',
    '/images/person8.jpg',
    '/images/person9.jpg',
    '/images/person10.jpg'
  ];

  const descriptors = await Promise.all(
    imagePaths.map(async (imgPath) => {
      const img = await faceapi.fetchImage(imgPath);
      const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
      if (!detection) {
        throw new Error(`No faces detected for image ${imgPath}`);
      }
      return detection.descriptor;
    })
  );

  return [new faceapi.LabeledFaceDescriptors(label, descriptors)];
};
