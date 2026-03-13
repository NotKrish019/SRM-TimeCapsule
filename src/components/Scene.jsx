/**
 * Scene.jsx — SRM University Campus 3D Environment
 * ──────────────────────────────────────────────────
 * Loads the campus from a .OBJ model file and renders
 * it with interactive building hover/click, capsule orbs,
 * and overlay UI components.
 */

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import TimeCapsuleSidebar from "./TimeCapsuleSidebar";

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
//  Human-readable labels for tooltips
// ═══════════════════════════════════════════════════════
const BUILDING_LABELS = {
  "Road":            null,
  "ground":          null,
  "old_law_block":   "Old Law Block",
  "Faculty_Hostel":  "Faculty Hostel",
  "Law_Block":       "Law Block",
  "administrative_block": "Administration Block",
  "Engineering_Block":    "Engineering Block",
  "federal_bank":    "Federal Bank",
  "royal_cafe":      "Royal Cafe",
  "Library_Hotel_Management": "Library & Hotel Management",
  "Centre_for_drug_design_discovery_and_development": "Hospital / Drug Design Centre",
  "Laboratory_block": "Laboratory Block",
  "Girls_Hostel":    "Girls Hostel",
  "Bunny's_Kitchen": "Bunny's Kitchen",
  "Boys_Hostel":     "Boys Hostel",
  "gate":            "SRM University Gate",
  "under_construction": "Under Construction",
};

