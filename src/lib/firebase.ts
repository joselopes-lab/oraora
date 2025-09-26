// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyBSRvXjw8-5b_AbHQVGsZdoHUuOIFevHtc",
  authDomain: "oraora.com.br",
  projectId: "secureadminpanel",
  storageBucket: "secureadminpanel.appspot.com",
  messagingSenderId: "184982072878",
  appId: "1:184982072878:web:5d651f2df6ae1964e4f9bf"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
