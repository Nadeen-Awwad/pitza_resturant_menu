'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Ingredient } from '@/lib/pizza-data'

interface FlyingIngredientProps {
  ingredient: Ingredient
  startPosition: THREE.Vector3
  targetPosition: THREE.Vector3
  onComplete: (finalPosition: { x: number; y: number; z: number }) => void
}

// Bezier curve for smooth arc trajectory
function getPointOnCurve(start: THREE.Vector3, end: THREE.Vector3, t: number): THREE.Vector3 {
  // Control point for the arc - higher in the middle
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2 + 2 // Arc height
  const midZ = (start.z + end.z) / 2

  const control = new THREE.Vector3(midX, midY, midZ)

  // Quadratic bezier curve
  const oneMinusT = 1 - t
  return new THREE.Vector3(
    oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * control.x + t * t * end.x,
    oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * control.y + t * t * end.y,
    oneMinusT * oneMinusT * start.z + 2 * oneMinusT * t * control.z + t * t * end.z
  )
}

function IngredientMesh({ shape, color }: { shape: string; color: string }) {
  switch (shape) {
    case 'pepperoni':
      return (
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.03, 16]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      )
    case 'mushroom':
      return (
        <group>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[0.08, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={color} roughness={0.8} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 0.06, 8]} />
            <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
          </mesh>
        </group>
      )
    case 'olive':
      return (
        <mesh>
          <torusGeometry args={[0.06, 0.03, 8, 16]} />
          <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
        </mesh>
      )
    case 'corn':
      return (
        <mesh>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      )
    case 'pepper':
      return (
        <mesh>
          <boxGeometry args={[0.18, 0.04, 0.06]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      )
    case 'onion':
      return (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI * 1.5]} />
          <meshStandardMaterial color={color} roughness={0.7} transparent opacity={0.9} />
        </mesh>
      )
    case 'bacon':
      return (
        <mesh>
          <boxGeometry args={[0.25, 0.02, 0.08]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      )
    case 'pineapple':
      return (
        <mesh>
          <boxGeometry args={[0.12, 0.04, 0.12]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      )
    default:
      return (
        <mesh>
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color={color} />
        </mesh>
      )
  }
}

export default function FlyingIngredient({
  ingredient,
  startPosition,
  targetPosition,
  onComplete,
}: FlyingIngredientProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const rotationSpeed = useRef({
    x: (Math.random() - 0.5) * 10,
    y: (Math.random() - 0.5) * 10,
    z: (Math.random() - 0.5) * 10,
  })

  useFrame((_, delta) => {
    if (isComplete || !groupRef.current) return

    // Animate along the curve
    const newProgress = Math.min(progress + delta * 1.5, 1)
    setProgress(newProgress)

    // Get position on curve
    const pos = getPointOnCurve(startPosition, targetPosition, newProgress)
    groupRef.current.position.copy(pos)

    // Spin while flying
    groupRef.current.rotation.x += rotationSpeed.current.x * delta
    groupRef.current.rotation.y += rotationSpeed.current.y * delta
    groupRef.current.rotation.z += rotationSpeed.current.z * delta

    // Complete when reached target
    if (newProgress >= 1) {
      setIsComplete(true)
      onComplete({
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
      })
    }
  })

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(startPosition)
    }
  }, [startPosition])

  if (isComplete) return null

  return (
    <group ref={groupRef}>
      <IngredientMesh shape={ingredient.shape} color={ingredient.color} />
    </group>
  )
}
