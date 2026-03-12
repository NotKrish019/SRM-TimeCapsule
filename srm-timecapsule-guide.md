# 🕰️ SRM Time Capsule — Hackathon Guide
> Built for Google IDX · Firebase + React + Three.js · 24-hour roadmap

---

## 🛠️ Tech Stack

| Layer | Technology | Role |
|-------|-----------|------|
| Frontend | React + Vite + Tailwind CSS | UI overlays, navigation, dashboard |
| 3D Engine | Three.js / React Three Fiber | Campus rendering + interactive orbs |
| Backend/DB | Firebase Firestore | Capsule data + user profiles |
| Auth | Firebase Auth | SRM-only Google login |
| Storage | Firebase Storage | Audio files + images |
| IDE | Google IDX | Browser-based development |
| Deploy | Vercel | Live hosting |

---

## 🗂️ Category Color System

| Category | Color |
|----------|-------|
| Academics | `#00ffe7` (Cyan) |
| Social | `#ff6b35` (Orange) |
| Infrastructure | `#ffd700` (Gold) |
| Career | `#a855f7` (Purple) |

---

## 🏗️ Phase 1: Foundation (0–6 Hours)

### Step 1 — Create Project on Google IDX

Open [idx.google.com](https://idx.google.com) → New Project → **React (Vite)** template → name it `srm-timecapsule`.

```bash
# In IDX terminal — install all dependencies at once
npm install three @react-three/fiber @react-three/drei
npm install firebase
npm install @types/three
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

> 💡 **Pro Tip:** IDX auto-saves to Google Drive. You won't lose work if the browser closes.

---

### Step 2 — Set Up Firebase

Go to [console.firebase.google.com](https://console.firebase.google.com) → New Project → Enable **Auth**, **Firestore**, and **Storage**.

```js
// src/firebase.js — paste YOUR config from Firebase Console
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

> 💡 **Pro Tip:** In Firebase Console → Auth → Sign-in method → Enable Google and set the allowed domain to `srmist.edu.in`.

---

### Step 3 — Project Folder Structure

Create these folders inside `/src` now so you don't get lost later.

```
src/
├── components/
│   ├── Scene.jsx          ← Three.js 3D campus
│   ├── CapsuleOrb.jsx     ← Glowing 3D orb
│   ├── Modal.jsx          ← Wisdom popup
│   ├── LoginPage.jsx      ← Auth flow
│   └── HallOfFame.jsx     ← Leaderboard sidebar
├── hooks/
│   └── useGeolocation.js  ← GPS distance check
├── data/
│   └── seedData.js        ← Demo capsules for judges
├── firebase.js            ← Config (done above)
└── App.jsx                ← Root + routing
```

> 💡 **Pro Tip:** Don't worry about making it perfect. You'll fill these in phase by phase.

---

### Step 4 — Build the Login Page

Restrict auth to `@srmist.edu.in` emails. Copy this exactly.

```jsx
// src/components/LoginPage.jsx
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();
// Force account chooser & restrict domain
provider.setCustomParameters({ hd: "srmist.edu.in" });

export default function LoginPage() {
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email;
      // Double-check domain (belt & suspenders)
      if (!email.endsWith("@srmist.edu.in")) {
        await auth.signOut();
        alert("Only SRM students can access this!");
        return;
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <h1 className="text-4xl font-bold mb-2">🕰️ SRM Time Capsule</h1>
      <p className="text-gray-400 mb-8">Wisdom buried by seniors. Unearthed by you.</p>
      <button
        onClick={handleLogin}
        className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-8 py-3 rounded-lg transition-all"
      >
        Login with SRM Google Account
      </button>
    </div>
  );
}
```

> 💡 **Pro Tip:** The `hd` parameter in Google Auth restricts the picker to only show `@srmist.edu.in` accounts.

---

### Step 5 — Seed Demo Data into Firestore

Run this once to populate your demo capsules. Judges need to see content immediately.

```js
// src/data/seedData.js — run this from a useEffect ONCE then comment it out
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";

export const DEMO_CAPSULES = [
  {
    title: "UB Canteen Vending Machine Secret",
    content: "Only accepts crisp ₹10 notes. The left slot jams if you insert ₹20. Workaround: tap the panel twice.",
    category: "Infrastructure",
    author: "Senior '23",
    authorId: "demo1",
    position: { x: 2, y: 0, z: -3 },
    location: "UB Building",
    upvotes: 47,
    lat: 12.8231,
    lng: 80.0444,
  },
  {
    title: "NN Lab GPU Survival Guide",
    content: "PC #4 from the left window has the only working GPU in the lab. Book it at 7am. Bring your own HDMI.",
    category: "Academics",
    author: "Senior '22",
    authorId: "demo2",
    position: { x: -4, y: 0, z: 1 },
    location: "NN Lab",
    upvotes: 93,
    lat: 12.8228,
    lng: 80.0448,
  },
  {
    title: "Library Rooftop Trick",
    content: "The library rooftop door is always unlocked during exam season. Best study spot on campus. AC works.",
    category: "Social",
    author: "Senior '23",
    authorId: "demo3",
    position: { x: 0, y: 0, z: 4 },
    location: "Central Library",
    upvotes: 128,
    lat: 12.8235,
    lng: 80.0440,
  },
  {
    title: "Placement Cell Email Hack",
    content: "Email subject lines with [URGENT] get 3x faster responses from placement coordinators. Tested it.",
    category: "Career",
    author: "Senior '22",
    authorId: "demo4",
    position: { x: 3, y: 0, z: 3 },
    location: "Tech Park",
    upvotes: 211,
    lat: 12.8220,
    lng: 80.0452,
  },
];

// Call this once: seedFirestore()
export async function seedFirestore() {
  for (const capsule of DEMO_CAPSULES) {
    await addDoc(collection(db, "capsules"), capsule);
    console.log("Seeded:", capsule.title);
  }
}
```

> 💡 **Pro Tip:** Call `seedFirestore()` once inside a `useEffect` in `App.jsx`, then delete the call. Don't run it twice or you'll duplicate data.

---

## ⚙️ Phase 2: Core Loop (6–16 Hours)

### Step 6 — Build the 3D Campus Scene

This is your WOW moment. Simple low-poly buildings + floating orbs.

```jsx
// src/components/Scene.jsx
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import CapsuleOrb from "./CapsuleOrb";

function Building({ position, size, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#0a0a1a" />
    </mesh>
  );
}

export default function Scene({ capsules, onOrbClick }) {
  return (
    <Canvas camera={{ position: [0, 8, 12], fov: 60 }}>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00ffe7" />
      <pointLight position={[-10, 5, -10]} intensity={0.5} color="#ff6b35" />
      <Stars radius={100} depth={50} count={5000} factor={4} />
      <Ground />

      {/* SRM Campus Buildings (low-poly blocks) */}
      <Building position={[2, 0.5, -3]}  size={[3, 2, 2]}  color="#1a2a3a" />
      <Building position={[-4, 1, 1]}    size={[2, 3, 2]}  color="#1a3a2a" />
      <Building position={[0, 0.75, 4]}  size={[4, 1.5, 2]} color="#2a1a3a" />
      <Building position={[3, 0.5, 3]}   size={[2, 2, 2]}  color="#3a2a1a" />
      <Building position={[-2, 1.5, -1]} size={[2, 4, 2]}  color="#1a1a3a" />

      {capsules.map((capsule) => (
        <CapsuleOrb
          key={capsule.id}
          position={[capsule.position.x, 1.5, capsule.position.z]}
          category={capsule.category}
          onClick={() => onOrbClick(capsule)}
        />
      ))}

      <OrbitControls
        enablePan={true}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={25}
      />
    </Canvas>
  );
}
```

> 💡 **Pro Tip:** `OrbitControls` lets judges drag to explore the campus. `maxPolarAngle` stops them from flipping underground.

---

### Step 7 — Create the Glowing Orb Component

Each orb pulses with a color matching its category.

```jsx
// src/components/CapsuleOrb.jsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

const CATEGORY_COLORS = {
  Academics:      "#00ffe7",
  Social:         "#ff6b35",
  Infrastructure: "#ffd700",
  Career:         "#a855f7",
};

export default function CapsuleOrb({ position, category, onClick }) {
  const orbRef = useRef();
  const glowRef = useRef();
  const color = CATEGORY_COLORS[category] || "#ffffff";

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (orbRef.current) {
      orbRef.current.position.y = position[1] + Math.sin(t * 2) * 0.15;
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.1);
    }
  });

  return (
    <group position={position} onClick={onClick}>
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.15}
          emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Core orb */}
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
      </mesh>
      <pointLight color={color} intensity={0.8} distance={3} />
    </group>
  );
}
```

> 💡 **Pro Tip:** The two spheres (glow + core) with `emissiveIntensity` create the neon bloom effect without needing post-processing.

---

### Step 8 — Fetch Capsules from Firestore & Wire Up App.jsx

```jsx
// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db } from "./firebase";
import LoginPage from "./components/LoginPage";
import Scene from "./components/Scene";
import Modal from "./components/Modal";

export default function App() {
  const [user, setUser]         = useState(null);
  const [capsules, setCapsules] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, "capsules"), (snap) => {
      setCapsules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user]);

  if (!user) return <LoginPage />;

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#000" }}>
      <Scene capsules={capsules} onOrbClick={setSelected} />

      <div className="absolute top-4 left-4 text-white z-10">
        <h1 className="text-xl font-bold text-cyan-400">🕰️ SRM Time Capsule</h1>
        <p className="text-xs text-gray-400">{capsules.length} wisdom entries buried</p>
      </div>

      {selected && (
        <Modal capsule={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
```

> 💡 **Pro Tip:** `onSnapshot` is a real-time listener. If a judge adds a capsule on their phone, it appears on your screen instantly — great for demos!

---

### Step 9 — Build the Wisdom Modal

```jsx
// src/components/Modal.jsx
import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "../firebase";

const CATEGORY_COLORS = {
  Academics: "#00ffe7", Social: "#ff6b35",
  Infrastructure: "#ffd700", Career: "#a855f7",
};

export default function Modal({ capsule, onClose }) {
  const color = CATEGORY_COLORS[capsule.category] || "#fff";

  const handleUpvote = async () => {
    await updateDoc(doc(db, "capsules", capsule.id), {
      upvotes: increment(1),
    });
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20"
         style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="bg-gray-900 border rounded-2xl p-6 max-w-md w-full mx-4"
           style={{ borderColor: color }}>
        <span className="text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block"
              style={{ background: color + "22", color }}>
          {capsule.category}
        </span>
        <h2 className="text-xl font-bold text-white mb-1">{capsule.title}</h2>
        <p className="text-gray-400 text-sm mb-4">📍 {capsule.location}</p>
        <p className="text-gray-200 leading-relaxed mb-6">{capsule.content}</p>
        <div className="flex items-center justify-between">
          <div className="text-gray-500 text-sm">— {capsule.author}</div>
          <div className="flex gap-3">
            <button onClick={handleUpvote}
                    className="flex items-center gap-1 text-sm text-gray-300 hover:text-yellow-400 transition-colors">
              ⬆️ {capsule.upvotes || 0}
            </button>
            <button onClick={onClose}
                    className="text-sm text-gray-400 hover:text-white transition-colors">
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

> 💡 **Pro Tip:** `increment(1)` from Firestore is atomic — if two students upvote simultaneously, neither vote is lost.

---

## ✨ Phase 3: Wow Factor (16–24 Hours)

### Step 10 — Geofence Logic (Proximity Unlock)

```js
// src/hooks/useGeolocation.js
import { useState, useEffect } from "react";

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useGeolocation() {
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserCoords(null)
    );
  }, []);

  const isNearby = (capsuleLat, capsuleLng) => {
    if (!userCoords) return false;
    return getDistanceMeters(userCoords.lat, userCoords.lng, capsuleLat, capsuleLng) < 100;
  };

  return { userCoords, isNearby };
}

