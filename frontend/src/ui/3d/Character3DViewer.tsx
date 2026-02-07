"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useRef, useEffect, useState } from "react";
import * as THREE from "three";

type Emotion = "neutral" | "happy" | "angry";

type Character3DModelProps = {
  glbUrl: string;
  emotion: Emotion;
};

function Character3DModel({ glbUrl, emotion }: Character3DModelProps) {
  const [loadError, setLoadError] = useState(false);

  let scene;
  try {
    const gltf = useGLTF(glbUrl);
    scene = gltf.scene;
  } catch (error) {
    console.error("Failed to load GLB:", error);
    setLoadError(true);
  }

  const modelRef = useRef<THREE.Group>(null);
  const baseRotation = useRef(new THREE.Euler(0, 0, 0));
  const originalMaterials = useRef<
    Array<{ mesh: THREE.Mesh; color: THREE.Color }>
  >([]);

  const emotionStartTime = useRef(0);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>("neutral");

  if (loadError || !scene) {
    return null;
  }

  // Store original materials on mount
  useEffect(() => {
    if (!modelRef.current) return;

    const materials: Array<{ mesh: THREE.Mesh; color: THREE.Color }> = [];
    modelRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        materials.push({
          mesh: child,
          color: material.color.clone(),
        });
      }
    });
    originalMaterials.current = materials;
  }, [scene]);

  // Update emotion state when prop changes
  useEffect(() => {
    if (emotion !== currentEmotion) {
      setCurrentEmotion(emotion);
      emotionStartTime.current = Date.now() / 1000;
    }
  }, [emotion, currentEmotion]);

  useFrame((state) => {
    if (!modelRef.current) return;

    const t = state.clock.getElapsedTime();
    const emotionElapsed = t - emotionStartTime.current;

    // Animation constants
    const HAPPY_DURATION = 2; // 2 seconds
    const ANGRY_DURATION = 2; // 2 seconds
    const intensity = 1.0;

    if (currentEmotion === "angry" && emotionElapsed < ANGRY_DURATION) {
      // Angry animation: violent shaking, rotation, red color
      const angryScale = 1 + Math.sin(t * 20) * 0.1 * intensity;

      modelRef.current.position.x = Math.sin(t * 50) * 0.5 * intensity;
      modelRef.current.position.y = Math.cos(t * 40) * 0.5 * intensity;
      modelRef.current.rotation.y =
        baseRotation.current.y + Math.sin(t * 30) * 0.5 * intensity;
      modelRef.current.scale.set(angryScale, angryScale, angryScale);

      // Change to red color
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          material.color.setRGB(
            1,
            1 - intensity * 0.7,
            1 - intensity * 0.7,
          );
        }
      });
    } else if (currentEmotion === "happy" && emotionElapsed < HAPPY_DURATION) {
      // Happy animation: bouncing, yellow/blue color
      const happyScale = 1 + Math.sin(t * 10) * 0.05 * intensity;

      modelRef.current.position.y = Math.abs(Math.sin(t * 10)) * 0.8 * intensity;
      modelRef.current.position.x = 0;
      modelRef.current.rotation.y = baseRotation.current.y;
      modelRef.current.scale.set(happyScale, happyScale, happyScale);

      // Change to yellow/blue color
      modelRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          const colorShift = Math.sin(t * 10) * 0.5 + 0.5;
          material.color.setRGB(1, 1, 0.5 + colorShift * 0.5 * intensity);
        }
      });
    } else {
      // Neutral animation: gentle floating and breathing
      if (currentEmotion !== "neutral" && emotionElapsed >= HAPPY_DURATION) {
        setCurrentEmotion("neutral");
      }

      modelRef.current.position.x = 0;
      modelRef.current.position.y = Math.sin(t * 2) * 0.2;
      modelRef.current.rotation.y =
        baseRotation.current.y + Math.sin(t * 1.5) * 0.15;
      const scale = 1 + Math.sin(t * 3) * 0.05;
      modelRef.current.scale.set(scale, scale, scale);

      // Restore original colors
      originalMaterials.current.forEach(({ mesh, color }) => {
        if (mesh.material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.color.copy(color);
        }
      });
    }
  });

  return <primitive ref={modelRef} object={scene} />;
}

type Character3DViewerProps = {
  glbUrl?: string;
  emotion?: Emotion;
};

export default function Character3DViewer({
  glbUrl,
  emotion = "neutral",
}: Character3DViewerProps) {
  const [isWebGLSupported, setIsWebGLSupported] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Check WebGL support for World App compatibility
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl");
      if (!gl) {
        console.warn("WebGL not supported");
        setIsWebGLSupported(false);
      }
    } catch (e) {
      console.error("WebGL check failed:", e);
      setIsWebGLSupported(false);
    }
  }, []);

  if (!glbUrl) {
    return null;
  }

  if (!isWebGLSupported || hasError) {
    // Fallback: return null to show GlowBlob instead
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 10], fov: 50 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl }) => {
        try {
          // Additional WebGL setup for mobile compatibility
          gl.setClearColor(0x000000, 0);
        } catch (e) {
          console.error("WebGL initialization error:", e);
          setHasError(true);
        }
      }}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <Character3DModel glbUrl={glbUrl} emotion={emotion} />
    </Canvas>
  );
}

// Preload GLB files for better performance
export function preloadCharacterModel(glbUrl: string) {
  useGLTF.preload(glbUrl);
}
