// Replace the ES6 imports with the global Firebase object
const firebaseConfig = {
    apiKey: "AIzaSyD-wWzPl6iPutesplC_uRBzomC1sm5JMZA",
    authDomain: "job-matcher-platform.firebaseapp.com",
    projectId: "job-matcher-platform",
    storageBucket: "job-matcher-platform.firebasestorage.app",
    messagingSenderId: "308472849694",
    appId: "1:308472849694:web:f24f3662f717e15cd3d50f",
    measurementId: "G-J5MN5PQH17"
  };
  
  // Initialize Firebase using v8 syntax to match your script imports
  firebase.initializeApp(firebaseConfig);