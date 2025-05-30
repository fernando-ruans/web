// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {  apiKey: "AIzaSyCd8KdHRhK9hPVbHv49OGMrjYnzyhie02I",
  authDomain: "deliveryx-c0ea6.firebaseapp.com",
  projectId: "deliveryx-c0ea6",
  storageBucket: "deliveryx-c0ea6.appspot.com",  messagingSenderId: "539644821489",
  appId: "1:539644821489:web:a4627d8f551b45dcd50e50",
  measurementId: "G-80WLFQ5HJT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

export { app, auth };
