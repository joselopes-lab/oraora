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

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress(progress);
      },
      (error) => {
        console.error('Upload error:', error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};
