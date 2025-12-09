import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuração fornecida. Em produção, recomenda-se usar variáveis de ambiente.
const firebaseConfig = {
  apiKey: "AIzaSyAZ5dhLpAJxmr6sDGa-sbhA9hM9kZtG0tM",
  authDomain: "lote-certo.firebaseapp.com",
  projectId: "lote-certo",
  storageBucket: "lote-certo.firebasestorage.app",
  messagingSenderId: "511698308244",
  appId: "1:511698308244:web:1bd8a176594201031eb881"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);