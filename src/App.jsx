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
    <div className="relative w-screen h-screen bg-[#050814] overflow-hidden">
      {/* If firestore gave no capsules, we pass undefined to Scene so it falls back to DEMO_CAPSULES */}
      <div className="absolute inset-0 w-full h-full">
         <Scene capsules={capsules.length > 0 ? capsules : undefined} onOrbClick={setSelected} />
      </div>

      {/* Top Left HUD Overlay */}
      <div className="absolute top-5 left-5 z-20 pointer-events-none flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[17px]">🕰️</span>
            <h1 className="font-black text-[16px] tracking-wide" style={{ color: "#a0d4ff", textShadow: "0 0 15px rgba(0,180,255,0.6)" }}>
              SRM Time Capsule
            </h1>
          </div>
          <div style={{ color: "#5a8aaa", fontSize: 10, marginTop: 2 }}>
            {capsules.length > 0 ? `${capsules.length} wisdom entries buried` : "Viewing Demo Mode (Firebase empty)"}
          </div>
        </div>

        {/* Seed Firestore Button - shows only if db is empty */}
        {capsules.length === 0 && (
          <button 
            onClick={seedFirestore}
            className="self-start px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs rounded shadow-[0_0_12px_rgba(234,179,8,0.4)] transition-all pointer-events-auto flex items-center gap-1.5"
          >
            <span>🌱</span> Seed Firestore Database
          </button>
        )}
      </div>

      {selected && (
        <Modal capsule={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
