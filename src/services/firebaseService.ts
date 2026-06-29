import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  writeBatch, 
  limit 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";

// Firebase Config derived from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyC-_kj-wa5JNBcaFl1tUg3ahyBW3SUqMqw",
  authDomain: "powerful-deck-jxhgq.firebaseapp.com",
  projectId: "powerful-deck-jxhgq",
  storageBucket: "powerful-deck-jxhgq.firebasestorage.app",
  messagingSenderId: "800948792179",
  appId: "1:800948792179:web:64fd60c7a3ae23720d7306",
  firestoreDatabaseId: "ai-studio-remixzoyaaivoice-34fc1361-0eee-4a89-a760-faeba9a6e5e6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUser = auth.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid || null,
      email: currentUser?.email || null,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface UserPreferences {
  creatorName: string;
  role: string;
  sassyLevel: number; // 1 to 5
  favoriteTopic: string;
  customNotes: string;
  voiceName: string; // "Kore", "Aoede", "Puck", "Charon", "Fenrir"
}

export interface ChatMessage {
  id: string;
  sender: "user" | "zoya";
  text: string;
  timestamp: number;
}

const LOCAL_PREFS_KEY = "zoya_guest_preferences";
const LOCAL_HISTORY_KEY = "zoya_guest_history";

const DEFAULT_PREFERENCES: UserPreferences = {
  creatorName: "Aaryan",
  role: "Boss",
  sassyLevel: 4,
  favoriteTopic: "Roasting & Tech",
  customNotes: "Aaryan is Zoya's creator and boss.",
  voiceName: "Kore"
};

// Auth helper functions
export async function signUpWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  // Copy current local preferences to Firestore upon first sign up
  try {
    const localPrefsStr = localStorage.getItem(LOCAL_PREFS_KEY);
    const localPrefs = localPrefsStr ? JSON.parse(localPrefsStr) : DEFAULT_PREFERENCES;
    await setDoc(doc(db, "preferences", credential.user.uid), localPrefs);
  } catch (err) {
    console.error("Failed to migrate preferences on sign up:", err);
  }
  
  // Copy current local conversation history to Firestore upon first sign up
  try {
    const localHistoryStr = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (localHistoryStr) {
      const localHistory: ChatMessage[] = JSON.parse(localHistoryStr);
      const batch = writeBatch(db);
      localHistory.forEach((msg) => {
        const msgRef = doc(collection(db, `users/${credential.user.uid}/conversations`));
        batch.set(msgRef, {
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp
        });
      });
      await batch.commit();
      // Clear guest local history once migrated
      localStorage.removeItem(LOCAL_HISTORY_KEY);
    }
  } catch (err) {
    console.error("Failed to migrate chat history on sign up:", err);
  }

  return credential.user;
}

export async function logInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logInWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);

  // Copy current local preferences to Firestore upon first sign in
  try {
    const docRef = doc(db, "preferences", credential.user.uid);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      const localPrefsStr = localStorage.getItem(LOCAL_PREFS_KEY);
      const localPrefs = localPrefsStr ? JSON.parse(localPrefsStr) : DEFAULT_PREFERENCES;
      await setDoc(docRef, localPrefs);
    }
  } catch (err) {
    console.error("Failed to migrate preferences on Google Sign-In:", err);
  }
  
  // Copy current local conversation history to Firestore upon first sign in
  try {
    const localHistoryStr = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (localHistoryStr) {
      const localHistory: ChatMessage[] = JSON.parse(localHistoryStr);
      const batch = writeBatch(db);
      localHistory.forEach((msg) => {
        const msgRef = doc(collection(db, `users/${credential.user.uid}/conversations`));
        batch.set(msgRef, {
          sender: msg.sender,
          text: msg.text,
          timestamp: msg.timestamp
        });
      });
      await batch.commit();
      localStorage.removeItem(LOCAL_HISTORY_KEY);
    }
  } catch (err) {
    console.error("Failed to migrate chat history on Google Sign-In:", err);
  }

  return credential.user;
}

export async function logOutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}

