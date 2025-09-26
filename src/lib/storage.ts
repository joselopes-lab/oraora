'use server';

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadFile(file: File, path: string): Promise<string> {
  const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
  
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  const downloadURL = await getDownloadURL(snapshot.ref);
  
  return downloadURL;
}
