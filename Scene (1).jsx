// ╔══════════════════════════════════════════════════════════════╗
// ║  Scene.jsx — SRM Campus 3D Model (Blueprint-Accurate v4)    ║
// ║  Built from architectural blueprint (March 2026)             ║
// ║                                                              ║
// ║  METHODOLOGY:                                                ║
// ║  1. Road network defined first as strict boundary constants  ║
// ║  2. Campus divided into named ZONES between roads            ║
// ║  3. Buildings placed INSIDE zones with inset margins         ║
// ║  4. No building may cross a road line                        ║
// ║  5. Open areas filled with garden planes                     ║
// ║                                                              ║
// ║  COORDINATE SYSTEM:                                          ║
// ║  X →  West (-) to East (+)   campus: -6 to +6               ║
// ║  Z →  North (-) to South (+) campus: -24 to +20             ║
// ║  Y →  Height                 ground: y=0                     ║
// ║  Scale: 1 unit ≈ 20 metres                                   ║
// ╚══════════════════════════════════════════════════════════════╝

import { useRef, useState, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────
// ROAD NETWORK CONSTANTS
// These define the strict boundaries between zones.
// NO building may be placed across these lines.
// ─────────────────────────────────────────────────────────────────
const R = {
  // Vertical roads (east-west position, run north-south)
  mainRoadX:  6.2,   // main perimeter road (right/east side)
  colAX:     -1.2,   // column separator A (between left & center columns)
  colBX:      2.6,   // column separator B (between center & right columns)

  // Road widths
  mainRoadW:  2.0,
  colRoadW:   1.0,
  hRoadW:     1.2,   // horizontal road width

  // Horizontal roads (north-south position, run east-west)
  // Each is the CENTERLINE of the road strip
  h1: -19.5,  // top entrance road (loop around temple/transport)
  h2:  -7.0,  // separates hostel zone FROM building cluster zone
  h3:  -0.3,  // separates building cluster FROM dense academic zone
  h4:   5.2,  // separates dense zone FROM library zone
  h5:   9.8,  // separates library FROM hospital/labs zone
  h6:  14.2,  // separates hospital FROM sports zone
};

// Building zone X boundaries (inset 0.4 from road edge)
const ZONE = {
  // X ranges (available building space, after road margins)
  leftX:   { min: -5.8, max: R.colAX - 0.5 },   // left column:   x -5.8 to -1.7
  centerX: { min: R.colAX + 0.5, max: R.colBX - 0.5 }, // center: x -0.7 to 2.1
  rightX:  { min: R.colBX + 0.5, max: R.mainRoadX - 1.2 }, // right: x 3.1 to 5.0
  fullX:   { min: -5.8, max: R.mainRoadX - 1.2 }, // full width:   x -5.8 to 5.0
};

// ─────────────────────────────────────────────────────────────────
// SHARED GEOMETRY  (one instance reused by all meshes)
// ─────────────────────────────────────────────────────────────────
const GEO = {
  box:    new THREE.BoxGeometry(1, 1, 1),
  sphere: new THREE.SphereGeometry(1, 10, 10),
  plane:  new THREE.PlaneGeometry(1, 1),
  cyl:    new THREE.CylinderGeometry(0.03, 0.16, 3, 6, 1, true),
  cone:   new THREE.ConeGeometry(0.8, 2.0, 8),
};

// ─────────────────────────────────────────────────────────────────
// BUILDING PALETTE
// ─────────────────────────────────────────────────────────────────
const C = {
  hostel:       "#243550",
  hostelGirls:  "#38285a",
  academic:     "#1b3358",
  engineering:  "#4a2515",
  admin:        "#163545",
  amenity:      "#222218",
  medical:      "#3a1420",
  sports:       "#122018",
  temple:       "#4a3a1a",
  construction: "#252525",
  library:      "#192845",
  bank:         "#1a2535",
  cafe:         "#2a1a0a",
  law:          "#1e3040",
};

const CATEGORY_COLORS = {
  Academics:      "#00ffe7",
  Social:         "#ff6b35",
  Infrastructure: "#ffd700",
  Career:         "#a855f7",
};

// ─────────────────────────────────────────────────────────────────
// BUILDING COMPONENT
// cx/cz = center position, w = width (X), d = depth (Z), h = floors
// ─────────────────────────────────────────────────────────────────
function Building({ cx, cz, w, d, color, label, floors = 1, onHover }) {
  const ref = useRef();
  const [hov, setHov] = useState(false);
  const height = floors * 1.1;

  useFrame(() => {
    if (!ref.current) return;
    ref.current.material.emissiveIntensity = THREE.MathUtils.lerp(
      ref.current.material.emissiveIntensity, hov ? 0.38 : 0.07, 0.1
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
    <group position={[cx, height / 2, cz]}>
      {/* Main body */}
      <mesh ref={ref} scale={[w, height, d]} geometry={GEO.box}
            onPointerOver={over} onPointerOut={out}>
        <meshStandardMaterial color={color} emissive={color}
          emissiveIntensity={0.07} roughness={0.62} metalness={0.28} />
      </mesh>
      {/* Roof lip */}
      <mesh position={[0, height / 2 + 0.04, 0]}
            scale={[w + 0.1, 0.065, d + 0.1]} geometry={GEO.box}>
        <meshStandardMaterial color="#8aaabb" transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// BUILDING WING SET
// Models U/L-shaped complexes as a set of rectangular wings
// around a central courtyard.
// ─────────────────────────────────────────────────────────────────
function BuildingComplex({ cx, cz, w, d, color, label, floors = 2, shape = "U", onHover }) {
  // "U" shape: back wall + two side wings (open to south)
  // "L" shape: back wall + left wing only
  // "H" shape: back wall + two wings + front wall
  const wt = 0.8; // wall thickness
  const h  = floors;

  const parts = [];

  if (shape === "U" || shape === "H") {
    // Back wall (north)
    parts.push({ cx: 0,          cz: -(d / 2 - wt / 2), pw: w,          pd: wt });
    // Left wing
    parts.push({ cx: -(w / 2 - wt / 2), cz: 0,          pw: wt,         pd: d - wt });
    // Right wing
    parts.push({ cx: (w / 2 - wt / 2),  cz: 0,          pw: wt,         pd: d - wt });
    if (shape === "H") {
      // Front wall
      parts.push({ cx: 0, cz: (d / 2 - wt / 2), pw: w, pd: wt });
    }
  } else if (shape === "L") {
    parts.push({ cx: 0,          cz: -(d / 2 - wt / 2), pw: w,   pd: wt });
    parts.push({ cx: -(w / 2 - wt / 2), cz: 0,          pw: wt,  pd: d - wt });
  } else {
    // solid
    parts.push({ cx: 0, cz: 0, pw: w, pd: d });
  }

  return (
    <group position={[cx, 0, cz]}>
      {parts.map((p, i) => (
        <Building key={i}
          cx={p.cx} cz={p.cz} w={p.pw} d={p.pd}
          color={color} label={label} floors={h} onHover={onHover}
        />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// TEMPLE
// ─────────────────────────────────────────────────────────────────
function Temple({ cx, cz, onHover }) {
  const spireRef = useRef();
  useFrame(() => { if (spireRef.current) spireRef.current.rotation.y += 0.003; });
  const over = (e) => { e.stopPropagation(); onHover?.({ label: "Sri Sarveshwar Temple", x: e.clientX, y: e.clientY }); document.body.style.cursor = "pointer"; };
  const out  = () => { onHover?.(null); document.body.style.cursor = "default"; };
  return (
    <group position={[cx, 0, cz]}>
      <mesh scale={[3, 0.7, 3.5]} geometry={GEO.box} onPointerOver={over} onPointerOut={out}>
        <meshStandardMaterial color="#4a3a1a" emissive="#4a3a1a" emissiveIntensity={0.1} />
      </mesh>
      {/* Inner shrine */}
      <mesh position={[0, 0.7, 0]} scale={[1.5, 1, 1.5]} geometry={GEO.box} onPointerOver={over} onPointerOut={out}>
        <meshStandardMaterial color="#5a4a25" />
      </mesh>
      {/* Spire */}
      <mesh ref={spireRef} position={[0, 2.2, 0]} geometry={GEO.cone}>
        <meshStandardMaterial color="#c8952a" emissive="#c8952a" emissiveIntensity={0.35} />
      </mesh>
      <pointLight position={[cx, 4, cz]} color="#ffd700" intensity={1.2} distance={8} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// ENTRY GATE
// ─────────────────────────────────────────────────────────────────
function EntryGate({ cx, cz }) {
  return (
    <group position={[cx, 0, cz]}>
      {[-1.1, 1.1].map((ox, i) => (
        <mesh key={i} position={[ox, 1.5, 0]} scale={[0.4, 3.2, 0.4]} geometry={GEO.box}>
          <meshStandardMaterial color="#c8a050" emissive="#c8a050" emissiveIntensity={0.22} />
        </mesh>
      ))}
      <mesh position={[0, 3.0, 0]} scale={[2.7, 0.35, 0.4]} geometry={GEO.box}>
        <meshStandardMaterial color="#c8a050" emissive="#c8a050" emissiveIntensity={0.22} />
      </mesh>
      <pointLight position={[0, 4, 0]} color="#ffd700" intensity={1} distance={7} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROAD STRIP  (flat plane, y just above ground)
// ─────────────────────────────────────────────────────────────────
function Road({ cx, cz, w, d }) {
  return (
    <mesh position={[cx, 0.018, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#10101e" />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROAD MARKING  (dashed centre line)
// ─────────────────────────────────────────────────────────────────
function RoadMarkings({ cx, cz, length, horizontal = false }) {
  const count = Math.floor(length / 2.5);
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const offset = -length / 2 + i * 2.5 + 1;
        return (
          <mesh key={i}
            position={horizontal ? [cx + offset, 0.022, cz] : [cx, 0.022, cz + offset]}
            rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={horizontal ? [1.2, 0.12] : [0.12, 1.2]} />
            <meshStandardMaterial color="#333355" />
          </mesh>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// GARDEN / OPEN GREEN AREA
// ─────────────────────────────────────────────────────────────────
function Garden({ cx, cz, w, d, color = "#0d2a14", opacity = 1 }) {
  return (
    <mesh position={[cx, 0.009, cz]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

// ─────────────────────────────────────────────────────────────────
// CAPSULE ORB
// ─────────────────────────────────────────────────────────────────
function CapsuleOrb({ cx, cz, category, onClick }) {
  const orbRef  = useRef();
  const glowRef = useRef();
  const color   = CATEGORY_COLORS[category] || "#ffffff";
  const col3    = new THREE.Color(color);
  const baseY   = 3.8;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (orbRef.current)
      orbRef.current.position.y = baseY + Math.sin(t * 2 + cx) * 0.22;
    if (glowRef.current)
      glowRef.current.scale.setScalar(1 + Math.sin(t * 3) * 0.13);
  });

  return (
    <group position={[cx, 0, cz]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => (document.body.style.cursor = "pointer")}
      onPointerOut={()  => (document.body.style.cursor = "default")}>
      {/* Beam down to building */}
      <mesh position={[0, 1.9, 0]} geometry={GEO.cyl}>
        <meshStandardMaterial color={color} transparent opacity={0.05}
          emissive={col3} emissiveIntensity={0.3} side={THREE.DoubleSide} />
      </mesh>
      {/* Glow shell */}
      <mesh ref={glowRef} position={[0, baseY, 0]} scale={[0.9, 0.9, 0.9]} geometry={GEO.sphere}>
        <meshStandardMaterial color={color} transparent opacity={0.1}
          emissive={col3} emissiveIntensity={0.5} />
      </mesh>
      {/* Core orb */}
      <mesh ref={orbRef} scale={[0.28, 0.28, 0.28]} geometry={GEO.sphere}>
        <meshStandardMaterial color={color} emissive={col3} emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0, baseY, 0]} color={color} intensity={1.4}
                  distance={5} decay={2} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// FULL CAMPUS SCENE
// Zones are commented with their Z range and road boundaries
// ─────────────────────────────────────────────────────────────────
function Campus({ capsules, onOrbClick, onBuildingHover }) {
  const B = onBuildingHover; // shorthand
  const campusMidX = (ZONE.fullX.min + ZONE.mainRoadX) / 2; // ≈ 0

  return (
    <group>

      {/* ══════════════════════════════════════════
          GROUND BASE (full campus footprint)
          ══════════════════════════════════════════ */}
      <mesh position={[0, 0, -2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[22, 52]} />
        <meshStandardMaterial color="#070d18" />
      </mesh>

      {/* ══════════════════════════════════════════
          ROAD NETWORK
          Rules: roads are placed FIRST.
          Buildings will be placed WITHIN the gaps.
          ══════════════════════════════════════════ */}

      {/* ── Vertical roads ── */}
      {/* Main perimeter road (right/east side, full length) */}
      <Road cx={R.mainRoadX + R.mainRoadW / 2} cz={-2} w={R.mainRoadW} d={52} />
      <RoadMarkings cx={R.mainRoadX + R.mainRoadW / 2} cz={-2} length={52} />

      {/* ── Horizontal roads (zone separators) ── */}
      {/* H1: Top entrance loop (approximate flat strip) */}
      <Road cx={0} cz={R.h1} w={14} d={R.hRoadW} />

      {/* H2: Hostel → Building Cluster separator */}
      <Road cx={0} cz={R.h2} w={13} d={R.hRoadW} />
      <RoadMarkings cx={0} cz={R.h2} length={13} horizontal />

      {/* H3: Building Cluster → Dense Academic separator */}
      <Road cx={0} cz={R.h3} w={13} d={R.hRoadW} />
      <RoadMarkings cx={0} cz={R.h3} length={13} horizontal />

      {/* H4: Dense Academic → Library separator */}
      <Road cx={0} cz={R.h4} w={13} d={R.hRoadW} />
      <RoadMarkings cx={0} cz={R.h4} length={13} horizontal />

      {/* H5: Library → Hospital/Labs separator */}
      <Road cx={0} cz={R.h5} w={13} d={R.hRoadW} />
      <RoadMarkings cx={0} cz={R.h5} length={13} horizontal />

      {/* H6: Hospital → Sports separator */}
      <Road cx={0} cz={R.h6} w={13} d={R.hRoadW} />
      <RoadMarkings cx={0} cz={R.h6} length={13} horizontal />

      {/* ── Internal column separators (cluster zone only) ── */}
      {/* Only exist between h2 and h3 (z: -7 to -0.3) */}
      <Road cx={R.colAX} cz={(R.h2 + R.h3) / 2}
            w={R.colRoadW} d={Math.abs(R.h3 - R.h2)} />
      <Road cx={R.colBX} cz={(R.h2 + R.h3) / 2}
            w={R.colRoadW} d={Math.abs(R.h3 - R.h2)} />

      {/* ── Internal sub-roads in dense zone ── */}
      {/* Horizontal connector mid-dense zone */}
      <Road cx={0} cz={2.8} w={13} d={0.8} />

      {/* ══════════════════════════════════════════
          ZONE 1: TEMPLE + TRANSPORT AREA
          z: -24 to R.h1 (-19.5)
          No column separators in this zone.
          ══════════════════════════════════════════ */}

      {/* Temple — left side, internal structure */}
      <Temple cx={-3.8} cz={-22} onHover={B} />

      {/* Temple compound wall (low boundary) */}
      <Building cx={-3.8} cz={-22} w={5} d={0.2} color="#3a2e12" label="Temple Compound" floors={0.4} onHover={B} />
      <Building cx={-3.8} cz={-19.6} w={5} d={0.2} color="#3a2e12" label="Temple Compound" floors={0.4} onHover={B} />
      <Building cx={-6.0} cz={-21} w={0.2} d={2.5} color="#3a2e12" label="Temple Compound" floors={0.4} onHover={B} />
      <Building cx={-1.6} cz={-21} w={0.2} d={2.5} color="#3a2e12" label="Temple Compound" floors={0.4} onHover={B} />

      {/* Transport area — right/north corner */}
      <Building cx={3.5} cz={-22} w={3.2} d={2.5}
                color={C.amenity} label="Transport Area" floors={1} onHover={B} />

      {/* ══════════════════════════════════════════
          ZONE 2: HOSTEL ZONE
          z: R.h1+0.6 (-18.9) to R.h2-0.6 (-7.6)
          Full width, no column splits
          ══════════════════════════════════════════ */}

      {/* Open / construction ground — large garden */}
      <Garden cx={-1} cz={-15} w={10} d={6} color="#0a1e10" />
      <Garden cx={-1} cz={-10} w={10} d={4} color="#0d2414" />

      {/* Under construction blocks */}
      <Building cx={-2.5} cz={-17.2} w={2.5} d={2.2}
                color={C.construction} label="Under Construction" floors={1} onHover={B} />
      <Building cx={0.5}  cz={-17.2} w={2.0} d={2.2}
                color={C.construction} label="Under Construction" floors={2} onHover={B} />

      {/* Entry Gate — right side, mid-hostel zone */}
      <EntryGate cx={6.8} cz={-12} />

      {/* Boys Hostel — right side, upper hostel zone */}
      <BuildingComplex cx={3.6} cz={-13.5} w={3.0} d={3.5}
                       color={C.hostel} label="Boys Hostel" floors={3}
                       shape="H" onHover={B} />

      {/* Faculty Hostel — center */}
      <Building cx={0.5} cz={-12.5} w={3.2} d={2.0}
                color={C.hostel} label="Faculty Hostel" floors={2} onHover={B} />

      {/* Girls Hostel — left side */}
      <BuildingComplex cx={-4.2} cz={-11.5} w={3.0} d={3.2}
                       color={C.hostelGirls} label="Girls Hostel" floors={3}
                       shape="U" onHover={B} />

      {/* Bunnys Canteen — left, below girls hostel */}
      <Building cx={-4.2} cz={-8.5} w={2.2} d={1.5}
                color={C.amenity} label="Bunnys Canteen" floors={1} onHover={B} />

      {/* Hostel ground garden strip */}
      <Garden cx={1} cz={-9.5} w={5} d={2} color="#0a2010" />

      {/* ══════════════════════════════════════════
          ZONE 3: BUILDING CLUSTER
          z: R.h2+0.6 (-6.4) to R.h3-0.6 (-0.9)
          THREE COLUMNS separated by colAX and colBX
          LEFT column:   x -5.8 to -1.7
          CENTER column: x -0.7 to  2.1
          RIGHT column:  x  3.1 to  5.0
          ══════════════════════════════════════════ */}

      {/* LEFT COLUMN — blueprint shows 2 large U-shaped complexes stacked */}
      {/* Top-left complex */}
      <BuildingComplex
        cx={(ZONE.leftX.min + ZONE.leftX.max) / 2}   // x ≈ -3.75
        cz={-5.3} w={3.8} d={2.8}
        color={C.academic} label="Hostel / Academic Block (Left Top)"
        floors={3} shape="U" onHover={B}
      />
      {/* Bottom-left complex */}
      <BuildingComplex
        cx={(ZONE.leftX.min + ZONE.leftX.max) / 2}
        cz={-2.5} w={3.8} d={2.5}
        color={C.academic} label="Hostel / Academic Block (Left Bottom)"
        floors={3} shape="L" onHover={B}
      />

      {/* CENTER COLUMN — blueprint shows 2 box complexes with courtyard */}
      {/* Top-center */}
      <BuildingComplex
        cx={(ZONE.centerX.min + ZONE.centerX.max) / 2}  // x ≈ 0.7
        cz={-5.2} w={2.6} d={2.6}
        color={C.hostel} label="Academic Block (Center Top)"
        floors={2} shape="H" onHover={B}
      />
      {/* Bottom-center */}
      <BuildingComplex
        cx={(ZONE.centerX.min + ZONE.centerX.max) / 2}
        cz={-2.6} w={2.6} d={2.3}
        color={C.hostel} label="Academic Block (Center Bottom)"
        floors={2} shape="U" onHover={B}
      />

      {/* RIGHT COLUMN — blueprint shows 1 large single complex */}
      <BuildingComplex
        cx={(ZONE.rightX.min + ZONE.rightX.max) / 2}  // x ≈ 4.05
        cz={-3.8} w={2.5} d={5.0}
        color={C.academic} label="Academic Block (Right)"
        floors={3} shape="H" onHover={B}
      />

      {/* ══════════════════════════════════════════
          ZONE 4: DENSE ACADEMIC ZONE
          z: R.h3+0.4 (+0.1) to R.h4-0.4 (+4.8)
          Sub-divided by internal road at z=2.8
          ══════════════════════════════════════════ */}

      {/* ── Sub-zone 4A: z 0.1 to 2.4 ── */}

      {/* Engineering Block — left, large terracotta */}
      <Building cx={-4.0} cz={1.3} w={3.2} d={2.3}
                color={C.engineering} label="Engineering Block" floors={3} onHover={B} />
      {/* Engineering annex */}
      <Building cx={-2.0} cz={1.2} w={1.6} d={2.0}
                color="#3a1f0e" label="Engineering Block (Annex)" floors={2} onHover={B} />

      {/* Law Block — center-left */}
      <Building cx={0.3} cz={1.0} w={2.0} d={2.0}
                color={C.law} label="Law Block" floors={3} onHover={B} />

      {/* Old Law Block — right of center */}
      <Building cx={2.5} cz={1.0} w={2.0} d={2.0}
                color={C.law} label="Old Law Block" floors={2} onHover={B} />

      {/* Administration Block — far right */}
      <Building cx={4.5} cz={1.3} w={2.2} d={2.5}
                color={C.admin} label="Administration Block" floors={3} onHover={B} />

      {/* ── Sub-zone 4B: z 3.2 to 4.8 ── */}

      {/* Federal Bank #1 (near Admin) */}
      <Building cx={4.2} cz={4.0} w={1.8} d={1.3}
                color={C.bank} label="Federal Bank (Admin Branch)" floors={1} onHover={B} />

      {/* Federal Bank #2 + Royal Cafe cluster (center) — ATTACHED */}
      {/* Bank */}
      <Building cx={0.5} cz={4.0} w={2.0} d={1.3}
                color={C.bank} label="Federal Bank (Royal Cafe Branch)" floors={1} onHover={B} />
      {/* Connecting awning */}
      <mesh position={[1.55, 0.3, 4.0]} scale={[0.2, 0.55, 1.3]}>
        <boxGeometry />
        <meshStandardMaterial color="#1e2a38" transparent opacity={0.9} />
      </mesh>
      {/* Royal Cafe */}
      <Building cx={2.8} cz={4.0} w={2.5} d={1.3}
                color={C.cafe} label="Royal Cafe" floors={1} onHover={B} />
      <pointLight position={[2.8, 2, 4.0]} color="#ff9944" intensity={0.7} distance={5} decay={2} />

      {/* ══════════════════════════════════════════
          ZONE 5: LIBRARY
          z: R.h4+0.6 (+5.8) to R.h5-0.6 (+9.2)
          Full width
          ══════════════════════════════════════════ */}

      {/* Garden flanking library */}
      <Garden cx={-1}  cz={7.5} w={1.5} d={3} color="#0c2212" />
      <Garden cx={4.8} cz={7.5} w={1.5} d={3} color="#0c2212" />

      {/* Library — large wide building */}
      <Building cx={1.8} cz={7.5} w={7.5} d={2.8}
                color={C.library} label="Library" floors={2} onHover={B} />
      {/* Library entrance canopy */}
      <Building cx={1.8} cz={9.0} w={3} d={0.4}
                color="#1a2a40" label="Library" floors={0.5} onHover={B} />

      {/* ══════════════════════════════════════════
          ZONE 6: HOSPITAL + CHEMISTRY LABS
          z: R.h5+0.6 (+10.4) to R.h6-0.6 (+13.6)
          Full width, no column separators
          ══════════════════════════════════════════ */}

      {/* Hospital — left */}
      <BuildingComplex cx={-3.2} cz={12} w={3.2} d={3.0}
                       color={C.medical} label="Hospital"
                       floors={2} shape="L" onHover={B} />

      {/* Chemistry Labs — right */}
      <BuildingComplex cx={3.2} cz={12} w={3.5} d={3.0}
                       color="#162035" label="Chemistry Labs"
                       floors={2} shape="U" onHover={B} />

      {/* Small center building */}
      <Building cx={0.5} cz={11.5} w={2.0} d={2.2}
                color={C.academic} label="Dept Building" floors={2} onHover={B} />

      {/* ══════════════════════════════════════════
          ZONE 7: SPORTS COMPLEX + GROUND
          z: R.h6+0.6 (+14.8) to +20
          ══════════════════════════════════════════ */}

      {/* Sports ground — large green */}
      <Garden cx={0.5} cz={17} w={11} d={8} color="#0b2010" />

      {/* Sports Complex — left side */}
      <Building cx={-3} cz={16} w={3.8} d={3.0}
                color={C.sports} label="Sports Complex" floors={1} onHover={B} />

      {/* Sports Complex secondary building */}
      <Building cx={1.5} cz={16.5} w={3.0} d={2.0}
                color={C.sports} label="Sports Complex (Block 2)" floors={1} onHover={B} />

      {/* Very bottom small structure (blueprint shows isolated building) */}
      <Building cx={-1} cz={19.5} w={1.6} d={1.8}
                color={C.amenity} label="South Gate Building" floors={1} onHover={B} />

      {/* ══════════════════════════════════════════
          CAPSULE ORBS
          Placed above their corresponding buildings
          ══════════════════════════════════════════ */}
      {capsules.map((c) => (
        <CapsuleOrb
          key={c.id}
          cx={c.position.x}
          cz={c.position.z}
          category={c.category}
          onClick={() => onOrbClick(c)}
        />
      ))}

    </group>
  );
}

// ─────────────────────────────────────────────────────────────────
// DEMO CAPSULES — accurately positioned on named buildings
// ─────────────────────────────────────────────────────────────────
export const DEMO_CAPSULES = [
  {
    id: "c1", category: "Academics", location: "Engineering Block",
    title: "Engineering Block GPU Secret",
    content: "PC #4 from the left window has the only working GPU. Book it at 7am on lab days.",
    author: "Senior '22", upvotes: 93,
    position: { x: -4.0, z: 1.3 },
  },
  {
    id: "c2", category: "Infrastructure", location: "Royal Cafe",
    title: "Royal Cafe Hidden Menu",
    content: "Ask for 'Special Maggi' — not on the board but the uncle makes it for regulars.",
    author: "Senior '23", upvotes: 47,
    position: { x: 2.8, z: 4.0 },
  },
  {
    id: "c3", category: "Social", location: "Library",
    title: "Library Rooftop Secret",
    content: "Rooftop door unlocked every exam season. AC works, nobody goes up there.",
    author: "Senior '23", upvotes: 128,
    position: { x: 1.8, z: 7.5 },
  },
  {
    id: "c4", category: "Career", location: "Administration Block",
    title: "Admin Email Hack",
    content: "[URGENT] in subject line gets 3× faster replies from placement cell.",
    author: "Senior '22", upvotes: 211,
    position: { x: 4.5, z: 1.3 },
  },
  {
    id: "c5", category: "Social", location: "Boys Hostel",
    title: "Hostel WiFi Trick",
    content: "Room facing the stairwell gets strongest WiFi. Router is mounted on that wall.",
    author: "Senior '23", upvotes: 76,
    position: { x: 3.6, z: -13.5 },
  },
  {
    id: "c6", category: "Infrastructure", location: "Sports Complex",
    title: "Free Badminton Hours",
    content: "Badminton court is free and empty every day 6–7am. No booking needed.",
    author: "Senior '21", upvotes: 54,
    position: { x: -3.0, z: 16.0 },
  },
];

// ─────────────────────────────────────────────────────────────────
// DOM OVERLAYS
// ─────────────────────────────────────────────────────────────────
function Tooltip({ info }) {
  if (!info) return null;
  return (
    <div style={{
      position: "fixed", left: info.x + 14, top: info.y - 10,
      pointerEvents: "none",
      background: "rgba(4,8,18,0.95)",
      border: "1px solid rgba(0,255,231,0.3)",
      color: "#00ffe7", padding: "4px 12px",
      borderRadius: 5, fontSize: 11,
      fontFamily: "monospace", fontWeight: 700,
      zIndex: 100, whiteSpace: "nowrap",
      boxShadow: "0 0 14px rgba(0,255,231,0.12)",
    }}>{info.label}</div>
  );
}

function Legend() {
  return (
    <div style={{
      position: "absolute", bottom: 16, left: 16, zIndex: 20,
      fontFamily: "monospace",
    }}>
      <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1.5, marginBottom: 6 }}>
        ● WISDOM ORBS
      </div>
      {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
          <span style={{ color, fontSize: 9, fontWeight: 700 }}>{cat}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #1e293b", marginTop: 8, paddingTop: 8 }}>
        <div style={{ color: "#334155", fontSize: 9, letterSpacing: 1.5, marginBottom: 5 }}>
          ■ BUILDINGS
        </div>
        {[
          [C.hostel,      "Hostel"],
          [C.engineering, "Engineering"],
          [C.law,         "Law / Academic"],
          [C.admin,       "Administration"],
          [C.library,     "Library"],
          [C.medical,     "Medical"],
          [C.sports,      "Sports"],
          ["#c8952a",     "Temple"],
          [C.cafe,        "Cafe / Bank"],
        ].map(([color, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ width: 8, height: 8, background: color, borderRadius: 2 }} />
            <span style={{ color: "#475569", fontSize: 9 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Compass() {
  const stops = [
    { label: "▲ N · Temple", color: "#00ffe7", bold: true },
    { label: "Transport", color: "#334155" },
    { label: "─────", color: "#1e293b" },
    { label: "Hostels", color: "#475569" },
    { label: "─────", color: "#1e293b" },
    { label: "Academic", color: "#475569" },
    { label: "─────", color: "#1e293b" },
    { label: "Library", color: "#475569" },
    { label: "─────", color: "#1e293b" },
    { label: "Hospital", color: "#475569" },
    { label: "─────", color: "#1e293b" },
    { label: "Sports", color: "#475569" },
    { label: "▼ S", color: "#ff6b35", bold: true },
  ];
  return (
    <div style={{
      position: "absolute", top: 16, right: 16, zIndex: 20,
      fontFamily: "monospace", fontSize: 9, textAlign: "right", lineHeight: 2,
    }}>
      {stops.map(({ label, color, bold }, i) => (
        <div key={i} style={{ color, fontWeight: bold ? 900 : 400 }}>{label}</div>
      ))}
    </div>
  );
}

function HUD({ count }) {
  return (
    <div style={{ position: "absolute", top: 16, left: 16, zIndex: 20, fontFamily: "monospace" }}>
      <div style={{ color: "#00ffe7", fontWeight: 900, fontSize: 15, letterSpacing: 1 }}>
        🕰️ SRM TIME CAPSULE
      </div>
      <div style={{ color: "#1e293b", fontSize: 9, marginTop: 2 }}>
        {count} wisdom entries · Drag to orbit · Scroll to zoom · Click orbs
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────
export default function Scene({ capsules = DEMO_CAPSULES, onOrbClick = () => {} }) {
  const [tooltip, setTooltip] = useState(null);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: [0, 30, 32], fov: 48 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
        performance={{ min: 0.5 }}
        dpr={[1, 1.5]}
      >
        {/* Lighting */}
        <ambientLight intensity={0.22} />
        <directionalLight position={[8, 28, 8]} intensity={0.5} color="#3355ff" />
        {/* Cyan from north */}
        <pointLight position={[0, 14, -28]} intensity={3}   color="#00ffe7" distance={60} decay={2} />
        {/* Orange from south */}
        <pointLight position={[0, 14,  24]} intensity={2}   color="#ff6b35" distance={55} decay={2} />
        {/* Temple gold */}
        <pointLight position={[-4, 6, -22]} intensity={1.2} color="#ffd700" distance={18} decay={2} />

        <Stars radius={90} depth={45} count={3500} factor={3} fade speed={0.3} />

        <Campus capsules={capsules} onOrbClick={onOrbClick} onBuildingHover={setTooltip} />

        <OrbitControls
          enablePan enableZoom enableRotate
          maxPolarAngle={Math.PI / 2.08}
          minDistance={8} maxDistance={80}
          target={[0, 0, -2]}
          enableDamping dampingFactor={0.07}
        />
      </Canvas>

      <HUD count={capsules.length} />
      <Tooltip info={tooltip} />
      <Compass />
      <Legend />
    </div>
  );
}