// Get user preferences (supporting Multi-User Firebase Auth or local fallback)
export async function getUserPreferences(): Promise<UserPreferences> {
  const currentUser = auth.currentUser;
  
  if (!currentUser) {
    // Guest user local preferences storage
    const stored = localStorage.getItem(LOCAL_PREFS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as UserPreferences;
      } catch (e) {
        console.error("Error reading local preferences, reverting to default:", e);
      }
    }
    localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    return DEFAULT_PREFERENCES;
  }

  const path = `preferences/${currentUser.uid}`;
  try {
    const docRef = doc(db, "preferences", currentUser.uid);
    let docSnap;
    try {
      docSnap = await getDoc(docRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, path);
      throw e;
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        creatorName: data.creatorName || "Aaryan",
        role: data.role || "Boss",
        sassyLevel: data.sassyLevel !== undefined ? Number(data.sassyLevel) : 4,
        favoriteTopic: data.favoriteTopic || "Roasting & Tech",
        customNotes: data.customNotes || "Aaryan is Zoya's creator and boss.",
        voiceName: data.voiceName || "Kore"
      };
    } else {
      // Initialize firestore with current local or default preferences
      let initialPrefs = DEFAULT_PREFERENCES;
      const stored = localStorage.getItem(LOCAL_PREFS_KEY);
      if (stored) {
        try { initialPrefs = JSON.parse(stored); } catch (e) {}
      }
      try {
        await setDoc(docRef, initialPrefs);
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, path);
      }
      return initialPrefs;
    }
  } catch (error) {
    console.error("Error getting user preferences from Firestore:", error);
    return DEFAULT_PREFERENCES;
  }
}

// Update user preferences
export async function updateUserPreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  const currentUser = auth.currentUser;
  const current = await getUserPreferences();
  const updated = { ...current, ...prefs };

  if (!currentUser) {
    localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(updated));
    return updated;
  }

  const path = `preferences/${currentUser.uid}`;
  try {
    const docRef = doc(db, "preferences", currentUser.uid);
    try {
      await setDoc(docRef, updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
    return updated;
  } catch (error) {
    console.error("Error updating user preferences in Firestore:", error);
    throw error;
  }
}

// Get past conversations, ordered by timestamp
export async function getConversationHistory(limitCount: number = 50): Promise<ChatMessage[]> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    // Guest user local history storage
    const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as ChatMessage[];
      } catch (e) {
        console.error("Error reading local chat history, reverting to empty list:", e);
      }
    }
    return [];
  }

  const path = `users/${currentUser.uid}/conversations`;
  try {
    const colRef = collection(db, path);
    const q = query(colRef, orderBy("timestamp", "asc"), limit(limitCount));
    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      throw e;
    }

    const messages: ChatMessage[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp || Date.now(),
      });
    });
    return messages;
  } catch (error) {
    console.error("Error getting conversation history from Firestore:", error);
    return [];
  }
}

// Save a single chat message
export async function saveChatMessage(sender: "user" | "zoya", text: string): Promise<ChatMessage> {
  const currentUser = auth.currentUser;
  const timestamp = Date.now();
  const messageData = {
    sender,
    text,
    timestamp,
  };

  if (!currentUser) {
    // Local memory/storage fallback
    const newMessage: ChatMessage = {
      id: "local_" + timestamp + "_" + Math.random().toString(36).substr(2, 5),
      sender,
      text,
      timestamp,
    };
    const stored = localStorage.getItem(LOCAL_HISTORY_KEY);
    let history: ChatMessage[] = [];
    if (stored) {
      try { history = JSON.parse(stored); } catch (e) {}
    }
    history.push(newMessage);
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history));
    return newMessage;
  }

  const path = `users/${currentUser.uid}/conversations`;
  try {
    const colRef = collection(db, path);
    let docRef;
    try {
      docRef = await addDoc(colRef, messageData);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, path);
      throw e;
    }

    return {
      id: docRef.id,
      sender,
      text,
      timestamp,
    };
  } catch (error) {
    console.error("Error saving chat message to Firestore:", error);
    return {
      id: Date.now().toString(),
      sender,
      text,
      timestamp: Date.now(),
    };
  }
}

// Clear conversation history
export async function clearConversationHistory(): Promise<void> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    localStorage.removeItem(LOCAL_HISTORY_KEY);
    return;
  }

  const path = `users/${currentUser.uid}/conversations`;
  try {
    const colRef = collection(db, path);
    let querySnapshot;
    try {
      querySnapshot = await getDocs(colRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, path);
      throw e;
    }

    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    try {
      await batch.commit();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  } catch (error) {
    console.error("Error clearing conversation history in Firestore:", error);
    throw error;
  }
}
