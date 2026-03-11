// Scene.jsx — Optimized SRM Campus 3D Model
// REMOVED: Html, Text from @react-three/drei (saves ~200kb)
// Labels rendered as React DOM overlays instead
// Shared geometries reused across all buildings (major perf win)
// Mapped from SRM satellite: top = Main University, bottom = Engineering Block

import { useRef, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────
// SHARED GEOMETRY (created once, reused by all)
// ─────────────────────────────────────────────
const BOX_GEO    = new THREE.BoxGeometry(1, 1, 1);
const SPHERE_GEO = new THREE.SphereGeometry(1, 12, 12);
const PLANE_GEO  = new THREE.PlaneGeometry(1, 1);
const CYL_GEO    = new THREE.CylinderGeometry(0.03, 0.15, 3, 6, 1, true);
const CONE_GEO   = new THREE.ConeGeometry(0.4, 1.2, 5);
const TRUNK_GEO  = new THREE.CylinderGeometry(0.08, 0.1, 0.4, 5);

const CATEGORY_COLORS = {
  Academics:      "#00ffe7",
  Social:         "#ff6b35",
  Infrastructure: "#ffd700",
  Career:         "#a855f7",
};

// ─────────────────────────────────────────────
// BUILDING
// ─────────────────────────────────────────────
function Building({ position, size, color, label, floors = 1, onHover }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    const target = hovered ? 0.35 : 0.05;
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      meshRef.current.material.emissiveIntensity, target, 0.1
    );
  });

  const h = size[1] * floors;

  const handleOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
    onHover && onHover({ label, x: e.clientX, y: e.clientY });
    document.body.style.cursor = "pointer";
  }, [label, onHover]);

  const handleOut = useCallback(() => {
    setHovered(false);
    onHover && onHover(null);
    document.body.style.cursor = "default";
  }, [onHover]);

  return (
    <group position={[position[0], h / 2, position[2]]}>
      <mesh
        ref={meshRef}
        scale={[size[0], h, size[2]]}
        geometry={BOX_GEO}
        onPointerOver={handleOver}
        onPointerOut={handleOut}
      >
        <meshStandardMaterial
          color={color} emissive={color} emissiveIntensity={0.05}
          roughness={0.8} metalness={0.1}
        />
      </mesh>
      
      {/* Windows (glass strips) per floor */}
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={i} position={[0, -h / 2 + (i + 0.5) * size[1], 0]}
              scale={[size[0] + 0.02, size[1] * 0.4, size[2] + 0.02]} geometry={BOX_GEO}
              style={{ pointerEvents: "none" }}>
          <meshStandardMaterial color="#4facfe" roughness={0.1} metalness={0.8} />
        </mesh>
      ))}

      {/* Rooftop trim */}
      <mesh position={[0, h / 2 + 0.04, 0]}
            scale={[size[0] + 0.12, 0.07, size[2] + 0.12]}
            geometry={BOX_GEO}
            style={{ pointerEvents: "none" }}>
        <meshStandardMaterial color="#333333" roughness={0.9} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────
// CAPSULE ORB
// ─────────────────────────────────────────────
function CapsuleOrb({ position, category, onClick }) {
  const orbRef  = useRef();
  const glowRef = useRef();
  const color   = CATEGORY_COLORS[category] || "#ffffff";
  const colorObj = new THREE.Color(color);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbRef.current)
      orbRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.22;
    if (glowRef.current)
      glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.13);
  });

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={()  => (document.body.style.cursor = "default")}
    >
      <mesh ref={glowRef} scale={[0.9, 0.9, 0.9]} geometry={SPHERE_GEO}>
        <meshStandardMaterial color={color} transparent opacity={0.1}
          emissive={colorObj} emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={orbRef} scale={[0.28, 0.28, 0.28]} geometry={SPHERE_GEO}>
        <meshStandardMaterial color={color} emissive={colorObj} emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0, -1.5, 0]} geometry={CYL_GEO}>
        <meshStandardMaterial color={color} transparent opacity={0.07}
          emissive={colorObj} emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={color} intensity={1.5} distance={5} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────
// TREES & FOREST
// ─────────────────────────────────────────────
function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.2, 0]} geometry={TRUNK_GEO}>
        <meshStandardMaterial color="#4a301e" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.0, 0]} geometry={CONE_GEO}>
        <meshStandardMaterial color="#1f5a34" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 0]} scale={[0.7, 0.8, 0.7]} geometry={CONE_GEO}>
        <meshStandardMaterial color="#2a7644" roughness={0.8} />
      </mesh>
    </group>
  );
}