// Usage in Modal.jsx:
// const { isNearby } = useGeolocation();
// const canRead = isNearby(capsule.lat, capsule.lng) || userHasContributed;
// {canRead ? <p>{capsule.content}</p> : <p>🔒 Get closer or contribute wisdom!</p>}
```

> 💡 **Pro Tip:** Add a `DEV_MODE=true` flag that skips the geofence for demos. You can't guarantee judges are on SRM campus!

---

### Step 11 — Add a New Capsule Form

```jsx
// src/components/AddCapsule.jsx
import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

const CATEGORIES = ["Academics", "Social", "Infrastructure", "Career"];

export default function AddCapsule({ onClose }) {
  const [form, setForm] = useState({
    title: "", content: "", category: "Academics", location: ""
  });

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    await addDoc(collection(db, "capsules"), {
      ...form,
      author: auth.currentUser.displayName || "Anonymous Senior",
      authorId: auth.currentUser.uid,
      upvotes: 0,
      createdAt: serverTimestamp(),
      position: {
        x: (Math.random() - 0.5) * 10,
        y: 0,
        z: (Math.random() - 0.5) * 10,
      },
      lat: 12.8231,
      lng: 80.0444,
    });
    onClose();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-20"
         style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="bg-gray-900 border border-purple-500 rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-white text-xl font-bold mb-4">🕰️ Bury Your Wisdom</h2>
        <input placeholder="Title (e.g. 'UB Canteen Secret')"
          className="w-full bg-gray-800 text-white rounded-lg p-3 mb-3 border border-gray-700 focus:border-purple-500 outline-none"
          value={form.title}
          onChange={e => setForm({...form, title: e.target.value})} />
        <textarea placeholder="Your wisdom for juniors..."
          className="w-full bg-gray-800 text-white rounded-lg p-3 mb-3 border border-gray-700 focus:border-purple-500 outline-none h-24 resize-none"
          value={form.content}
          onChange={e => setForm({...form, content: e.target.value})} />
        <select
          className="w-full bg-gray-800 text-white rounded-lg p-3 mb-3 border border-gray-700"
          value={form.category}
          onChange={e => setForm({...form, category: e.target.value})}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="Location (e.g. 'NN Lab')"
          className="w-full bg-gray-800 text-white rounded-lg p-3 mb-4 border border-gray-700 outline-none"
          value={form.location}
          onChange={e => setForm({...form, location: e.target.value})} />
        <div className="flex gap-3">
          <button onClick={handleSubmit}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg transition-colors">
            Bury It 🪄
          </button>
          <button onClick={onClose}
                  className="flex-1 bg-gray-700 text-gray-300 py-2 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
```

> 💡 **Pro Tip:** In production, replace the hardcoded lat/lng with `navigator.geolocation` to auto-tag the capsule at the student's real location.

---

### Step 12 — Hall of Fame Sidebar

```jsx
// src/components/HallOfFame.jsx
export default function HallOfFame({ capsules }) {
  const leaderboard = Object.values(
    capsules.reduce((acc, c) => {
      if (!acc[c.authorId]) {
        acc[c.authorId] = { author: c.author, total: 0, count: 0 };
      }
      acc[c.authorId].total += c.upvotes || 0;
      acc[c.authorId].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total).slice(0, 5);

  return (
    <div className="absolute top-4 right-4 w-64 bg-gray-900 bg-opacity-90 border border-yellow-500 rounded-xl p-4 z-10">
      <h3 className="text-yellow-400 font-bold text-sm mb-3">🏆 Hall of Fame</h3>
      {leaderboard.map((entry, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
          <div>
            <span className="text-yellow-400 font-bold text-sm mr-2">#{i + 1}</span>
            <span className="text-white text-sm">{entry.author}</span>
            <div className="text-gray-500 text-xs">{entry.count} capsules buried</div>
          </div>
          <span className="text-yellow-400 font-bold">{entry.total} ⬆️</span>
        </div>
      ))}
    </div>
  );
}
```

> 💡 **Pro Tip:** Add `<HallOfFame capsules={capsules} />` inside `App.jsx` as an overlay on the 3D scene.

---

### Step 13 — Deploy to Vercel

```bash
# In IDX terminal
npm install -g vercel

# Login (opens browser)
vercel login

# Deploy!
vercel --prod

# You'll get a URL like: srm-timecapsule.vercel.app

# Add these in Vercel Dashboard → Settings → Environment Variables:
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_id

# Update firebase.js to use them:
# apiKey: import.meta.env.VITE_FIREBASE_API_KEY
```

> 💡 **Pro Tip:** Never hardcode your Firebase keys in the repo. Use `VITE_` env vars so they're hidden from GitHub but available in the build.

---

## ✅ Judge Demo Checklist

- [ ] Login with `@srmist.edu.in` blocks non-SRM accounts
- [ ] 5–10 demo capsules already seeded in Firestore
- [ ] Click any orb → modal pops open with wisdom
- [ ] Upvote button works and updates live
- [ ] Hall of Fame shows top seniors
- [ ] "Add Wisdom" button opens form and new orb appears instantly
- [ ] `DEV_MODE` bypasses geofence so judges can see all capsules
- [ ] Site is live on Vercel (not localhost)
- [ ] Pitch line ready: **"Wikipedia for campus survival, in 3D"**

---

## 🏆 Winning Tips

- **Low-poly is your friend.** Don't try to build a hyper-realistic campus. The cyberpunk minimalist aesthetic is intentional and renders fast.
- **Demo the experience, not the code.** Open the live URL, log in, fly around, click an orb, read wisdom, upvote — all in 60 seconds.
- **Scalability pitch:** "This could be a SaaS for universities globally — preserving campus culture at every institution."
- **Real-time is magic.** During the demo, open the site on your phone AND the laptop simultaneously. Add a capsule on your phone and watch it appear on the laptop in real time. Judges love this.

---

*Good luck! 🚀 — SRM Time Capsule Hackathon Guide*
