// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyDwXOEGv2GBkeWggfhcBnfKQWnHDVeI890",
    authDomain: "barber-salon-cucher.firebaseapp.com",
    projectId: "barber-salon-cucher",
    storageBucket: "barber-salon-cucher.firebasestorage.app",
    messagingSenderId: "337468108878",
    appId: "1:337468108878:web:0fbcb5f537d891cd2ed31f"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Глобальные переменные
const auth = firebase.auth();
const db = firebase.firestore();
const appointmentsRef = db.collection('appointments'); // Общая коллекция