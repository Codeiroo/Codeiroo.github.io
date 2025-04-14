/**
 * Configuración de Firebase para GitHub Pages
 * Este archivo ahora está excluido del .gitignore para permitir su uso en GitHub Pages
 */

const firebaseConfig = {
    apiKey: "AIzaSyDYFzVzjaPg3syJY6FgI09vEGRqWyNSxbo",
    authDomain: "webapps-cf9fe.firebaseapp.com",
    projectId: "webapps-cf9fe",
    storageBucket: "webapps-cf9fe.firebasestorage.app",
    messagingSenderId: "537928368633",
    appId: "1:537928368633:web:93c5a6416ab4e726b37d28",
    measurementId: "G-77JFPB120X"
};

// Inicializa Firebase
if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase inicializado correctamente");
} else {
    console.error("Firebase no está disponible. Asegúrate de incluir los scripts de Firebase SDK.");
}