'use client';
import { ref, uploadBytesResumable, getDownloadURL, FirebaseStorage } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const uploadFile = (
  storage: FirebaseStorage,
  path: string,
  file: File,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const fileId = uuidv4();
    const storageRef = ref(storage, `${path}/${fileId}-${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    let inactivityTimeout: NodeJS.Timeout;

    const resetInactivityTimer = () => {
      if (inactivityTimeout) clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(() => {
        try {
          uploadTask.cancel();
        } catch (e) {
          // ignore
        }
        reject(new Error('Upload travado por inatividade (sem progresso por 30s)'));
      }, 30000);
    };

    resetInactivityTimer();

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        resetInactivityTimer();
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        } catch (err) {
          reject(err);
        }
      }
    );
  });
};
