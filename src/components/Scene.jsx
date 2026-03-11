// Scene.jsx — Full SRM University 3D Model
// Mapped from detailed labeled satellite image (March 2026)
// Buildings (N→S): Temple, Transport, Construction, Boys/Girls Hostel,
//   Faculty Hostel, Law Block, Old Law Block, Engineering Block,
//   Admin Block, Federal Bank, Royal Cafe, Library,
//   Hospital, Chemistry Labs, Sports Complex, Sports Ground
// Coordinate system: Z negative = North (top), Z positive = South (bottom)
// Background: transparent canvas — only buildings, roads, gardens rendered

import { useRef, useState, useCallback, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────
// SHARED GEOMETRIES (created once, reused)
// ─────────────────────────────────────────────
const BOX_GEO    = new THREE.BoxGeometry(1, 1, 1);
const SPHERE_GEO = new THREE.SphereGeometry(1, 10, 10);
const PLANE_GEO  = new THREE.PlaneGeometry(1, 1);
const CYL_GEO    = new THREE.CylinderGeometry(0.03, 0.18, 3, 6, 1, true);

// ─────────────────────────────────────────────
// CATEGORY COLORS
// ─────────────────────────────────────────────
const CATEGORY_COLORS = {
  Academics:      "#00ffe7",
  Social:         "#ff6b35",
  Infrastructure: "#ffd700",
  Career:         "#a855f7",
};

// ─────────────────────────────────────────────
// BUILDING COLORS by type
// ─────────────────────────────────────────────
const COLORS = {
  hostel:       "#2a3a5a",   // blue-grey
  academic:     "#1b3358",   // deep blue
  engineering:  "#4a2515",   // terracotta brown (matches satellite)
  admin:        "#1a3a4a",   // teal-dark
  amenity:      "#2a2a1a",   // dark olive
  medical:      "#3a141a",   // deep red
  sports:       "#142818",   // dark green
  temple:       "#4a3a1a",   // dark gold
  construction: "#2a2a2a",   // grey (unfinished)
  library:      "#1a2a4a",   // navy
};

// ─────────────────────────────────────────────
// BUILDING COMPONENT
// ─────────────────────────────────────────────
function Building({ position, size, color, label, floors = 1, onHover }) {
  const meshRef = useRef();
  const [hov, setHov] = useState(false);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      meshRef.current.material.emissiveIntensity,
      hov ? 0.4 : 0.06,
      0.12
    );
  });

  const h = size[1] * floors;

  const onOver = useCallback((e) => {
    e.stopPropagation();
    setHov(true);
    onHover?.({ label, x: e.clientX, y: e.clientY });
    document.body.style.cursor = "pointer";
  }, [label, onHover]);

  const onOut = useCallback(() => {
    setHov(false);
    onHover?.(null);
    document.body.style.cursor = "default";
  }, [onHover]);

  return (
    <group position={[position[0], h / 2, position[2]]}>
      {/* Main block */}
      <mesh ref={meshRef} scale={[size[0], h, size[2]]}
            geometry={BOX_GEO} onPointerOver={onOver} onPointerOut={onOut}>
        <meshStandardMaterial color={color} emissive={color}
          emissiveIntensity={0.06} roughness={0.6} metalness={0.3} />
      </mesh>
      {/* Roof trim */}
      <mesh position={[0, h / 2 + 0.04, 0]}
            scale={[size[0] + 0.1, 0.06, size[2] + 0.1]} geometry={BOX_GEO}>
        <meshStandardMaterial color="#99bbdd" transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────
// TEMPLE — distinct pyramid/dome shape
// ─────────────────────────────────────────────
function Temple({ position, onHover }) {
  const meshRef = useRef();
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });
  const onOver = (e) => { e.stopPropagation(); onHover?.({ label: "Sri Sarveshwar Temple", x: e.clientX, y: e.clientY }); document.body.style.cursor = "pointer"; };
  const onOut  = () => { onHover?.(null); document.body.style.cursor = "default"; };
  return (
    <group position={position}>
      {/* Base */}
      <mesh scale={[2.5, 0.6, 2.5]} geometry={BOX_GEO} onPointerOver={onOver} onPointerOut={onOut}>
        <meshStandardMaterial color="#4a3a1a" emissive="#4a3a1a" emissiveIntensity={0.1} />
      </mesh>
      {/* Spire */}
      <mesh ref={meshRef} position={[0, 1.2, 0]}>
        <coneGeometry args={[0.7, 1.8, 8]} />
        <meshStandardMaterial color="#c8952a" emissive="#c8952a" emissiveIntensity={0.3} />
      </mesh>
      <pointLight position={[0, 2, 0]} color="#ffd700" intensity={1} distance={6} />
    </group>
  );
}