// ═══════════════════════════════════════════════════════
//  PROCEDURAL GRASS TEXTURE (for gardens / ground)
// ═══════════════════════════════════════════════════════
function makeGrassTexture() {
  const W = 256, H = 256;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Base green
  ctx.fillStyle = "#3a8a4a";
  ctx.fillRect(0, 0, W, H);

  // Random grass blades / variation
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const shade = Math.random();
    ctx.fillStyle = shade > 0.5
      ? `rgba(45,${100 + Math.floor(Math.random() * 60)},55,0.7)`
      : `rgba(60,${120 + Math.floor(Math.random() * 50)},40,0.5)`;
    ctx.fillRect(x, y, 1 + Math.random() * 2, 1 + Math.random() * 3);
  }

  // Lighter patches
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H;
    ctx.fillStyle = "rgba(90,180,70,0.15)";
    ctx.beginPath();
    ctx.arc(x, y, 5 + Math.random() * 15, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

// ═══════════════════════════════════════════════════════
//  MATERIAL FACTORY — returns the right material for
//  each named OBJ object based on real SRM building look
// ═══════════════════════════════════════════════════════
let _grassTex = null;
function getGrassTexture() {
  if (!_grassTex) _grassTex = makeGrassTexture();
  return _grassTex;
}

// ═══════════════════════════════════════════════════════
//  PROCEDURAL HOSTEL FACADE TEXTURE
//  White walls + mustard yellow vertical accent panels
//  + symmetrical windows with white railings/balconies
// ═══════════════════════════════════════════════════════
function makeHostelTexture() {
  const W = 512, H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // ── 1. Base wall — clean white ──
  ctx.fillStyle = "#f8f6f0";
  ctx.fillRect(0, 0, W, H);

  // ── 2. Mustard yellow vertical accent panels ──
  // Two accent strips running full height (like the real hostel facade)
  const accentColor = "#d4a017";
  const stripW = 40;
  // Left-center accent panel
  ctx.fillStyle = accentColor;
  ctx.fillRect(W * 0.28 - stripW / 2, 0, stripW, H);
  // Right-center accent panel
  ctx.fillRect(W * 0.72 - stripW / 2, 0, stripW, H);
  // Thin beige separator lines flanking the accents
  ctx.fillStyle = "#ece0c8";
  ctx.fillRect(W * 0.28 - stripW / 2 - 4, 0, 4, H);
  ctx.fillRect(W * 0.28 + stripW / 2, 0, 4, H);
  ctx.fillRect(W * 0.72 - stripW / 2 - 4, 0, 4, H);
  ctx.fillRect(W * 0.72 + stripW / 2, 0, 4, H);

  // ── 3. Symmetrical windows ──
  const floors = 6;
  const cols = 8;
  const floorH = H / floors;
  const colW = W / cols;
  const winW = colW * 0.50;
  const winH = floorH * 0.45;

  for (let f = 0; f < floors; f++) {
    for (let c = 0; c < cols; c++) {
      const wx = c * colW + (colW - winW) / 2;
      const wy = f * floorH + floorH * 0.22;

      // Check if this window sits on an accent panel — skip if so
      const winCenterX = wx + winW / 2;
      const onAccent1 = Math.abs(winCenterX - W * 0.28) < stripW / 2 + 8;
      const onAccent2 = Math.abs(winCenterX - W * 0.72) < stripW / 2 + 8;
      if (onAccent1 || onAccent2) continue;

      // Dark glass window
      ctx.fillStyle = "#2a3a50";
      ctx.fillRect(wx, wy, winW, winH);

      // Subtle glass reflection highlight
      ctx.fillStyle = "rgba(120,180,220,0.15)";
      ctx.fillRect(wx + 2, wy + 2, winW * 0.35, winH * 0.25);

      // White railing / balcony ledge below window
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(wx - 3, wy + winH, winW + 6, 5);
      // Railing vertical bars
      ctx.fillStyle = "#e8e8e8";
      const railingH = floorH * 0.18;
      ctx.fillRect(wx - 3, wy + winH + 5, winW + 6, 2);
      const barCount = 5;
      for (let b = 0; b <= barCount; b++) {
        const bx = wx - 2 + b * ((winW + 4) / barCount);
        ctx.fillRect(bx, wy + winH + 2, 2, railingH);
      }
      // Bottom rail
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(wx - 3, wy + winH + railingH + 2, winW + 6, 2);
    }
  }

  // ── 4. Horizontal floor-band lines ──
  ctx.strokeStyle = "rgba(180,175,160,0.25)";
  ctx.lineWidth = 2;
  for (let f = 1; f < floors; f++) {
    ctx.beginPath();
    ctx.moveTo(0, f * floorH);
    ctx.lineTo(W, f * floorH);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

let _hostelTex = null;
function getHostelTexture() {
  if (!_hostelTex) _hostelTex = makeHostelTexture();
  return _hostelTex;
}

function makeBuildingMaterial(objName) {
  const n = objName.toLowerCase();

  // ── ROADS ──────────────────────────────────────────
  if (n.includes("road")) {
    return {
      mat: new THREE.MeshStandardMaterial({
        color: "#a0a4b0",
        roughness: 0.88,
        metalness: 0.0,
      }),
      castShadow: false,
    };
  }

  // ── GARDENS / GROUND ───────────────────────────────
  if (n.includes("ground")) {
    return {
      mat: new THREE.MeshStandardMaterial({
        map: getGrassTexture(),
        color: "#4caf50",
        roughness: 0.92,
        metalness: 0.0,
      }),
      castShadow: false,
    };
  }

  // ── HOSTELS (Boys, Girls, Faculty) ─────────────────
  // White walls + mustard yellow vertical accent panels
  // Symmetrical windows with white railings / balconies
  if (n.includes("hostel")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        map: getHostelTexture(),
        color: "#ffffff",
        emissive: "#d4a017",
        emissiveIntensity: 0.02,
        roughness: 0.55,
        metalness: 0.05,
        clearcoat: 0.2,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.4,
      }),
      castShadow: true,
    };
  }

  // ── ENGINEERING BLOCK ──────────────────────────────
  // Large blue-tinted glass panels, white/light grey concrete bands
  // Corporate / IT park style
  if (n.includes("engineering")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#1a5a9a",          // blue-tinted glass
        emissive: "#104080",
        emissiveIntensity: 0.06,
        roughness: 0.08,
        metalness: 0.65,
        transmission: 0.2,
        thickness: 0.4,
        reflectivity: 0.9,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.5,
      }),
      castShadow: true,
    };
  }

  // ── OLD LAW BLOCK ──────────────────────────────────
  // Wide low-rise, light cream/off-white, sloping grey roof feel,
  // dark glass horizontal windows
  if (n.includes("old_law")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#f0e8d8",          // light cream / off-white
        emissive: "#c8b898",
        emissiveIntensity: 0.03,
        roughness: 0.65,
        metalness: 0.05,
        clearcoat: 0.2,
        clearcoatRoughness: 0.5,
        envMapIntensity: 0.3,
      }),
      castShadow: true,
    };
  }

  // ── LAW BLOCK (new) ────────────────────────────────
  if (n.includes("law_block") && !n.includes("old")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#e8e0d0",
        emissive: "#b8a888",
        emissiveIntensity: 0.03,
        roughness: 0.5,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.4,
      }),
      castShadow: true,
    };
  }

  // ── HOSPITAL / DRUG DESIGN CENTRE ──────────────────
  // White/light grey, minimal, clinical blue accents
  if (n.includes("drug") || n.includes("hospital")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#f0f4f8",          // clinical white
        emissive: "#3b82f6",       // subtle blue accent glow
        emissiveIntensity: 0.03,
        roughness: 0.5,
        metalness: 0.1,
        clearcoat: 0.4,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.4,
      }),
      castShadow: true,
    };
  }

  // ── ADMINISTRATION BLOCK ───────────────────────────
  // Dark reflective glass panels, black metal frames, sleek modern
  if (n.includes("admin")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#1a1a2e",          // dark glass
        emissive: "#0a0a1a",
        emissiveIntensity: 0.02,
        roughness: 0.05,
        metalness: 0.8,
        transmission: 0.15,
        thickness: 0.3,
        reflectivity: 0.95,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.0,
      }),
      castShadow: true,
    };
  }

  // ── LIBRARY & HOTEL MANAGEMENT ─────────────────────
  // Light cream / off-white, smooth panel texture, flat roof
  if (n.includes("library")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#f5efe5",          // light cream
        emissive: "#d4c8a8",
        emissiveIntensity: 0.03,
        roughness: 0.45,
        metalness: 0.08,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.4,
      }),
      castShadow: true,
    };
  }

  // ── LABORATORY BLOCK ───────────────────────────────
  // Similar to hospital — clean, functional, white-ish
  if (n.includes("laboratory")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#e8eef2",
        emissive: "#6890a8",
        emissiveIntensity: 0.03,
        roughness: 0.4,
        metalness: 0.15,
        clearcoat: 0.5,
        clearcoatRoughness: 0.25,
        envMapIntensity: 0.5,
      }),
      castShadow: true,
    };
  }

  // ── GATE ───────────────────────────────────────────
  // White-greyish and silver metallic, "SRM University" style
  if (n.includes("gate")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#d0d4dc",          // silver / white-grey
        emissive: "#a0a8b8",
        emissiveIntensity: 0.06,
        roughness: 0.15,
        metalness: 0.85,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        reflectivity: 0.9,
        envMapIntensity: 1.5,
      }),
      castShadow: true,
    };
  }

  // ── FEDERAL BANK ───────────────────────────────────
  if (n.includes("federal_bank")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#e8e0d0",
        emissive: "#1e40af",       // bank blue accent
        emissiveIntensity: 0.04,
        roughness: 0.4,
        metalness: 0.15,
        clearcoat: 0.4,
        clearcoatRoughness: 0.3,
        envMapIntensity: 0.5,
      }),
      castShadow: true,
    };
  }

  // ── ROYAL CAFE ─────────────────────────────────────
  if (n.includes("royal_cafe") || n.includes("cafe")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#f5e6d0",          // warm cream
        emissive: "#d97706",       // warm amber glow
        emissiveIntensity: 0.06,
        roughness: 0.5,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.4,
      }),
      castShadow: true,
    };
  }

  // ── BUNNY'S KITCHEN ────────────────────────────────
  if (n.includes("bunny")) {
    return {
      mat: new THREE.MeshPhysicalMaterial({
        color: "#fff0e0",
        emissive: "#e07020",
        emissiveIntensity: 0.05,
        roughness: 0.5,
        metalness: 0.08,
        clearcoat: 0.25,
        clearcoatRoughness: 0.4,
        envMapIntensity: 0.3,
      }),
      castShadow: true,
    };
  }

  // ── UNDER CONSTRUCTION ─────────────────────────────
  if (n.includes("under_construction") || n.includes("construction")) {
    return {
      mat: new THREE.MeshStandardMaterial({
        color: "#b0b8c0",
        roughness: 0.75,
        metalness: 0.05,
      }),
      castShadow: true,
    };
  }

  // ── FALLBACK ───────────────────────────────────────
  return {
    mat: new THREE.MeshPhysicalMaterial({
      color: "#c0c8d0",
      emissive: "#808890",
      emissiveIntensity: 0.03,
      roughness: 0.4,
      metalness: 0.2,
      clearcoat: 0.3,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.5,
    }),
    castShadow: true,
  };
}

