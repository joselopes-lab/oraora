// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// export const firebaseConfig = {
//   apiKey: "AIzaSyBSRvXjw8-5b_AbHQVGsZdoHUuOIFevHtc",
//   authDomain: "oraora.com.br",
//   projectId: "secureadminpanel",
//   storageBucket: "secureadminpanel.appspot.com",
//   messagingSenderId: "184982072878",
//   appId: "1:184982072878:web:5d651f2df6ae1964e4f9bf"
// };

const firebaseConfig = {
  apiKey: "AIzaSyBrs0lBvav44t_pGHmzRD0XVsdsuHHSA6s",
  authDomain: "oraora-45adb.firebaseapp.com",
  projectId: "oraora-45adb",
  storageBucket: "oraora-45adb.firebasestorage.app",
  messagingSenderId: "645528171911",
  appId: "1:645528171911:web:78cfa11e4ac41ac2f60f22",
  measurementId: "G-ZS6T2F8VZM"
};


// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
