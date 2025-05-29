import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBOvBtmHZI_mOX_9_5WxqLBkZR3BXJIh8Q",
  authDomain: "chain-of-command-game.firebaseapp.com",
  databaseURL: "https://chain-of-command-game-default-rtdb.firebaseio.com",
  projectId: "chain-of-command-game",
  storageBucket: "chain-of-command-game.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456ghi789jkl"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);