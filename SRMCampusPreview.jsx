import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Text, Html } from "@react-three/drei";
import * as THREE from "three";

const CATEGORY_COLORS = {
  Academics:      "#00ffe7",
  Social:         "#ff6b35",
  Infrastructure: "#ffd700",
  Career:         "#a855f7",
};

function Building({ position, size, color, label, floors = 1 }) {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef();

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 0.4 : 0.05;
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      meshRef.current.material.emissiveIntensity, target, 0.1
    );
  });

  const h = size[1] * floors;
  return (
    <group position={[position[0], h / 2, position[2]]}>
      <mesh ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}>
        <boxGeometry args={[size[0], h, size[2]]} />
        <meshStandardMaterial color={color} emissive={color}
          emissiveIntensity={0.05} roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, h / 2 + 0.05, 0]}>
        <boxGeometry args={[size[0] + 0.1, 0.07, size[2] + 0.1]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>
      {hovered && label && (
        <Html position={[0, h / 2 + 0.9, 0]} center style={{ pointerEvents: "none" }}>
          <div style={{
            background: "rgba(0,0,0,0.9)", border: "1px solid #00ffe755",
            color: "#00ffe7", padding: "3px 9px", borderRadius: 5,
            fontSize: 10, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 700,
          }}>{label}</div>
        </Html>
      )}
    </group>
  );
}

function CapsuleOrb({ position, category, label, onClick }) {
  const orbRef = useRef();
  const glowRef = useRef();
  const color = CATEGORY_COLORS[category] || "#fff";
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (orbRef.current)  orbRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.2;
    if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
  });

  return (
    <group position={position} onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.12}
          emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={orbRef}>
        <sphereGeometry args={[0.28, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      <mesh position={[0, -1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.15, 3, 8, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.07}
          emissive={color} emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={color} intensity={hovered ? 2 : 1.2} distance={4} />
      <Html position={[0.65, 0.5, 0]} style={{ pointerEvents: "none" }}>
        <div style={{
          background: "rgba(0,0,0,0.8)", border: `1px solid ${color}88`,
          color, padding: "2px 7px", borderRadius: 4,
          fontSize: 9, fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 700,
        }}>{label}</div>
      </Html>
    </group>
  );
}

function Road({ position, size }) {
  return (
    <mesh position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#1a1a2e" />
    </mesh>
  );
}

function Ground() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 80]} />
        <meshStandardMaterial color="#080f1a" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2, 0.01, -6]}>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial color="#091a0f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.01, 2]}>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#091a0f" />
      </mesh>
    </>
  );
}

const DEMO_CAPSULES = [
  { id: "c1", title: "NN Lab GPU Secret",
    content: "PC #4 from the left window has the only working GPU. Book it at 7am. Bring your own HDMI.",
    category: "Academics", location: "NN Lab", author: "Senior '22", upvotes: 93,
    position: { x: -3, z: 11 } },
  { id: "c2", title: "UB Canteen Vending Trick",
    content: "Only accepts crisp ₹10 notes. Tap the panel twice if the left slot jams.",
    category: "Infrastructure", location: "Engineering Block A", author: "Senior '23", upvotes: 47,
    position: { x: -1, z: 3.5 } },
  { id: "c3", title: "Library Study Spot",
    content: "Rooftop door is unlocked during exam season. AC works and it's always empty.",
    category: "Social", location: "Admin Block", author: "Senior '23", upvotes: 128,
    position: { x: 0.5, z: -14 } },
  { id: "c4", title: "Placement Email Hack",
    content: "[URGENT] in subject line gets 3x faster replies from the placement cell.",
    category: "Career", location: "Faculty Block", author: "Senior '22", upvotes: 211,
    position: { x: 2.5, z: -9 } },
  { id: "c5", title: "CS Lab Shortcut",
    content: "Login as guest on any PC for unlimited session time. Nobody checks.",
    category: "Academics", location: "CS Dept", author: "Senior '23", upvotes: 76,
    position: { x: -3.5, z: 7.5 } },
];

