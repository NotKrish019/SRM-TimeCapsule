import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import LandingPage from "./components/LandingPage";
import Scene from "./components/Scene";
import Modal from "./components/Modal";
import { seedFirestore } from "./data/seedData";

export default function App() {
  const [user, setUser]         = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Attempt to connect to Firestore
    try {
        const unsub = onSnapshot(collection(db, "capsules"), (snap) => {
          setCapsules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        }, (err) => {
          console.warn("Could not fetch capsules. Please set up your Firebase keys in src/firebase.js", err);
        });
        return unsub;
    } catch(err) {
        console.warn("Firestore not configured yet.", err);
    }
  }, [user]);

  // If the user hasn't logged in, let them see the login page first
  // NOTE: For debugging / to bypass login just comment out the next line. 
  if (!user) return <LandingPage />;


  return (
    <div className="relative w-screen h-screen bg-[#87CEEB] overflow-hidden">
      {/* If firestore gave no capsules, we pass undefined to Scene so it falls back to DEMO_CAPSULES */}
      <div className="absolute inset-0 w-full h-full z-0">
         <Scene capsules={capsules.length > 0 ? capsules : undefined} onOrbClick={setSelected} />
      </div>

      <div className="absolute top-4 left-4 text-slate-900 z-10 w-80">
        <h1 className="text-xl font-bold text-blue-700">🕰️ SRM Time Capsule</h1>
        <p className="text-xs text-slate-700">
           {capsules.length > 0 ? `${capsules.length} wisdom entries buried` : "Viewing Demo Mode (Firebase empty)"}
        </p>
        
        {/* Seed Firestore Button - shows only if db is empty */}
        {capsules.length === 0 && (
          <button 
            onClick={seedFirestore}
            className="mt-4 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded transition-all shadow-lg pointer-events-auto"
          >
            🌱 Seed Firestore Database
          </button>
        )}
      </div>

      {selected && (
        <Modal capsule={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