// ═══════════════════════════════════════════════════════
//  OBJ CAMPUS MODEL
// ═══════════════════════════════════════════════════════
function CampusModel({ onHover, onClick }) {
  const obj = useLoader(OBJLoader, "/model.obj");
  const groupRef = useRef();

  useEffect(() => {
    if (!obj) return;

    obj.traverse((child) => {
      if (child.isMesh) {
        const objName = child.name || child.parent?.name || "";
        const { mat, castShadow: cs } = makeBuildingMaterial(objName);

        child.material = mat;
        child.castShadow = cs;
        child.receiveShadow = true;
      }
    });
  }, [obj]);

  // Raycasting helpers for hover/click
  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    const mesh = e.object;
    const objName = mesh.name || mesh.parent?.name || "";
    
    let label = null;
    for (const key of Object.keys(BUILDING_LABELS)) {
      if (objName.includes(key)) {
        label = BUILDING_LABELS[key];
        break;
      }
    }

    if (label) {
      document.body.style.cursor = "pointer";
      onHover?.({ label, x: e.clientX, y: e.clientY });
      // Highlight on hover
      if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
        mesh.material.emissiveIntensity = 0.25;
      }
    }
  }, [onHover]);

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    document.body.style.cursor = "default";
    onHover?.(null);
    const mesh = e.object;
    if (mesh.material && mesh.material.emissiveIntensity !== undefined) {
      mesh.material.emissiveIntensity = 0.05;
    }
  }, [onHover]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const mesh = e.object;
    const objName = mesh.name || mesh.parent?.name || "";
    
    let label = null;
    for (const key of Object.keys(BUILDING_LABELS)) {
      if (objName.includes(key)) {
        label = BUILDING_LABELS[key];
        break;
      }
    }
    if (label) {
      onClick?.(label);
    }
  }, [onClick]);

  return (
    <primitive
      ref={groupRef}
      object={obj}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
    />
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
  { id: "c3", category: "Social",         location: "Library & Hotel Management",
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

// ═══════════════════════════════════════════════════════
//  MAIN EXPORT
// ═══════════════════════════════════════════════════════
export default function Scene({ capsules = DEMO_CAPSULES, onOrbClick: externalOrbClick }) {
  const [tooltip,  setTooltip]  = useState(null);
  const [selected, setSelected] = useState(null);
  const [activeBuilding, setActiveBuilding] = useState(null);

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
        onPointerMissed={() => setActiveBuilding(null)}
      >
        {/* ── LIGHTING ── */}
        <ambientLight intensity={0.55} color="#c0d8ff" />
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
        <directionalLight position={[-10, 15, -20]} intensity={0.35} color="#88aaff" />

        {/* HDR environment for glass reflections */}
        <Environment preset="city" />

        {/* OBJ Campus Model */}
        <CampusModel onHover={setTooltip} onClick={setActiveBuilding} />

        {/* Capsule Orbs */}
        {capsules.map((c) => (
          <CapsuleOrb key={c.id}
            cx={c.position.x} cz={c.position.z}
            category={c.category}
            onClick={() => handleOrb(c)} />
        ))}

        <OrbitControls
          enablePan enableZoom enableRotate
          maxPolarAngle={Math.PI / 2.05}
          minDistance={8} maxDistance={85}
          target={[0, 0, -2]}
          enableDamping dampingFactor={0.07}
          zoomSpeed={0.8}
        />
      </Canvas>

      <TimeCapsuleSidebar selectedBuilding={activeBuilding} />
      <Tooltip info={tooltip} />
      <Compass />
      <Legend />

      {selected && (
        <ModalCard capsule={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
