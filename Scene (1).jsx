/**
 * Scene.jsx — SRM University Campus 3D Environment
 * ──────────────────────────────────────────────────
 * Dependencies:
 *   npm install three @react-three/fiber @react-three/drei
 *
 * Design:
 *   • MeshPhysicalMaterial — glassy blue/white corporate buildings
 *   • Procedural canvas textures — horizontal window stripe bands
 *   • Grey road planes with white dashed centre markings
 *   • Vibrant green garden planes per blueprint zone
 *   • Blueprint-accurate zone layout (roads defined first)
 *   • No geometry overlaps — every building placed within zone bounds
 */

import { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════
//  ROAD NETWORK  (all positions in world units)
//  Scale: 1 unit ≈ 18 metres
//  X → West(-) to East(+)   range: -7 → +8
//  Z → North(-) to South(+) range: -26 → +21
// ═══════════════════════════════════════════════════════
const RD = {
  // ── East perimeter road ──────────────────────────────
  periX:   6.8,   // centreline X of main perimeter road
  periW:   1.8,   // width

  // ── Internal N-S column roads (cluster zone only) ────
  colA:   -1.4,   // centreline X between left & centre columns
  colB:    2.4,   // centreline X between centre & right columns
  colW:    0.8,   // column road width

  // ── Horizontal zone-separator roads ─────────────────
  // (Z = centreline, W = width of road strip)
  h1: { z: -19.8, w: 1.0 },  // top entrance loop
  h2: { z:  -7.2, w: 1.2 },  // hostel zone → cluster zone
  h3: { z:  -0.4, w: 1.0 },  // cluster → dense academic
  h4: { z:   5.6, w: 1.0 },  // dense academic → library
  h5: { z:   9.8, w: 1.0 },  // library → hospital
  h6: { z:  14.2, w: 1.0 },  // hospital → sports
};

// Building zone X ranges (inset 0.45 from nearest road edge)
const ZX = {
  left:   { lo: -6.4, hi: RD.colA - 0.45 },  // x: -6.4 → -1.85
  centre: { lo: RD.colA + 0.45, hi: RD.colB - 0.45 }, // x: -0.95 → 1.95
  right:  { lo: RD.colB + 0.45, hi: RD.periX - 1.1 }, // x: 2.85 → 5.7
  full:   { lo: -6.4, hi: RD.periX - 1.1 },            // x: -6.4 → 5.7
};
const mx = (z) => (z.lo + z.hi) / 2; // midpoint helper

// ═══════════════════════════════════════════════════════
//  PROCEDURAL WINDOW TEXTURE
//  Creates a canvas texture of blue glass panels with
//  horizontal floor-band and vertical column-line stripes.
// ═══════════════════════════════════════════════════════
function makeWindowTexture(floors = 6, cols = 4, baseColor = "#1a4a7a") {
  const W = 256, H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background glass
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0,   baseColor);
  grad.addColorStop(0.5, "#2a6aaa");
  grad.addColorStop(1,   baseColor);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const fh = H / floors;
  const cw = W / cols;

  // Floor bands (horizontal lines)
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 3;
  for (let f = 0; f <= floors; f++) {
    ctx.beginPath();
    ctx.moveTo(0, f * fh);
    ctx.lineTo(W, f * fh);
    ctx.stroke();
  }

  // Column lines (vertical)
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  for (let c = 0; c <= cols; c++) {
    ctx.beginPath();
    ctx.moveTo(c * cw, 0);
    ctx.lineTo(c * cw, H);
    ctx.stroke();
  }

  // Window pane highlights (glass reflection glint)
  ctx.fillStyle = "rgba(255,255,255,0.07)";
  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const px = c * cw + 4, py = f * fh + 4;
      const pw = cw - 8,     ph = fh - 8;
      ctx.fillRect(px, py, pw * 0.4, ph * 0.3);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

// ═══════════════════════════════════════════════════════
//  SHARED GEOMETRY  (instantiated once)
// ═══════════════════════════════════════════════════════
const GEO = {
  box:   new THREE.BoxGeometry(1, 1, 1),
  plane: new THREE.PlaneGeometry(1, 1),
};

// ═══════════════════════════════════════════════════════
//  CATEGORY COLORS (capsule orbs)
// ═══════════════════════════════════════════════════════
const CAT = {
  Academics:      "#00e5ff",
  Social:         "#ff6b35",
  Infrastructure: "#ffd600",
  Career:         "#d500f9",
};

// ═══════════════════════════════════════════════════════
//  BUILDING COMPONENT
//  Glass MeshPhysicalMaterial + window texture overlay
//  cx/cz = footprint centre, w/d = footprint size, floors = height
// ═══════════════════════════════════════════════════════
function Building({ cx, cz, w, d, floors = 3, label, accent = false, onHover }) {
  const bodyRef   = useRef();
  const [hov, setHov] = useState(false);

  // Each building gets its own window texture (memoised)
  const winTex = useMemo(() =>
    makeWindowTexture(floors + 2, Math.max(2, Math.round(w * 2.5)),
      accent ? "#0d3060" : "#1a4a7a"),
  [floors, w, accent]);

  const height = floors * 1.0;

  useFrame(() => {
    if (!bodyRef.current) return;
    const mat = bodyRef.current.material;
    mat.emissiveIntensity = THREE.MathUtils.lerp(
      mat.emissiveIntensity, hov ? 0.18 : 0.0, 0.1
    );
  });

  const over = useCallback((e) => {
    e.stopPropagation();
    setHov(true);
    onHover?.({ label, x: e.clientX, y: e.clientY });
    document.body.style.cursor = "pointer";
  }, [label, onHover]);

  const out = useCallback(() => {
    setHov(false);
    onHover?.(null);
    document.body.style.cursor = "default";
  }, [onHover]);

  return (
    <group position={[cx, 0, cz]}>
      {/* ── Main glass body ── */}
      <mesh ref={bodyRef}
            position={[0, height / 2, 0]}
            scale={[w, height, d]}
            geometry={GEO.box}
            onPointerOver={over}
            onPointerOut={out}>
        <meshPhysicalMaterial
          map={winTex}
          color={accent ? "#0d3060" : "#1a4a7a"}
          emissive={accent ? "#0055ff" : "#0033aa"}
          emissiveIntensity={0.0}
          metalness={0.55}
          roughness={0.12}
          transmission={0.25}
          thickness={0.5}
          reflectivity={0.85}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* ── White rooftop slab ── */}
      <mesh position={[0, height + 0.045, 0]}
            scale={[w + 0.08, 0.09, d + 0.08]}
            geometry={GEO.box}>
        <meshPhysicalMaterial color="#e8f0ff" roughness={0.3} metalness={0.4} />
      </mesh>

      {/* ── Thin white vertical column strips (facade detail) ── */}
      {Array.from({ length: Math.max(2, Math.round(w * 1.8)) }).map((_, i, arr) => {
        const xOff = -w / 2 + (i + 0.5) * (w / arr.length);
        return (
          <mesh key={i}
                position={[xOff, height / 2, d / 2 + 0.015]}
                scale={[0.045, height + 0.06, 0.03]}
                geometry={GEO.box}>
            <meshStandardMaterial color="#cce0ff" transparent opacity={0.55} />
          </mesh>
        );
      })}

      {/* ── Horizontal floor-band lines on facade ── */}
      {Array.from({ length: floors }).map((_, i) => (
        <mesh key={i}
              position={[0, i * 1.0 + 0.5, d / 2 + 0.018]}
              scale={[w + 0.04, 0.04, 0.02]}
              geometry={GEO.box}>
          <meshStandardMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  WING COMPLEX  (U / H / L shaped campus buildings)
//  Renders multi-wing structures around an open courtyard
// ═══════════════════════════════════════════════════════
function WingComplex({ cx, cz, w, d, floors = 3, shape = "U", label, onHover }) {
  const t = 0.9; // wing thickness
  const wings = [];

  if (shape === "U" || shape === "H") {
    wings.push({ ox: 0,           oz: -(d - t) / 2, w,   d: t }); // back
    wings.push({ ox: -(w - t) / 2, oz: 0,           w: t, d });    // left
    wings.push({ ox:  (w - t) / 2, oz: 0,           w: t, d });    // right
    if (shape === "H")
      wings.push({ ox: 0, oz: (d - t) / 2, w, d: t });             // front
  } else if (shape === "L") {
    wings.push({ ox: 0,           oz: -(d - t) / 2, w, d: t });    // back
    wings.push({ ox: -(w - t) / 2, oz: 0,           w: t, d });    // left
  } else {
    wings.push({ ox: 0, oz: 0, w, d });
  }

  return (
    <group>
      {wings.map((wg, i) => (
        <Building key={i}
          cx={cx + wg.ox} cz={cz + wg.oz}
          w={wg.w} d={wg.d}
          floors={floors} label={label}
          accent={shape === "H"}
          onHover={onHover}
        />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  TEMPLE  (distinct cone-spire structure)
// ═══════════════════════════════════════════════════════
function Temple({ cx, cz, onHover }) {
  const spireRef = useRef();
  useFrame(() => { if (spireRef.current) spireRef.current.rotation.y += 0.004; });
  return (
    <group position={[cx, 0, cz]}
      onPointerOver={(e) => { e.stopPropagation(); onHover?.({ label: "Sri Sarveshwar Temple", x: e.clientX, y: e.clientY }); document.body.style.cursor = "pointer"; }}
      onPointerOut={() => { onHover?.(null); document.body.style.cursor = "default"; }}>
      {/* Base plinth */}
      <mesh position={[0, 0.35, 0]} scale={[3.2, 0.7, 3.8]} geometry={GEO.box}>
        <meshPhysicalMaterial color="#c8a050" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Shrine body */}
      <mesh position={[0, 1.3, 0]} scale={[1.8, 1.4, 2.0]} geometry={GEO.box}>
        <meshPhysicalMaterial color="#d4a820" emissive="#c8850a" emissiveIntensity={0.1} roughness={0.4} />
      </mesh>
      {/* Spire */}
      <mesh ref={spireRef} position={[0, 2.8, 0]}>
        <coneGeometry args={[0.75, 2.2, 8]} />
        <meshPhysicalMaterial color="#e8c040" emissive="#e09000" emissiveIntensity={0.35}
          metalness={0.6} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 4, 0]} color="#ffc040" intensity={1.5} distance={10} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  ENTRY GATE
// ═══════════════════════════════════════════════════════
function EntryGate({ cx, cz }) {
  return (
    <group position={[cx, 0, cz]}>
      {[-1.2, 1.2].map((ox, i) => (
        <mesh key={i} position={[ox, 1.8, 0]} scale={[0.45, 3.8, 0.45]} geometry={GEO.box}>
          <meshPhysicalMaterial color="#e8f0ff" emissive="#4488ff"
            emissiveIntensity={0.15} roughness={0.2} metalness={0.7} clearcoat={1} />
        </mesh>
      ))}
      <mesh position={[0, 3.6, 0]} scale={[3.0, 0.3, 0.45]} geometry={GEO.box}>
        <meshPhysicalMaterial color="#e8f0ff" emissive="#4488ff"
          emissiveIntensity={0.15} roughness={0.2} metalness={0.7} />
      </mesh>
      <pointLight position={[0, 4.5, 0]} color="#88ccff" intensity={1.2} distance={8} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  GROUND BASE
// ═══════════════════════════════════════════════════════
function Ground() {
  return (
    <mesh position={[0, -0.01, -3]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[28, 58]} />
      <meshStandardMaterial color="#e8edf5" roughness={0.9} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════
//  ROAD  (grey tarmac strip)
// ═══════════════════════════════════════════════════════
function Road({ cx, cz, w, d }) {
  return (
    <mesh position={[cx, 0.005, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#9aa0b0" roughness={0.85} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════
//  ROAD DASHES  (white centre-line markings)
// ═══════════════════════════════════════════════════════
function RoadDashes({ cx, cz, length, horizontal = false }) {
  const count = Math.floor(length / 2.8);
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const off = -length / 2 + i * 2.8 + 1.2;
        return (
          <mesh key={i}
            position={horizontal ? [cx + off, 0.012, cz] : [cx, 0.012, cz + off]}
            rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={horizontal ? [1.4, 0.14] : [0.14, 1.4]} />
            <meshStandardMaterial color="#ffffff" roughness={0.5} />
          </mesh>
        );
      })}
    </>
  );
}

// ═══════════════════════════════════════════════════════
//  GARDEN  (vibrant green open area)
// ═══════════════════════════════════════════════════════
function Garden({ cx, cz, w, d, shade = 0 }) {
  const colors = ["#2d7a3a", "#1e6b2e", "#256832", "#1a5c28"];
  return (
    <mesh position={[cx, 0.007, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={colors[shade % 4]} roughness={0.85} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════
//  CAPSULE ORB
// ═══════════════════════════════════════════════════════
function CapsuleOrb({ cx, cz, category, onClick }) {
  const orbRef  = useRef();
  const glowRef = useRef();
  const color   = CAT[category] || "#ffffff";
  const col3    = useMemo(() => new THREE.Color(color), [color]);
  const BASE_Y  = 4.5;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbRef.current)  orbRef.current.position.y = BASE_Y + Math.sin(t * 1.8 + cx) * 0.25;
    if (glowRef.current) glowRef.current.scale.setScalar(1 + Math.sin(t * 2.8) * 0.14);
  });

  return (
    <group position={[cx, 0, cz]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={()  => (document.body.style.cursor = "default")}>

      {/* Vertical light beam */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.03, 0.18, 4, 6, 1, true]} />
        <meshStandardMaterial color={color} transparent opacity={0.06}
          emissive={col3} emissiveIntensity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Glow sphere */}
      <mesh ref={glowRef} position={[0, BASE_Y, 0]}>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color={color} transparent opacity={0.08}
          emissive={col3} emissiveIntensity={0.6} />
      </mesh>

      {/* Core orb */}
      <mesh ref={orbRef} position={[0, BASE_Y, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshPhysicalMaterial color={color} emissive={col3} emissiveIntensity={3}
          transmission={0.3} roughness={0.0} metalness={0.2} />
      </mesh>

      <pointLight position={[0, BASE_Y, 0]} color={color}
                  intensity={1.6} distance={6} decay={2} />
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  FULL CAMPUS
// ═══════════════════════════════════════════════════════
function Campus({ capsules, onOrbClick, onHover }) {
  return (
    <group>
      <Ground />

      {/* ─────────────────────────────────────────
          ROAD NETWORK (drawn first, always on top)
          ───────────────────────────────────────── */}

      {/* Main east perimeter road */}
      <Road cx={RD.periX} cz={-3} w={RD.periW} d={54} />
      <RoadDashes cx={RD.periX} cz={-3} length={54} />

      {/* Horizontal separators */}
      {Object.values(RD).filter(v => v?.z !== undefined).map((r, i) => (
        <group key={i}>
          <Road cx={0} cz={r.z} w={15} d={r.w} />
          <RoadDashes cx={0} cz={r.z} length={15} horizontal />
        </group>
      ))}

      {/* Column roads (only in cluster zone z: -7.2 to -0.4) */}
      <Road cx={RD.colA} cz={(RD.h2.z + RD.h3.z) / 2}
            w={RD.colW} d={Math.abs(RD.h3.z - RD.h2.z)} />
      <Road cx={RD.colB} cz={(RD.h2.z + RD.h3.z) / 2}
            w={RD.colW} d={Math.abs(RD.h3.z - RD.h2.z)} />

      {/* Internal sub-road in dense zone */}
      <Road cx={0.5} cz={2.8} w={13} d={0.7} />
      <RoadDashes cx={0.5} cz={2.8} length={13} horizontal />

      {/* ─────────────────────────────────────────
          ZONE 1 · TEMPLE + TRANSPORT (z: -26 → -20)
          ───────────────────────────────────────── */}

      {/* Open sandy ground */}
      <mesh position={[0.5, 0.003, -23]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13, 5.5]} />
        <meshStandardMaterial color="#d4c89a" roughness={0.9} />
      </mesh>

      <Temple cx={-3.5} cz={-23} onHover={onHover} />

      {/* Transport area */}
      <Building cx={4.2} cz={-22.5} w={2.8} d={2.2}
                floors={1} label="Transport Area" onHover={onHover} />

      {/* ─────────────────────────────────────────
          ZONE 2 · HOSTEL (z: -19.3 → -7.8)
          Open garden zone with hostel buildings
          ───────────────────────────────────────── */}

      {/* Large open garden in centre */}
      <Garden cx={-0.5} cz={-14.5} w={7} d={6}  shade={0} />
      <Garden cx={-0.5} cz={-10}   w={6} d={3.5} shade={1} />

      {/* Road from gate to inside */}
      <Road cx={5.5} cz={-11} w={1.0} d={5} />

      {/* Under construction */}
      <Building cx={-2.5} cz={-17.5} w={2.2} d={2.0}
                floors={1} label="Under Construction" accent={false} onHover={onHover} />
      <Building cx={0.5}  cz={-17.5} w={1.8} d={2.0}
                floors={2} label="Under Construction" accent={false} onHover={onHover} />

      {/* Entry gate — right, hostel zone */}
      <EntryGate cx={7.2} cz={-12} />

      {/* Boys Hostel — right, H-shape */}
      <WingComplex cx={4.0} cz={-13.5} w={2.8} d={3.2}
                   floors={3} shape="H" label="Boys Hostel" onHover={onHover} />

      {/* Faculty Hostel — centre */}
      <Building cx={0.8} cz={-12.5} w={3.0} d={1.8}
                floors={2} label="Faculty Hostel" onHover={onHover} />

      {/* Girls Hostel — left, U-shape */}
      <WingComplex cx={-4.0} cz={-11.5} w={2.8} d={3.0}
                   floors={3} shape="U" label="Girls Hostel" onHover={onHover} />

      {/* Bunnys Canteen — left-bottom hostel zone */}
      <Building cx={-4.2} cz={-8.5} w={2.0} d={1.4}
                floors={1} label="Bunnys Canteen" onHover={onHover} />

      {/* ─────────────────────────────────────────
          ZONE 3 · BUILDING CLUSTER (z: -6.8 → -1.0)
          3 columns split by internal roads
          ───────────────────────────────────────── */}

      {/* LEFT column gardens */}
      <Garden cx={mx(ZX.left)} cz={-3.8} w={2.2} d={0.6} shade={2} />

      {/* LEFT col — 2 U-shaped blocks stacked */}
      <WingComplex cx={mx(ZX.left)} cz={-5.5} w={3.8} d={2.6}
                   floors={3} shape="U" label="Academic Block (Left-A)" onHover={onHover} />
      <WingComplex cx={mx(ZX.left)} cz={-2.6} w={3.8} d={2.4}
                   floors={3} shape="L" label="Academic Block (Left-B)" onHover={onHover} />

      {/* CENTRE col garden */}
      <Garden cx={mx(ZX.centre)} cz={-3.8} w={1.8} d={0.6} shade={3} />

      {/* CENTRE col — 2 H-shaped blocks */}
      <WingComplex cx={mx(ZX.centre)} cz={-5.4} w={2.4} d={2.4}
                   floors={2} shape="H" label="Hostel Block (Centre-A)" onHover={onHover} />
      <WingComplex cx={mx(ZX.centre)} cz={-2.6} w={2.4} d={2.2}
                   floors={2} shape="U" label="Hostel Block (Centre-B)" onHover={onHover} />

      {/* RIGHT col — 1 large H-block */}
      <WingComplex cx={mx(ZX.right)} cz={-3.9} w={2.4} d={5.2}
                   floors={3} shape="H" label="Academic Block (Right)" onHover={onHover} />

      {/* ─────────────────────────────────────────
          ZONE 4 · DENSE ACADEMIC (z: -0.0 → +5.2)
          Sub-divided at z=2.8 by internal road
          ───────────────────────────────────────── */}

      {/* Zone 4A garden strip */}
      <Garden cx={-0.5} cz={0.9} w={1.0} d={2.0} shade={1} />

      {/* Engineering Block — left, accent terracotta colour override */}
      <group position={[-4.2, 0, 1.4]}>
        <mesh position={[0, 1.7, 0]} scale={[3.2, 3.4, 2.4]} geometry={GEO.box}>
          <meshPhysicalMaterial color="#4a2515" emissive="#4a2515"
            emissiveIntensity={0.08} roughness={0.55} metalness={0.3}
            clearcoat={0.6} clearcoatRoughness={0.2} />
        </mesh>
        {/* Roof */}
        <mesh position={[0, 3.45, 0]} scale={[3.3, 0.09, 2.5]} geometry={GEO.box}>
          <meshStandardMaterial color="#f0ece0" roughness={0.5} />
        </mesh>
      </group>
      {/* Engineering label plane for hover */}
      <mesh position={[-4.2, 0.01, 1.4]} rotation={[-Math.PI / 2, 0, 0]}
            scale={[3.2, 2.4, 1]}
            onPointerOver={(e) => { e.stopPropagation(); onHover?.({ label: "Engineering Block", x: e.clientX, y: e.clientY }); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { onHover?.(null); document.body.style.cursor = "default"; }}>
        <planeGeometry />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Law Block */}
      <Building cx={-0.3} cz={1.2} w={2.0} d={2.0}
                floors={3} label="Law Block" accent onHover={onHover} />

      {/* Old Law Block */}
      <Building cx={2.2} cz={1.2} w={2.0} d={2.0}
                floors={2} label="Old Law Block" onHover={onHover} />

      {/* Administration Block */}
      <Building cx={4.8} cz={1.4} w={2.0} d={2.4}
                floors={3} label="Administration Block" accent onHover={onHover} />

      {/* Zone 4B — below internal road z=2.8 */}

      {/* Federal Bank #1 (Admin side) */}
      <Building cx={4.5} cz={4.0} w={1.8} d={1.2}
                floors={1} label="Federal Bank (Admin)" onHover={onHover} />

      {/* Federal Bank #2 + Royal Cafe — connected cluster */}
      <Building cx={0.2} cz={4.0} w={1.9} d={1.2}
                floors={1} label="Federal Bank (Royal Cafe Branch)" onHover={onHover} />
      {/* Connector awning */}
      <mesh position={[1.35, 0.4, 4.0]} scale={[0.5, 0.7, 1.2]} geometry={GEO.box}>
        <meshPhysicalMaterial color="#cce8ff" transparent opacity={0.4}
          transmission={0.6} roughness={0.05} />
      </mesh>
      <Building cx={2.5} cz={4.0} w={2.4} d={1.2}
                floors={1} label="Royal Cafe" onHover={onHover} />
      <pointLight position={[2.5, 2.0, 4.0]} color="#ff9933" intensity={0.8} distance={5} decay={2} />

      {/* ─────────────────────────────────────────
          ZONE 5 · LIBRARY (z: +6.2 → +9.4)
          ───────────────────────────────────────── */}

      <Garden cx={-5.5} cz={7.8} w={1.6} d={3} shade={0} />
      <Garden cx={6.2}  cz={7.8} w={1.5} d={3} shade={1} />

      {/* Library — wide, 2 floors, accent */}
      <Building cx={1.5} cz={7.8} w={8.5} d={2.8}
                floors={2} label="Library" accent onHover={onHover} />

      {/* ─────────────────────────────────────────
          ZONE 6 · HOSPITAL + CHEM LABS (z: +10.4 → +13.8)
          ───────────────────────────────────────── */}

      <Garden cx={0.5} cz={12} w={2.5} d={3} shade={2} />

      <WingComplex cx={-3.5} cz={12} w={3.0} d={3.0}
                   floors={2} shape="L" label="Hospital" onHover={onHover} />

      <WingComplex cx={4.2}  cz={12} w={2.8} d={3.0}
                   floors={2} shape="U" label="Chemistry Labs" onHover={onHover} />

      <Building cx={0.8} cz={11.5} w={1.8} d={2.0}
                floors={2} label="Department Block" onHover={onHover} />

      {/* ─────────────────────────────────────────
          ZONE 7 · SPORTS (z: +14.8 → +21)
          ───────────────────────────────────────── */}

      {/* Large sports ground */}
      <Garden cx={0.5} cz={17.5} w={12} d={8} shade={0} />

      {/* Ground markings */}
      {[-1.5, 0, 1.5].map((ox, i) => (
        <mesh key={i} position={[0.5 + ox, 0.013, 17.5]}
              rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.08, 7.5]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.35} />
        </mesh>
      ))}

      <Building cx={-3.2} cz={16.2} w={3.8} d={3.0}
                floors={1} label="Sports Complex" onHover={onHover} />
      <Building cx={2.0}  cz={16.5} w={2.8} d={2.0}
                floors={1} label="Sports Complex (Block 2)" onHover={onHover} />

      {/* South gate building */}
      <Building cx={-1} cz={20} w={1.4} d={1.6}
                floors={1} label="South Gate" onHover={onHover} />

      {/* ─────────────────────────────────────────
          CAPSULE ORBS
          ───────────────────────────────────────── */}
      {capsules.map((c) => (
        <CapsuleOrb key={c.id}
          cx={c.position.x} cz={c.position.z}
          category={c.category}
          onClick={() => onOrbClick(c)} />
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════
//  DEMO CAPSULES
// ═══════════════════════════════════════════════════════
export const DEMO_CAPSULES = [
  { id: "c1", category: "Academics",      location: "Engineering Block",
    title: "Engineering GPU Secret",
    content: "PC #4 from the left window has the only working GPU. Book it at 7am on lab days.",
    author: "Senior '22", upvotes: 93,  position: { x: -4.2, z: 1.4 } },
  { id: "c2", category: "Infrastructure", location: "Royal Cafe",
    title: "Royal Cafe Hidden Menu",
    content: "Ask for 'Special Maggi' — not on the board but the uncle makes it.",
    author: "Senior '23", upvotes: 47,  position: { x: 2.5, z: 4.0 } },
  { id: "c3", category: "Social",         location: "Library",
    title: "Library Rooftop Secret",
    content: "Rooftop door unlocked during exam season. AC works, nobody goes up.",
    author: "Senior '23", upvotes: 128, position: { x: 1.5, z: 7.8 } },
  { id: "c4", category: "Career",         location: "Administration Block",
    title: "Admin Email Hack",
    content: "[URGENT] in subject line gets 3× faster replies from placement cell.",
    author: "Senior '22", upvotes: 211, position: { x: 4.8, z: 1.4 } },
  { id: "c5", category: "Social",         location: "Boys Hostel",
    title: "Hostel WiFi Trick",
    content: "Room facing the stairwell gets the strongest WiFi signal.",
    author: "Senior '23", upvotes: 76,  position: { x: 4.0, z: -13.5 } },
  { id: "c6", category: "Infrastructure", location: "Sports Complex",
    title: "Free Badminton Hours",
    content: "Court is free every day 6–7am. No booking needed for that slot.",
    author: "Senior '21", upvotes: 54,  position: { x: -3.2, z: 16.2 } },
];

// ═══════════════════════════════════════════════════════
//  DOM OVERLAYS
// ═══════════════════════════════════════════════════════
function Tooltip({ info }) {
  if (!info) return null;
  return (
    <div style={{
      position: "fixed", left: info.x + 14, top: info.y - 10,
      pointerEvents: "none",
      background: "rgba(8,20,45,0.94)",
      border: "1px solid rgba(80,160,255,0.4)",
      color: "#a0d4ff", padding: "5px 13px",
      borderRadius: 6, fontSize: 11,
      fontFamily: "'Segoe UI', sans-serif", fontWeight: 600,
      zIndex: 100, whiteSpace: "nowrap",
      boxShadow: "0 4px 20px rgba(0,100,255,0.15)",
    }}>{info.label}</div>
  );
}

function ModalCard({ capsule, onClose }) {
  const color = CAT[capsule.category] || "#fff";
  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 50,
      background: "rgba(5,12,30,0.72)", backdropFilter: "blur(8px)",
    }}>
      <div style={{
        background: "linear-gradient(135deg,#0a1628,#0d2040)",
        border: `1px solid ${color}55`,
        borderRadius: 16, padding: 28, maxWidth: 400, width: "90%",
        fontFamily: "'Segoe UI', sans-serif",
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px ${color}22`,
      }}>
        <div style={{
          display: "inline-block",
          background: color + "22", color, border: `1px solid ${color}55`,
          padding: "3px 12px", borderRadius: 20, fontSize: 10,
          fontWeight: 700, letterSpacing: 1, marginBottom: 12,
        }}>{capsule.category.toUpperCase()}</div>
        <h2 style={{ color: "#e8f4ff", margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>
          {capsule.title}
        </h2>
        <p style={{ color: "#5a8aaa", fontSize: 12, margin: "0 0 16px" }}>
          📍 {capsule.location}
        </p>
        <p style={{ color: "#b0cce8", lineHeight: 1.7, margin: "0 0 22px", fontSize: 13 }}>
          {capsule.content}
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#334466", fontSize: 12 }}>— {capsule.author}</span>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <span style={{ color: "#ffd600", fontWeight: 700, fontSize: 13 }}>
              ▲ {capsule.upvotes}
            </span>
            <button onClick={onClose} style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#6688aa", padding: "5px 14px", borderRadius: 8,
              cursor: "pointer", fontFamily: "inherit", fontSize: 12,
            }}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div style={{
      position: "absolute", bottom: 18, left: 18, zIndex: 20,
      fontFamily: "'Segoe UI', sans-serif",
      background: "rgba(5,12,28,0.82)",
      border: "1px solid rgba(80,140,255,0.2)",
      padding: "12px 16px", borderRadius: 10,
      backdropFilter: "blur(6px)",
    }}>
      <div style={{ color: "#334466", fontSize: 9, letterSpacing: 1.5, marginBottom: 8 }}>
        WISDOM ORBS
      </div>
      {Object.entries(CAT).map(([cat, color]) => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%",
            background: color, boxShadow: `0 0 7px ${color}` }} />
          <span style={{ color, fontSize: 10, fontWeight: 600 }}>{cat}</span>
        </div>
      ))}
    </div>
  );
}

function Compass() {
  return (
    <div style={{
      position: "absolute", top: 18, right: 18, zIndex: 20,
      fontFamily: "'Segoe UI', sans-serif", fontSize: 10, textAlign: "right",
      background: "rgba(5,12,28,0.82)",
      border: "1px solid rgba(80,140,255,0.2)",
      padding: "10px 14px", borderRadius: 10,
      backdropFilter: "blur(6px)", lineHeight: 2,
      color: "#334466",
    }}>
      <div style={{ color: "#00e5ff", fontWeight: 900, fontSize: 14 }}>▲ N</div>
      <div>Temple · Transport</div>
      <div style={{ color: "#1e3055" }}>──────</div>
      <div>Hostels</div>
      <div style={{ color: "#1e3055" }}>──────</div>
      <div>Academic Zone</div>
      <div style={{ color: "#1e3055" }}>──────</div>
      <div>Library</div>
      <div style={{ color: "#1e3055" }}>──────</div>
      <div>Hospital · Labs</div>
      <div style={{ color: "#1e3055" }}>──────</div>
      <div>Sports</div>
      <div style={{ color: "#ff6b35", fontWeight: 900, fontSize: 14 }}>▼ S</div>
    </div>
  );
}

function HUD({ count }) {
  return (
    <div style={{
      position: "absolute", top: 18, left: 18, zIndex: 20,
      fontFamily: "'Segoe UI', sans-serif",
    }}>
      <div style={{
        color: "#a0d4ff", fontWeight: 900, fontSize: 16, letterSpacing: 1,
        textShadow: "0 0 20px rgba(0,180,255,0.6)",
      }}>
        🕰️ SRM TIME CAPSULE
      </div>
      <div style={{ color: "#1e3055", fontSize: 9, marginTop: 3 }}>
        {count} wisdom entries · Drag · Scroll · Click glowing orbs
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════
export default function Scene({ capsules = DEMO_CAPSULES, onOrbClick: externalOrbClick }) {
  const [tooltip,  setTooltip]  = useState(null);
  const [selected, setSelected] = useState(null);

  const handleOrb = useCallback((c) => {
    setSelected(c);
    externalOrbClick?.(c);
  }, [externalOrbClick]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 32, 35], fov: 46 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "linear-gradient(180deg,#060d1e 0%,#0a1628 100%)" }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]}
        shadows
      >
        {/* ── LIGHTING ── */}
        {/* Soft blue-sky ambient */}
        <ambientLight intensity={0.55} color="#c0d8ff" />

        {/* Main directional sun (slight warm white) */}
        <directionalLight
          position={[12, 30, 10]} intensity={1.4}
          color="#fff8f0" castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-far={100}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />

        {/* Cool fill light from opposite */}
        <directionalLight position={[-10, 15, -20]} intensity={0.35} color="#88aaff" />

        {/* HDR-like environment for glass reflections */}
        <Environment preset="city" />

        {/* Campus */}
        <Campus
          capsules={capsules}
          onOrbClick={handleOrb}
          onHover={setTooltip}
        />

        <OrbitControls
          enablePan enableZoom enableRotate
          maxPolarAngle={Math.PI / 2.05}
          minDistance={8} maxDistance={85}
          target={[0, 0, -2]}
          enableDamping dampingFactor={0.07}
          zoomSpeed={0.8}
        />
      </Canvas>

      <HUD count={capsules.length} />
      <Tooltip info={tooltip} />
      <Compass />
      <Legend />

      {selected && (
        <ModalCard capsule={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