function Forest() {
  const [trees] = useState(() => {
    const arr = [];
    for (let i = 0; i < 150; i++) {
        const x = (Math.random() - 0.5) * 80;
        const z = (Math.random() - 0.5) * 80;
        // Keep clear of buildings and roads
        if (Math.abs(x) < 8 && Math.abs(z) < 22) continue; 
        if (Math.abs(x - 5.5) < 3 && Math.abs(z) < 25) continue; 
        const scale = 0.5 + Math.random() * 0.8;
        arr.push({ x, z, scale });
    }
    return arr;
  });

  return (
    <group>
      {trees.map((t, i) => (
        <Tree key={i} position={[t.x, 0, t.z]} scale={t.scale} />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────
// GROUND
// ─────────────────────────────────────────────
function Ground() {
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh scale={[120, 120, 1]} geometry={PLANE_GEO}>
        <meshStandardMaterial color="#1b4332" roughness={0.9} />
      </mesh>
      <mesh position={[1, -5.5, -0.01]} scale={[9, 4, 1]} geometry={PLANE_GEO}>
        <meshStandardMaterial color="#0d2d25" />
      </mesh>
      <mesh position={[0, 1.5, -0.01]} scale={[12, 4, 1]} geometry={PLANE_GEO}>
        <meshStandardMaterial color="#0d2d25" />
      </mesh>
      <mesh position={[5.5, 0, -0.01]} scale={[2.5, 50, 1]} geometry={PLANE_GEO}>
        <meshStandardMaterial color="#edf1ed" roughness={0.7} />
      </mesh>
      <mesh position={[0, -1, -0.01]} scale={[14, 3, 1]} geometry={PLANE_GEO}>
        <meshStandardMaterial color="#edf1ed" roughness={0.7} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────
// FULL CAMPUS
// ─────────────────────────────────────────────
function Campus({ capsules, onOrbClick, onBuildingHover }) {
  return (
    <group>
      <Ground />
      <Forest />

      {/* ══ MAIN SRM UNIVERSITY (top, z: -8 to -18) ══ */}
      <Building position={[-2.5, 0,-12]}  size={[2.5,1,4.5]} color="#f0f4f8" label="Main Block — Left Wing"   floors={3} onHover={onBuildingHover} />
      <Building position={[0.5,  0,-14]}  size={[5.5,1,2.5]} color="#e2e8f0" label="Administrative Block"     floors={4} onHover={onBuildingHover} />
      <Building position={[3.5,  0,-12]}  size={[2.5,1,4.5]} color="#f0f4f8" label="Main Block — Right Wing"  floors={3} onHover={onBuildingHover} />
      <Building position={[-1,   0,-9]}   size={[3.5,1,2]}   color="#cbd5e1" label="Lecture Hall Complex"     floors={2} onHover={onBuildingHover} />
      <Building position={[2.8,  0,-9]}   size={[3,  1,2.2]} color="#94a3b8" label="Faculty Block"            floors={2} onHover={onBuildingHover} />
      <Building position={[-3.5, 0,-17]}  size={[3.5,1,3.5]} color="#e2e8f0" label="North Campus Block"       floors={2} onHover={onBuildingHover} />

      {/* ══ ENGINEERING BLOCK (bottom, z: +3 to +18) ══ */}
      <Building position={[-1,   0, 3.5]} size={[5.5,1,3]}   color="#fcd34d" label="Engineering Block A"      floors={3} onHover={onBuildingHover} />
      <Building position={[-3.5, 0, 7.5]} size={[3.2,1,2.8]} color="#f87171" label="Computer Science Dept"    floors={3} onHover={onBuildingHover} />
      <Building position={[0.3,  0, 7.5]} size={[2.8,1,2.8]} color="#60a5fa" label="Electronics Dept"         floors={2} onHover={onBuildingHover} />
      <Building position={[3.5,  0, 7]}   size={[2.8,1,3.2]} color="#a78bfa" label="Mechanical Dept"          floors={3} onHover={onBuildingHover} />
      <Building position={[-3,   0,11.2]} size={[4.5,1,2.8]} color="#fb923c" label="NN Lab Block"             floors={2} onHover={onBuildingHover} />
      <Building position={[2.2,  0,11.5]} size={[3.8,1,2.2]} color="#9ca3af" label="Research Labs"            floors={2} onHover={onBuildingHover} />
      <Building position={[-0.5, 0,14.5]} size={[7,  1,2.2]} color="#34d399" label="Bio / Greenhouse Block"   floors={1} onHover={onBuildingHover} />
      <Building position={[0.5,  0,17.5]} size={[3.5,1,2.8]} color="#f43f5e" label="Medical Centre"           floors={2} onHover={onBuildingHover} />

      {/* ══ CAPSULE ORBS ══ */}
      {capsules.map((capsule) => (
        <CapsuleOrb
          key={capsule.id}
          position={[capsule.position.x, 3.2, capsule.position.z]}
          category={capsule.category}
          onClick={() => onOrbClick(capsule)}
        />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────
// DOM OVERLAYS (replaces @react-three/drei Html)
// ─────────────────────────────────────────────
function BuildingTooltip({ info }) {
  if (!info) return null;
  return (
    <div style={{
      position: "fixed", left: info.x + 14, top: info.y - 10,
      pointerEvents: "none", background: "#edf1ed",
      border: "2px solid #0d2d25", color: "#0d2d25",
      padding: "6px 12px", borderRadius: 8,
      fontSize: 12, fontFamily: "'Akkurat', sans-serif", fontWeight: 700,
      zIndex: 50, whiteSpace: "nowrap", boxShadow: "0px 4px 10px rgba(0,0,0,0.15)"
    }}>
      {info.label}
    </div>
  );
}

function Compass() {
  return (
    <div style={{
      position: "absolute", top: 16, right: 16, zIndex: 20,
      fontFamily: "'Akkurat', sans-serif", fontSize: 12, textAlign: "center",
      background: "#edf1ed", padding: "12px", borderRadius: "12px", border: "2px solid #0d2d25",
      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
    }}>
      <div style={{ color: "#0d2d25", fontWeight: 900 }}>▲ N</div>
      <div style={{ color: "#1b4332", margin: "4px 0", fontWeight: 'bold' }}>Main University</div>
      <div style={{ color: "#0d2d25" }}>│</div>
      <div style={{ color: "#1b4332", margin: "4px 0", fontWeight: 'bold' }}>Engineering Block</div>
      <div style={{ color: "#0d2d25", fontWeight: 900 }}>▼ S</div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{
      position: "absolute", bottom: 16, left: 16, zIndex: 20,
      display: "flex", flexDirection: "column", gap: 7,
      background: "#edf1ed", padding: "12px", borderRadius: "12px", border: "2px solid #0d2d25",
      boxShadow: "0px 4px 10px rgba(0,0,0,0.1)"
    }}>
      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 12, height: 12, borderRadius: "50%",
            background: color, border: "2px solid #0d2d25"
          }} />
          <span style={{ color: "#0d2d25", fontSize: 12, fontFamily: "'Akkurat', sans-serif", fontWeight: 700 }}>
            {cat}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// DEMO CAPSULES
// ─────────────────────────────────────────────
export const DEMO_CAPSULES = [
  { id: "c1", title: "NN Lab GPU Secret",
    content: "PC #4 from the left window has the only working GPU. Book it at 7am. Bring your own HDMI.",
    category: "Academics", location: "NN Lab", author: "Senior '22", upvotes: 93,
    position: { x: -3, z: 11.2 } },
  { id: "c2", title: "UB Canteen Vending Trick",
    content: "Only accepts crisp ₹10 notes. Tap the panel twice if the left slot jams.",
    category: "Infrastructure", location: "Engineering Block A", author: "Senior '23", upvotes: 47,
    position: { x: -1, z: 3.5 } },
  { id: "c3", title: "Library / Admin Study Spot",
    content: "Rooftop door unlocked during exam season. AC works and always empty.",
    category: "Social", location: "Administrative Block", author: "Senior '23", upvotes: 128,
    position: { x: 0.5, z: -14 } },
  { id: "c4", title: "Placement Email Hack",
    content: "[URGENT] in subject gets 3× faster replies from placement cell.",
    category: "Career", location: "Faculty Block", author: "Senior '22", upvotes: 211,
    position: { x: 2.8, z: -9 } },
  { id: "c5", title: "CS Lab Unlimited Session",
    content: "Login as guest on any PC for unlimited session time. Nobody checks.",
    category: "Academics", location: "CS Dept", author: "Senior '23", upvotes: 76,
    position: { x: -3.5, z: 7.5 } },
];

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function Scene({ capsules = DEMO_CAPSULES, onOrbClick = () => {} }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", fontFamily: "'Akkurat', sans-serif" }}>
      <Canvas
        camera={{ position: [0, 22, 24], fov: 52 }}
        style={{ background: "#87CEEB" }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight position={[20, 40, 20]} intensity={2.5} color="#fffde7" castShadow />
        <directionalLight position={[-20, 20, -20]} intensity={1.0} color="#e0f7fa" />
        <Suspense fallback={null}>
          <Campus capsules={capsules} onOrbClick={onOrbClick} onBuildingHover={setTooltip} />
        </Suspense>
        <OrbitControls enablePan enableZoom enableRotate
          maxPolarAngle={Math.PI / 2.15} minDistance={7} maxDistance={55}
          target={[0, 0, 0]} enableDamping dampingFactor={0.08} />
      </Canvas>

      <BuildingTooltip info={tooltip} />
      <Compass />
      <Legend />
    </div>
  );
}
