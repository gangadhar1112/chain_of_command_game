import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBNgD-9KlsHXuC025GvpsSWb0rHV0Dj820",
  authDomain: "chain-of-command-game.firebaseapp.com",
  databaseURL: "https://chain-of-command-game-default-rtdb.firebaseio.com",
  projectId: "chain-of-command-game",
  storageBucket: "chain-of-command-game.appspot.com",
  messagingSenderId: "819791089519",
  appId: "1:819791089519:web:61e1d26882ddf077fa229a"
};

let auth;
let database;
let storage;

try {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  storage = getStorage(app);
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

export { auth, database, storage };