// ─────────────────────────────────────────────
// ENTRY GATE
// ─────────────────────────────────────────────
function EntryGate({ position }) {
  return (
    <group position={position}>
      {/* Left pillar */}
      <mesh position={[-0.8, 1, 0]} scale={[0.4, 2.5, 0.4]} geometry={BOX_GEO}>
        <meshStandardMaterial color="#c8a050" emissive="#c8a050" emissiveIntensity={0.2} />
      </mesh>
      {/* Right pillar */}
      <mesh position={[0.8, 1, 0]} scale={[0.4, 2.5, 0.4]} geometry={BOX_GEO}>
        <meshStandardMaterial color="#c8a050" emissive="#c8a050" emissiveIntensity={0.2} />
      </mesh>
      {/* Arch top */}
      <mesh position={[0, 2.4, 0]} scale={[2.2, 0.35, 0.4]} geometry={BOX_GEO}>
        <meshStandardMaterial color="#c8a050" emissive="#c8a050" emissiveIntensity={0.2} />
      </mesh>
      <pointLight position={[0, 3, 0]} color="#ffd700" intensity={0.8} distance={5} />
    </group>
  );
}

// ─────────────────────────────────────────────
// ROAD STRIP (flat plane on ground)
// ─────────────────────────────────────────────
function Road({ position, size, angle = 0 }) {
  return (
    <mesh position={[position[0], 0.015, position[2]]}
          rotation={[-Math.PI / 2, 0, angle]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#141428" />
    </mesh>
  );
}

// ─────────────────────────────────────────────
// GARDEN / GREEN AREA
// ─────────────────────────────────────────────
function Garden({ position, size, opacity = 1 }) {
  return (
    <mesh position={[position[0], 0.01, position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={size} />
      <meshStandardMaterial color="#0d2a14" transparent opacity={opacity} />
    </mesh>
  );
}

// ─────────────────────────────────────────────
// CAPSULE ORB
// ─────────────────────────────────────────────
function CapsuleOrb({ position, category, onClick }) {
  const orbRef  = useRef();
  const glowRef = useRef();
  const color   = CATEGORY_COLORS[category] || "#ffffff";
  const col3    = new THREE.Color(color);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbRef.current)
      orbRef.current.position.y = position[1] + Math.sin(t * 2 + position[0]) * 0.22;
    if (glowRef.current)
      glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.13);
  });

  return (
    <group position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={()  => (document.body.style.cursor = "default")}>
      <mesh ref={glowRef} scale={[0.85, 0.85, 0.85]} geometry={SPHERE_GEO}>
        <meshStandardMaterial color={color} transparent opacity={0.1}
          emissive={col3} emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={orbRef} scale={[0.28, 0.28, 0.28]} geometry={SPHERE_GEO}>
        <meshStandardMaterial color={color} emissive={col3} emissiveIntensity={2.5} />
      </mesh>
      <mesh position={[0, -1.5, 0]} geometry={CYL_GEO}>
        <meshStandardMaterial color={color} transparent opacity={0.06}
          emissive={col3} emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color={color} intensity={1.5} distance={5} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────
// FULL CAMPUS
// All positions derived from labeled satellite image.
// Origin (0,0,0) = center of campus (roughly Federal Bank level)
// ─────────────────────────────────────────────
function Campus({ capsules, onOrbClick, onBuildingHover }) {
  return (
    <group>

      {/* ════════════════════════════════════
          ROADS
          ════════════════════════════════════ */}
      {/* Main road — right side, full N-S length */}
      <Road position={[6.5,  0,  -2]} size={[2.5, 60]} />
      {/* Internal campus road between hostel & academic zones */}
      <Road position={[0,    0,  -6]} size={[14,  2]} />
      {/* Road between library and hospital zone */}
      <Road position={[0,    0,   5]} size={[14,  1.5]} />
      {/* Internal cross road (horizontal, academic zone) */}
      <Road position={[0,    0,  -0.5]} size={[14, 1.5]} />
      {/* Side lane to entry gate */}
      <Road position={[4.5,  0, -14]} size={[1.5, 5]} />

      {/* ════════════════════════════════════
          GARDENS / GREEN AREAS
          ════════════════════════════════════ */}
      {/* Hostel ground — large central green between hostel blocks */}
      <Garden position={[1.5, 0, -9]}  size={[7,  6]}  />
      {/* Small green courtyard in hostel cluster */}
      <Garden position={[-1,  0, -12]} size={[3,  2]}  />
      {/* Garden strip between academic blocks */}
      <Garden position={[1,   0,  -3]} size={[5,  2]}  />
      {/* Sports ground — large green at south */}
      <Garden position={[1,   0,  14]} size={[10, 7]}  />
      {/* Roadside trees / greenery (right edge) */}
      <Garden position={[9,   0,   0]} size={[3,  50]} opacity={0.5} />

      {/* ════════════════════════════════════
          NORTH ZONE  (z: -28 to -14)
          Temple, Transport, Construction, Hostels
          ════════════════════════════════════ */}

      {/* Sri Sarveshwar Temple */}
      <Temple position={[-3.5, 0, -26]} onHover={onBuildingHover} />

      {/* Transport area — top right, long strip */}
      <Building position={[4,   0, -25]} size={[4, 1, 3]}   color={COLORS.amenity}
                label="Transport Area" floors={1} onHover={onBuildingHover} />

      {/* Under construction — 3 incomplete blocks */}
      <Building position={[-2.5, 0, -18]} size={[2.5,1,2.5]} color={COLORS.construction}
                label="Under Construction (Block 1)" floors={2} onHover={onBuildingHover} />
      <Building position={[0,    0, -18]} size={[2,  1,2.5]} color={COLORS.construction}
                label="Under Construction (Block 2)" floors={1} onHover={onBuildingHover} />

      {/* Boys Hostel — right of construction */}
      <Building position={[2.5,  0, -17]} size={[3,  1,3]}   color={COLORS.hostel}
                label="Boys Hostel" floors={3} onHover={onBuildingHover} />

      {/* Entry Gate — right side */}
      <EntryGate position={[6, 0, -14]} />

      {/* Faculty Hostel — between boys hostel and hostel ground */}
      <Building position={[1,   0, -13.5]} size={[3.5,1,2]} color={COLORS.hostel}
                label="Faculty Hostel" floors={2} onHover={onBuildingHover} />

      {/* Girls Hostel + Bunnys — left side */}
      <Building position={[-4.5, 0, -11]} size={[2.5,1,3]}   color="#3a2a5a"
                label="Girls Hostel" floors={3} onHover={onBuildingHover} />
      <Building position={[-4.5, 0, -8]}  size={[2,  1,2]}   color="#2a1a4a"
                label="Bunnys Canteen" floors={1} onHover={onBuildingHover} />

      {/* ════════════════════════════════════
          ACADEMIC ZONE  (z: -6 to +2)
          Law Blocks, Engineering, Admin, Bank, Cafe
          ════════════════════════════════════ */}

      {/* Law Block — left */}
      <Building position={[-4,  0, -5]}  size={[3,  1,2.5]} color={COLORS.academic}
                label="Law Block" floors={3} onHover={onBuildingHover} />

      {/* Old Law Block — right of center */}
      <Building position={[2.5, 0, -5]}  size={[3,  1,2.5]} color={COLORS.academic}
                label="Old Law Block" floors={2} onHover={onBuildingHover} />

      {/* Engineering Block — large, multi-part left side */}
      <Building position={[-4,  0, -2]}  size={[3.5,1,3.5]} color={COLORS.engineering}
                label="Engineering Block" floors={3} onHover={onBuildingHover} />
      {/* Engineering block annex */}
      <Building position={[-1.5,0, -2]}  size={[2,  1,2.5]} color="#3a1e0e"
                label="Engineering Block (Annex)" floors={2} onHover={onBuildingHover} />

      {/* Administration Block — right side */}
      <Building position={[3,   0, -2]}  size={[3,  1,3.5]} color={COLORS.admin}
                label="Administration Block" floors={3} onHover={onBuildingHover} />

      {/* Federal Bank — center small building */}
      <Building position={[0.5, 0,  0.5]} size={[2, 1,1.5]} color="#1a1a2a"
                label="Federal Bank" floors={1} onHover={onBuildingHover} />

      {/* Royal Cafe — right, between admin and library */}
      <Building position={[3.5, 0,  2]}  size={[2.5,1,2]}   color="#2a1a0a"
                label="Royal Cafe" floors={1} onHover={onBuildingHover} />

      {/* ════════════════════════════════════
          SOUTH ZONE  (z: +3 to +14)
          Library, Hospital, Chemistry Labs,
          Sports Complex, Sports Ground
          ════════════════════════════════════ */}

      {/* Library — large horizontal building, prominent */}
      <Building position={[-0.5, 0,  4]}  size={[7,  1,2.5]} color={COLORS.library}
                label="Library" floors={2} onHover={onBuildingHover} />

      {/* Hospital — left */}
      <Building position={[-3.5, 0,  7.5]} size={[3,1,2.5]}  color={COLORS.medical}
                label="Hospital" floors={2} onHover={onBuildingHover} />

      {/* Chemistry Labs — right of hospital */}
      <Building position={[2.5, 0,  7.5]} size={[3.5,1,2.5]} color="#162035"
                label="Chemistry Labs" floors={2} onHover={onBuildingHover} />

      {/* Sports Complex — bottom left */}
      <Building position={[-3,  0, 11]}   size={[3.5,1,3]}   color={COLORS.sports}
                label="Sports Complex" floors={1} onHover={onBuildingHover} />

      {/* ════════════════════════════════════
          CAPSULE ORBS (placed at key spots)
          ════════════════════════════════════ */}
      {capsules.map((c) => (
        <CapsuleOrb
          key={c.id}
          position={[c.position.x, 3.5, c.position.z]}
          category={c.category}
          onClick={() => onOrbClick(c)}
        />
      ))}

    </group>
  );
}

// ─────────────────────────────────────────────
// DEMO CAPSULES — positions matched to buildings
// ─────────────────────────────────────────────
export const DEMO_CAPSULES = [
  {
    id: "c1", category: "Academics", location: "Engineering Block",
    title: "Engineering Block GPU Lab Secret",
    content: "PC #4 from the left has the only working GPU. Get there at 7am on lab days.",
    author: "Senior '22", upvotes: 93,
    position: { x: -4, z: -2 },
  },
  {
    id: "c2", category: "Infrastructure", location: "Royal Cafe",
    title: "Royal Cafe Hidden Menu",
    content: "Ask for 'Special Maggi' — it's not on the board but the uncle makes it for regulars.",
    author: "Senior '23", upvotes: 47,
    position: { x: 3.5, z: 2 },
  },
  {
    id: "c3", category: "Social", location: "Library",
    title: "Library Rooftop Secret",
    content: "The rooftop door is always unlocked during exam season. AC works and nobody goes there.",
    author: "Senior '23", upvotes: 128,
    position: { x: -0.5, z: 4 },
  },
  {
    id: "c4", category: "Career", location: "Administration Block",
    title: "Admin Email Hack",
    content: "Subject line with [URGENT] gets 3× faster reply from admin & placement cell. Tested.",
    author: "Senior '22", upvotes: 211,
    position: { x: 3, z: -2 },
  },
  {
    id: "c5", category: "Social", location: "Boys Hostel",
    title: "Hostel WiFi Dead Zones",
    content: "Room 204 in Boys Hostel gets the strongest WiFi. The router is right outside that door.",
    author: "Senior '23", upvotes: 76,
    position: { x: 2.5, z: -17 },
  },
  {
    id: "c6", category: "Infrastructure", location: "Sports Complex",
    title: "Sports Complex Free Hours",
    content: "The badminton court is free and empty every day 6–7am. No booking needed that slot.",
    author: "Senior '21", upvotes: 54,
    position: { x: -3, z: 11 },
  },
];

// ─────────────────────────────────────────────
// DOM OVERLAYS
// ─────────────────────────────────────────────
function Tooltip({ info }) {
  if (!info) return null;
  return (
    <div style={{
      position: "fixed", left: info.x + 12, top: info.y - 8,
      pointerEvents: "none",
      background: "rgba(5,10,20,0.93)",
      border: "1px solid rgba(0,255,231,0.35)",
      color: "#00ffe7", padding: "4px 11px",
      borderRadius: 6, fontSize: 11,
      fontFamily: "monospace", fontWeight: 700,
      zIndex: 100, whiteSpace: "nowrap",
      boxShadow: "0 0 12px rgba(0,255,231,0.15)",
    }}>
      {info.label}
    </div>
  );
}

function Legend() {
  return (
    <div style={{
      position: "absolute", bottom: 16, left: 16, zIndex: 20,
      display: "flex", flexDirection: "column", gap: 8,
    }}>
      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 9, height: 9, borderRadius: "50%",
            background: color, boxShadow: `0 0 6px ${color}`,
          }} />
          <span style={{ color, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>
            {cat}
          </span>
        </div>
      ))}
      <div style={{ marginTop: 6, borderTop: "1px solid #1e293b", paddingTop: 6 }}>
        {[
          { color: COLORS.hostel,      label: "Hostel" },
          { color: COLORS.engineering, label: "Engineering" },
          { color: COLORS.library,     label: "Library / Academic" },
          { color: COLORS.medical,     label: "Medical" },
          { color: COLORS.sports,      label: "Sports" },
          { color: "#c8952a",          label: "Temple" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 9, height: 9, background: color, borderRadius: 2 }} />
            <span style={{ color: "#64748b", fontSize: 9, fontFamily: "monospace" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Compass() {
  return (
    <div style={{
      position: "absolute", top: 16, right: 16, zIndex: 20,
      fontFamily: "monospace", fontSize: 9, textAlign: "center", lineHeight: 1.8,
    }}>
      <div style={{ color: "#00ffe7", fontWeight: 900, fontSize: 13 }}>▲</div>
      <div style={{ color: "#334155" }}>N · Temple</div>
      <div style={{ color: "#1e293b", fontSize: 16 }}>│</div>
      <div style={{ color: "#475569" }}>Hostels</div>
      <div style={{ color: "#1e293b", fontSize: 16 }}>│</div>
      <div style={{ color: "#475569" }}>Academic</div>
      <div style={{ color: "#1e293b", fontSize: 16 }}>│</div>
      <div style={{ color: "#475569" }}>Library</div>
      <div style={{ color: "#1e293b", fontSize: 16 }}>│</div>
      <div style={{ color: "#334155" }}>S · Sports</div>
      <div style={{ color: "#ff6b35", fontWeight: 900, fontSize: 13 }}>▼</div>
    </div>
  );
}

function HUD({ capsuleCount }) {
  return (
    <div style={{
      position: "absolute", top: 16, left: 16, zIndex: 20,
      fontFamily: "monospace",
    }}>
      <div style={{ color: "#00ffe7", fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>
        🕰️ SRM TIME CAPSULE
      </div>
      <div style={{ color: "#334155", fontSize: 9, marginTop: 2 }}>
        {capsuleCount} wisdom entries · Drag · Scroll · Click orbs
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────
export default function Scene({ capsules = DEMO_CAPSULES, onOrbClick = () => {} }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 26, 28], fov: 50 }}
        // Transparent background — only geometry rendered
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]}
      >
        {/* ── LIGHTING ── */}
        <ambientLight intensity={0.25} />
        <directionalLight position={[8, 25, 8]}  intensity={0.55} color="#4477ff" />
        {/* Cyan from north (temple side) */}
        <pointLight position={[0, 12, -28]} intensity={2.5} color="#00ffe7" distance={55} decay={2} />
        {/* Orange from south (sports side) */}
        <pointLight position={[0, 12,  20]} intensity={1.5} color="#ff6b35" distance={50} decay={2} />
        {/* Gold from temple */}
        <pointLight position={[-4, 5, -26]} intensity={1}   color="#ffd700" distance={15} decay={2} />

        {/* Stars (subtle — campus is main focus) */}
        <Suspense fallback={null}>
          <Stars radius={80} depth={40} count={3000} factor={3} fade speed={0.3} />
        </Suspense>

        <Suspense fallback={null}>
          <Campus
            capsules={capsules}
            onOrbClick={onOrbClick}
            onBuildingHover={setTooltip}
          />
        </Suspense>

        <OrbitControls
          enablePan enableZoom enableRotate
          maxPolarAngle={Math.PI / 2.1}
          minDistance={8} maxDistance={70}
          target={[0, 0, -4]}
          enableDamping dampingFactor={0.07}
        />
      </Canvas>

      <HUD capsuleCount={capsules.length} />
      <Tooltip info={tooltip} />
      <Compass />
      <Legend />
    </div>
  );
}
