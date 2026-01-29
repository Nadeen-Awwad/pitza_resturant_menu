'use client'

import React from "react"

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import * as THREE from 'three'
import Pizza from './Pizza'
import FlyingIngredient from './FlyingIngredient'
import { pizzaTypes, type Ingredient, type PizzaType } from '@/lib/pizza-data'

interface PizzaState {
  pizza: PizzaType
  positionX: number
  rotation: number
  toppings: { ingredientId: string; positions: { x: number; y: number; z: number }[] }[]
}

interface FlyingItem {
  id: string
  ingredient: Ingredient
  startPosition: THREE.Vector3
  targetPosition: THREE.Vector3
}

interface SceneContentProps {
  currentPizzaIndex: number
  isTransitioning: boolean
  transitionDirection: 'left' | 'right' | null
  transitionProgress: number
  pizzaStates: PizzaState[]
  flyingIngredients: FlyingItem[]
  onIngredientLanded: (id: string, ingredientId: string, position: { x: number; y: number; z: number }) => void
}

function SceneContent({
  currentPizzaIndex,
  isTransitioning,
  transitionDirection,
  transitionProgress,
  pizzaStates,
  flyingIngredients,
  onIngredientLanded,
}: SceneContentProps) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0, 6)
    camera.lookAt(0, 0, 0)
  }, [camera])

  // Calculate positions based on transition
  const currentState = pizzaStates[currentPizzaIndex]
  const nextIndex =
    transitionDirection === 'left'
      ? (currentPizzaIndex + 1) % pizzaTypes.length
      : (currentPizzaIndex - 1 + pizzaTypes.length) % pizzaTypes.length
  const nextState = pizzaStates[nextIndex]

  // Easing function
  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  const easedProgress = easeInOutCubic(transitionProgress)

  // Current pizza exits while rotating around its Y-axis
  const currentX = isTransitioning
    ? transitionDirection === 'left'
      ? -6 * easedProgress
      : 6 * easedProgress
    : 0

  const currentRotation = isTransitioning
    ? transitionDirection === 'left'
      ? Math.PI * 2 * easedProgress
      : -Math.PI * 2 * easedProgress
    : 0

  // Next pizza enters from opposite side
  const nextX = isTransitioning
    ? transitionDirection === 'left'
      ? 6 - 6 * easedProgress
      : -6 + 6 * easedProgress
    : 0

  const nextRotation = isTransitioning
    ? transitionDirection === 'left'
      ? -Math.PI * 2 + Math.PI * 2 * easedProgress
      : Math.PI * 2 - Math.PI * 2 * easedProgress
    : 0

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 3, 5]} intensity={0.5} />
      <pointLight position={[0, 2, 3]} intensity={0.8} color="#fff5eb" />

      {/* Environment for reflections */}
      <Environment preset="studio" />

      {/* Current Pizza */}
      {currentState && (
        <Pizza
          pizza={currentState.pizza}
          position={[currentX, 0, 0]}
          rotation={currentRotation}
          toppings={currentState.toppings}
        />
      )}

      {/* Next Pizza (only visible during transition) */}
      {isTransitioning && nextState && (
        <Pizza
          pizza={nextState.pizza}
          position={[nextX, 0, 0]}
          rotation={nextRotation}
          toppings={nextState.toppings}
        />
      )}

      {/* Flying Ingredients */}
      {flyingIngredients.map((item) => (
        <FlyingIngredient
          key={item.id}
          ingredient={item.ingredient}
          startPosition={item.startPosition}
          targetPosition={item.targetPosition}
          onComplete={(pos) => onIngredientLanded(item.id, item.ingredient.id, pos)}
        />
      ))}
    </>
  )
}

interface PizzaSceneProps {
  onPizzaChange: (index: number) => void
  currentIndex: number
  onIngredientClick: (ingredient: Ingredient, iconRect: DOMRect) => void
}