function Campus({ onOrbClick }) {
  return (
    <group>
      <Ground />
      <Road position={[5.5, 0, 0]}  size={[2, 50]} />
      <Road position={[0, 0, -1]}   size={[12, 3]} />

      {/* ── MAIN SRM UNIVERSITY (top cluster) ── */}
      <Building position={[-2.5,0,-12]} size={[2.5,1,4]} color="#2a3a5a" label="Main Block — Left Wing"    floors={3} />
      <Building position={[0.5, 0,-14]} size={[5,  1,2.5]} color="#1e3a5f" label="Administrative Block"   floors={4} />
      <Building position={[3.5, 0,-12]} size={[2.5,1,4]} color="#2a3a5a" label="Main Block — Right Wing"  floors={3} />
      <Building position={[-1,  0,-9.5]} size={[3, 1,2]} color="#1a2a4a" label="Lecture Hall Complex"     floors={2} />
      <Building position={[2.5, 0,-9]}  size={[2.5,1,2.5]} color="#162440" label="Faculty Block"         floors={2} />
      <Building position={[-3,  0,-17]} size={[3, 1,3]} color="#162440" label="North Campus Block"        floors={2} />

      {/* ── ENGINEERING BLOCK (bottom cluster) ── */}
      <Building position={[-1,  0, 3.5]} size={[5,1,3]}   color="#4a2a1a" label="Engineering Block A"    floors={3} />
      <Building position={[-3.5,0, 7.5]} size={[3,1,2.5]} color="#1a2a4a" label="Computer Science Dept"  floors={3} />
      <Building position={[0,   0, 7.5]} size={[2.5,1,2.5]} color="#162440" label="Electronics Dept"    floors={2} />
      <Building position={[3,   0, 7]}   size={[2.5,1,3]} color="#1e2a40" label="Mechanical Dept"        floors={3} />
      <Building position={[-3,  0, 11]}  size={[4,1,2.5]} color="#162035" label="NN Lab Block"           floors={2} />
      <Building position={[2,   0, 11.5]} size={[3.5,1,2]} color="#1a1a35" label="Research Labs"         floors={2} />
      <Building position={[-1,  0, 14.5]} size={[6,1,2]}  color="#1a3a2a" label="Bio / Greenhouse Block" floors={1} />
      <Building position={[0,   0, 17]}  size={[3,1,2.5]} color="#3a1a1a" label="Medical Centre (H)"     floors={2} />

      {/* ── CAPSULE ORBS ── */}
      {DEMO_CAPSULES.map((c) => (
        <CapsuleOrb key={c.id}
          position={[c.position.x, 3, c.position.z]}
          category={c.category}
          label={c.location}
          onClick={() => onOrbClick(c)}
        />
      ))}
    </group>
  );
}

// ── MODAL ──────────────────────────────────────
function Modal({ capsule, onClose }) {
  const color = CATEGORY_COLORS[capsule.category] || "#fff";
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 30,
      background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: "#0d1117", border: `1px solid ${color}66`,
        borderRadius: 16, padding: 24, maxWidth: 380, width: "90%",
        fontFamily: "monospace",
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
          background: color + "22", color, display: "inline-block", marginBottom: 12,
        }}>{capsule.category}</span>
        <h2 style={{ color: "#fff", margin: "0 0 4px", fontSize: 17 }}>{capsule.title}</h2>
        <p style={{ color: "#64748b", fontSize: 12, margin: "0 0 14px" }}>
          📍 {capsule.location}
        </p>
        <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: "0 0 20px", fontSize: 13 }}>
          {capsule.content}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#475569", fontSize: 12 }}>— {capsule.author}</span>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ color: "#fbbf24", fontSize: 13, fontWeight: 700 }}>
              ⬆ {capsule.upvotes}
            </span>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid #334155", color: "#94a3b8",
              padding: "4px 12px", borderRadius: 6, cursor: "pointer",
              fontFamily: "monospace", fontSize: 12,
            }}>✕ Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── LEGEND ─────────────────────────────────────
function Legend() {
  return (
    <div style={{
      position: "absolute", bottom: 16, left: 16, zIndex: 20,
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: color, boxShadow: `0 0 6px ${color}`,
          }} />
          <span style={{ color, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>
            {cat}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── ROOT ───────────────────────────────────────
export default function App() {
  const [selected, setSelected] = useState(null);

  return (
    <div style={{ width: "100%", height: "100vh", background: "#060612", position: "relative" }}>
      {/* HUD */}
      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 20,
        fontFamily: "monospace",
      }}>
        <div style={{ color: "#00ffe7", fontWeight: 900, fontSize: 16 }}>
          🕰️ SRM TIME CAPSULE
        </div>
        <div style={{ color: "#334155", fontSize: 10, marginTop: 2 }}>
          Drag to rotate · Scroll to zoom · Click orbs
        </div>
      </div>

      <div style={{
        position: "absolute", top: 16, right: 16, zIndex: 20,
        display: "flex", flexDirection: "column", gap: 5,
        fontFamily: "monospace",
      }}>
        <div style={{ color: "#00ffe7", fontSize: 10, opacity: 0.7 }}>▲ NORTH</div>
        <div style={{ color: "#64748b", fontSize: 10 }}>Main University</div>
        <div style={{ color: "#ff6b35", fontSize: 10 }}>▼ Engineering Block</div>
      </div>

      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 22, 22], fov: 55 }}>
        <ambientLight intensity={0.25} />
        <directionalLight position={[5, 20, 5]} intensity={0.6} color="#4488ff" />
        <pointLight position={[0, 8, -20]} intensity={1.5} color="#00ffe7" distance={40} />
        <pointLight position={[0, 8, 20]}  intensity={1.0} color="#ff6b35" distance={40} />
        <Stars radius={120} depth={60} count={6000} factor={4} fade />
        <Campus onOrbClick={setSelected} />
        <OrbitControls enablePan enableZoom enableRotate
          maxPolarAngle={Math.PI / 2.1} minDistance={6} maxDistance={50} target={[0,0,0]} />
      </Canvas>

      <Legend />

      {selected && <Modal capsule={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
