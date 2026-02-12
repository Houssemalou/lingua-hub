import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Base palette (adapted at runtime for light/dark) ───────────
const BASE = {
  skin: '#f5c6a0',
  hair: '#3b2314',
  shirt: '#4f46e5',
  pants: '#1e293b',
  shoe: '#18181b',
  eye: '#1e293b',
  lip: '#e57373',
};


// ─── Reusable rounded‑box helper (capsule‑ish) ─────────────────
function RoundedBox({
  args,
  position,
  color,
  castShadow = true,
}: {
  args: [number, number, number];
  position: [number, number, number];
  color: string;
  castShadow?: boolean;
}) {
  // Use box with slightly rounded edge via standard mesh
  return (
    <mesh position={position} castShadow={castShadow}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.05} />
    </mesh>
  );
}

// ─── The procedural 3D human character ──────────────────────────
interface HumanCharacterProps {
  isSpeaking?: boolean;
}

function HumanCharacter({ isSpeaking = false }: HumanCharacterProps) {
  const groupRef = useRef<THREE.Group>(null!);
  const headRef  = useRef<THREE.Group>(null!);
  const leftArmRef  = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const mouthRef = useRef<THREE.Mesh>(null!);

  // Idle breathing + gentle sway (with slightly stronger speaking motion)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Whole body gentle sway
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.45) * 0.05;
      groupRef.current.position.y = Math.sin(t * 1.1) * 0.022; // subtle float
    }

    // Head subtle nod / look‑around (more expressive when speaking)
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(t * (isSpeaking ? 1.0 : 0.8)) * (isSpeaking ? 0.06 : 0.04);
      headRef.current.rotation.y = Math.sin(t * (isSpeaking ? 0.9 : 0.6)) * (isSpeaking ? 0.12 : 0.08);
    }

    // Arm idle swing (gentle wave when speaking)
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 1.0) * (isSpeaking ? 0.12 : 0.08);
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = Math.sin(t * 1.0 + Math.PI) * (isSpeaking ? 0.12 : 0.08);
    }

    // Mouth animation when speaking (more natural amplitude)
    if (mouthRef.current) {
      if (isSpeaking) {
        const scaleY = 0.9 + Math.abs(Math.sin(t * 9 + 0.5)) * 0.9;
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, scaleY, 0.25);
      } else {
        mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 1, 0.12);
      }
    }
  });

  // Eye blink material (color adapts to theme)
  const { theme } = useTheme();
  const palette = useMemo(() => ({
    skin: BASE.skin,
    hair: BASE.hair,
    shirt: theme === 'dark' ? '#7c5cff' : BASE.shirt,
    pants: theme === 'dark' ? '#0f1724' : BASE.pants,
    // shoes become white in dark mode for better contrast (requested)
    shoe: theme === 'dark' ? '#ffffff' : BASE.shoe,
    eye: theme === 'dark' ? '#0b1220' : BASE.eye,
    lip: BASE.lip,
  }), [theme]);

  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: palette.eye, roughness: 0.25, metalness: 0.0 }), [palette.eye]);

  return (
    <group ref={groupRef} position={[0, -0.7, 0]}>      {/* ── Legs ────────────────────────────────── */}
      <RoundedBox args={[0.16, 0.55, 0.16]} position={[-0.12, -0.6, 0]} color={palette.pants} />
      <RoundedBox args={[0.16, 0.55, 0.16]} position={[0.12, -0.6, 0]}  color={palette.pants} />

      {/* ── Shoes ───────────────────────────────── */}
      <RoundedBox args={[0.18, 0.08, 0.24]} position={[-0.12, -0.90, 0.04]} color={palette.shoe} />
      <RoundedBox args={[0.18, 0.08, 0.24]} position={[0.12, -0.90, 0.04]}  color={palette.shoe} />

      {/* ── Torso ───────────────────────────────── */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <boxGeometry args={[0.48, 0.6, 0.24]} />
        <meshStandardMaterial color={palette.shirt} roughness={0.45} metalness={0.06} />
      </mesh>

      {/* Shirt collar V */}
      <mesh position={[0, 0.30, 0.121]} castShadow>
        <planeGeometry args={[0.14, 0.10]} />
        <meshStandardMaterial color={palette.skin} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* ── Arms ────────────────────────────────── */}
      <group ref={leftArmRef} position={[-0.32, 0.18, 0]}>
        {/* upper */}
        <RoundedBox args={[0.14, 0.32, 0.14]} position={[0, -0.10, 0]} color={palette.shirt} />
        {/* forearm */}
        <RoundedBox args={[0.12, 0.28, 0.12]} position={[0, -0.38, 0]} color={palette.skin} />
        {/* hand */}
        <mesh position={[0, -0.56, 0]} castShadow>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.32, 0.18, 0]}>
        <RoundedBox args={[0.14, 0.32, 0.14]} position={[0, -0.10, 0]} color={palette.shirt} />
        <RoundedBox args={[0.12, 0.28, 0.12]} position={[0, -0.38, 0]} color={palette.skin} />
        <mesh position={[0, -0.56, 0]} castShadow>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>
      </group>

      {/* ── Head ────────────────────────────────── */}
      <group ref={headRef} position={[0, 0.58, 0]}>
        {/* Neck */}
        <mesh position={[0, -0.12, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.07, 0.12, 12]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>

        {/* Head sphere */}
        <mesh castShadow>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshStandardMaterial color={palette.skin} roughness={0.65} />
        </mesh>

        {/* Hair – top cap */}
        <mesh position={[0, 0.08, -0.02]}>
          <sphereGeometry args={[0.23, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={palette.hair} roughness={0.82} metalness={0.02} />
        </mesh>

        {/* Hair – back */}
        <mesh position={[0, -0.02, -0.08]}>
          <boxGeometry args={[0.40, 0.26, 0.12]} />
          <meshStandardMaterial color={palette.hair} roughness={0.82} metalness={0.02} />
        </mesh>

        {/* Left eye */}
        <mesh position={[-0.08, 0.04, 0.19]} material={eyeMat}>
          <sphereGeometry args={[0.036, 12, 12]} />
        </mesh>
        {/* Right eye */}
        <mesh position={[0.08, 0.04, 0.19]} material={eyeMat}>
          <sphereGeometry args={[0.036, 12, 12]} />
        </mesh>

        {/* Eye whites (slightly larger for improved visual quality) */}
        <mesh position={[-0.08, 0.04, 0.175]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.28} />
        </mesh>
        <mesh position={[0.08, 0.04, 0.175]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color="#ffffff" roughness={0.28} />
        </mesh>

        {/* Eyebrows */}
        <mesh position={[-0.08, 0.10, 0.19]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.07, 0.012, 0.01]} />
          <meshStandardMaterial color={palette.hair} roughness={0.9} />
        </mesh>
        <mesh position={[0.08, 0.10, 0.19]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.07, 0.012, 0.01]} />
          <meshStandardMaterial color={palette.hair} roughness={0.9} />
        </mesh>

        {/* Nose */}
        <mesh position={[0, -0.01, 0.22]}>
          <coneGeometry args={[0.02, 0.05, 8]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>

        {/* Mouth (improved material + subtle inner shading) */}
        <mesh ref={mouthRef} position={[0, -0.09, 0.20]}>
          <boxGeometry args={[0.08, 0.03, 0.02]} />
          <meshStandardMaterial color={palette.lip} roughness={0.42} metalness={0.02} />
        </mesh>

        {/* Ears */}
        <mesh position={[-0.22, 0.0, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>
        <mesh position={[0.22, 0.0, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={palette.skin} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Exported Canvas wrapper ────────────────────────────────────
interface Avatar3DCharacterProps {
  isSpeaking?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Avatar3DCharacter({
  isSpeaking = false,
  className,
  style,
}: Avatar3DCharacterProps) {
  const { theme } = useTheme();

  return (
    <div className={className} style={{ width: '100%', height: '100%', ...style }}>
      <Canvas
        dpr={[1, Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio : 1.5)]}
        shadows
        camera={{ position: [0, 0, 2.2], fov: 40 }}
        gl={{ antialias: true, alpha: true, toneMappingExposure: 1.0 }}
        style={{ background: 'transparent' }}
      >
        {/* Ambient + rim lighting for better visibility in dark mode */}
        <ambientLight intensity={0.55} />
        <directionalLight
          position={[3, 5, 3]}
          intensity={0.9}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-2, 2, 2]} intensity={0.45} color={theme === 'dark' ? '#7dd3fc' : '#a5b4fc'} />
        <pointLight position={[1.5, 2.5, 1]} intensity={theme === 'dark' ? 0.25 : 0.18} color={theme === 'dark' ? '#8b5cf6' : '#ffd580'} />

        <Float speed={2} rotationIntensity={0.18} floatIntensity={0.35}>
          <HumanCharacter isSpeaking={isSpeaking} />
        </Float>

        <ContactShadows
          position={[0, -1.6, 0]}
          opacity={0.5}
          scale={3.2}
          blur={2.2}
          far={4}
        />

        <Environment preset={theme === 'dark' ? 'city' : 'sunset'} background={false} />
      </Canvas>
    </div>
  );
}