export default function PizzaScene({ onPizzaChange, currentIndex, onIngredientClick }: PizzaSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitionDirection, setTransitionDirection] = useState<'left' | 'right' | null>(null)
  const [transitionProgress, setTransitionProgress] = useState(0)
  const animationRef = useRef<number | null>(null)

  // Initialize pizza states for all pizza types
  const [pizzaStates, setPizzaStates] = useState<PizzaState[]>(() =>
    pizzaTypes.map((pizza) => ({
      pizza,
      positionX: 0,
      rotation: 0,
      toppings: [],
    }))
  )

  const [flyingIngredients, setFlyingIngredients] = useState<FlyingItem[]>([])

  // Handle swipe
  const touchStartX = useRef<number | null>(null)
  const isDragging = useRef(false)

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (isTransitioning) return
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    touchStartX.current = clientX
    isDragging.current = true
  }

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging.current || touchStartX.current === null || isTransitioning) return

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX
    const diff = clientX - touchStartX.current
    const threshold = 50

    if (Math.abs(diff) > threshold) {
      const direction = diff < 0 ? 'left' : 'right'
      startTransition(direction)
    }

    touchStartX.current = null
    isDragging.current = false
  }

  const startTransition = useCallback(
    (direction: 'left' | 'right') => {
      if (isTransitioning) return

      setIsTransitioning(true)
      setTransitionDirection(direction)
      setTransitionProgress(0)

      const duration = 800 // ms
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        setTransitionProgress(progress)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          // Transition complete - update index
          const newIndex =
            direction === 'left'
              ? (currentIndex + 1) % pizzaTypes.length
              : (currentIndex - 1 + pizzaTypes.length) % pizzaTypes.length

          onPizzaChange(newIndex)
          setIsTransitioning(false)
          setTransitionDirection(null)
          setTransitionProgress(0)
        }
      }

      animationRef.current = requestAnimationFrame(animate)
    },
    [isTransitioning, currentIndex, onPizzaChange]
  )

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Add ingredient to pizza with flying animation
  const addFlyingIngredient = useCallback(
    (ingredient: Ingredient, iconRect: DOMRect) => {
      if (!containerRef.current) return

      const containerRect = containerRef.current.getBoundingClientRect()

      // Convert screen position to normalized device coordinates
      const iconCenterX = iconRect.left + iconRect.width / 2 - containerRect.left
      const iconCenterY = iconRect.top + iconRect.height / 2 - containerRect.top

      // Convert to Three.js coordinates
      const ndcX = (iconCenterX / containerRect.width) * 2 - 1
      const ndcY = -(iconCenterY / containerRect.height) * 2 + 1

      // Start position (from icon)
      const startPosition = new THREE.Vector3(ndcX * 4, ndcY * 3 - 1, 3)

      // Random position on pizza surface
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 1.4
      const targetPosition = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.15)

      const id = `flying-${Date.now()}-${Math.random()}`

      setFlyingIngredients((prev) => [
        ...prev,
        {
          id,
          ingredient,
          startPosition,
          targetPosition,
        },
      ])
    },
    []
  )

  // Handle ingredient landing on pizza
  const handleIngredientLanded = useCallback(
    (id: string, ingredientId: string, position: { x: number; y: number; z: number }) => {
      // Remove from flying ingredients
      setFlyingIngredients((prev) => prev.filter((item) => item.id !== id))

      // Add to current pizza's toppings
      setPizzaStates((prev) => {
        const newStates = [...prev]
        const currentState = newStates[currentIndex]
        const existingTopping = currentState.toppings.find((t) => t.ingredientId === ingredientId)

        if (existingTopping) {
          existingTopping.positions.push(position)
        } else {
          currentState.toppings.push({
            ingredientId,
            positions: [position],
          })
        }

        return newStates
      })
    },
    [currentIndex]
  )

  // Expose addFlyingIngredient to parent
  useEffect(() => {
    const handler = (ingredient: Ingredient, iconRect: DOMRect) => {
      addFlyingIngredient(ingredient, iconRect)
    }
    // Store the handler reference for parent to call
    if (onIngredientClick) {
      ;(window as unknown as { __pizzaAddIngredient: typeof handler }).__pizzaAddIngredient = handler
    }
  }, [addFlyingIngredient, onIngredientClick])

  return (
    <div
      ref={containerRef}
      className="w-full h-full cursor-grab active:cursor-grabbing"
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <Canvas shadows camera={{ position: [0, 0, 6], fov: 50 }}>
        <SceneContent
          currentPizzaIndex={currentIndex}
          isTransitioning={isTransitioning}
          transitionDirection={transitionDirection}
          transitionProgress={transitionProgress}
          pizzaStates={pizzaStates}
          flyingIngredients={flyingIngredients}
          onIngredientLanded={handleIngredientLanded}
        />
      </Canvas>
    </div>
  )
}
