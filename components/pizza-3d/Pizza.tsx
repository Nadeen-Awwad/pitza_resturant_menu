'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PizzaType } from '@/lib/pizza-data'

interface PizzaProps {
  pizza: PizzaType
  position: [number, number, number]
  rotation: number
  toppings: { ingredientId: string; positions: { x: number; y: number; z: number }[] }[]
}

function PizzaBase({ pizza }: { pizza: PizzaType }) {
  const pizzaRef = useRef<THREE.Group>(null)

  // Create pizza base geometry - a flat cylinder
  const baseGeometry = useMemo(() => new THREE.CylinderGeometry(2, 2, 0.15, 64), [])
  const crustGeometry = useMemo(() => new THREE.TorusGeometry(1.9, 0.2, 16, 64), [])
  const sauceGeometry = useMemo(() => new THREE.CylinderGeometry(1.7, 1.7, 0.02, 64), [])
  const cheeseGeometry = useMemo(() => new THREE.CylinderGeometry(1.65, 1.65, 0.03, 64), [])

  // Create materials
  const baseMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: pizza.baseColor,
        roughness: 0.8,
        metalness: 0.1,
      }),
    [pizza.baseColor]
  )

  const crustMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: pizza.crustColor,
        roughness: 0.9,
        metalness: 0,
      }),
    [pizza.crustColor]
  )

  const sauceMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: pizza.sauceColor,
        roughness: 0.7,
        metalness: 0,
      }),
    [pizza.sauceColor]
  )

  const cheeseMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#fff8dc',
        roughness: 0.6,
        metalness: 0.1,
      }),
    []
  )

  return (
    <group ref={pizzaRef}>
      {/* Pizza base/dough */}
      <mesh geometry={baseGeometry} material={baseMaterial} rotation={[Math.PI / 2, 0, 0]} />

      {/* Crust ring */}
      <mesh geometry={crustGeometry} material={crustMaterial} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.08]} />

      {/* Sauce layer */}
      <mesh geometry={sauceGeometry} material={sauceMaterial} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.09]} />

      {/* Cheese layer */}
      <mesh geometry={cheeseGeometry} material={cheeseMaterial} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.11]} />
    </group>
  )
}

// Individual topping components based on shape
function Pepperoni({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.15, 0.15, 0.03, 16]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  )
}

function Mushroom({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      {/* Cap */}
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.08, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0, -0.02]}>
        <cylinderGeometry args={[0.03, 0.04, 0.06, 8]} />
        <meshStandardMaterial color="#f5f5f4" roughness={0.9} />
      </mesh>
    </group>
  )
}

function Olive({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <torusGeometry args={[0.06, 0.03, 8, 16]} />
      <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} />
    </mesh>
  )
}

function Corn({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  )
}

function Pepper({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={[0, Math.random() * Math.PI * 2, 0]}>
      <boxGeometry args={[0.18, 0.04, 0.06]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  )
}

function Onion({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={[Math.PI / 2, 0, Math.random() * Math.PI * 2]}>
      <torusGeometry args={[0.08, 0.02, 8, 16, Math.PI * 1.5]} />
      <meshStandardMaterial color={color} roughness={0.7} transparent opacity={0.9} />
    </mesh>
  )
}

function Bacon({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position} rotation={[0, Math.random() * Math.PI * 2, 0]}>
      <boxGeometry args={[0.25, 0.02, 0.08]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}

function Pineapple({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[0.12, 0.04, 0.12]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  )
}

function Topping({
  shape,
  position,
  color,
}: {
  shape: string
  position: [number, number, number]
  color: string
}) {
  switch (shape) {
    case 'pepperoni':
      return <Pepperoni position={position} color={color} />
    case 'mushroom':
      return <Mushroom position={position} color={color} />
    case 'olive':
      return <Olive position={position} color={color} />
    case 'corn':
      return <Corn position={position} color={color} />
    case 'pepper':
      return <Pepper position={position} color={color} />
    case 'onion':
      return <Onion position={position} color={color} />
    case 'bacon':
      return <Bacon position={position} color={color} />
    case 'pineapple':
      return <Pineapple position={position} color={color} />
    default:
      return <Pepperoni position={position} color={color} />
  }
}

export default function Pizza({ pizza, position, rotation, toppings }: PizzaProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(() => {
    if (groupRef.current) {
      // Smooth rotation for a slight idle animation
      groupRef.current.rotation.z += 0.001
    }
  })

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      {/* Pizza faces the camera - rotated to be vertical */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <PizzaBase pizza={pizza} />

        {/* Render placed toppings */}
        {toppings.map((topping) => {
          const ingredient = pizza.ingredients.find((i) => i.id === topping.ingredientId)
          if (!ingredient) return null

          return topping.positions.map((pos, idx) => (
            <Topping
              key={`${topping.ingredientId}-${idx}`}
              shape={ingredient.shape}
              position={[pos.x, pos.z + 0.12, -pos.y]}
              color={ingredient.color}
            />
          ))
        })}
      </group>
    </group>
  )
}
