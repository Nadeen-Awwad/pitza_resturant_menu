'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { pizzaTypes, type Ingredient } from '@/lib/pizza-data'
import IngredientPanel from './IngredientPanel'
import PizzaInfo from './PizzaInfo'

// Dynamically import the 3D scene to avoid SSR issues
const PizzaScene = dynamic(() => import('./PizzaScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Loading Pizza Studio...</p>
      </div>
    </div>
  ),
})

export default function PizzaConfigurator() {
  const [currentPizzaIndex, setCurrentPizzaIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const currentPizza = pizzaTypes[currentPizzaIndex]

  const handlePizzaChange = useCallback((newIndex: number) => {
    setCurrentPizzaIndex(newIndex)
    setIsTransitioning(false)
  }, [])

  const handleNavigate = useCallback(
    (direction: 'left' | 'right') => {
      if (isTransitioning) return

      setIsTransitioning(true)

      // Trigger the transition in the 3D scene
      const event = new CustomEvent('pizzaNavigate', { detail: { direction } })
      window.dispatchEvent(event)

      // Reset transition state after animation
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current)
      }
      transitionTimeoutRef.current = setTimeout(() => {
        setIsTransitioning(false)
      }, 850)
    },
    [isTransitioning]
  )

  const handleIngredientClick = useCallback((ingredient: Ingredient, iconRect: DOMRect) => {
    // Call the global function to add flying ingredient
    const handler = (window as unknown as { __pizzaAddIngredient?: (i: Ingredient, r: DOMRect) => void })
      .__pizzaAddIngredient
    if (handler) {
      handler(ingredient, iconRect)
    }
  }, [])

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/50" />

      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Pizza info header */}
      <PizzaInfo pizza={currentPizza} currentIndex={currentPizzaIndex} onNavigate={handleNavigate} />

      {/* 3D Pizza Scene */}
      <div className="absolute inset-0">
        <PizzaScene
          currentIndex={currentPizzaIndex}
          onPizzaChange={handlePizzaChange}
          onIngredientClick={handleIngredientClick}
        />
      </div>

      {/* Ingredient Panel */}
      <IngredientPanel pizza={currentPizza} onIngredientClick={handleIngredientClick} />

      {/* Swipe hint */}
      <div className="absolute bottom-32 left-1/2 -translate-x-1/2 text-muted-foreground/50 text-xs flex items-center gap-2">
        <span className="animate-pulse">{'<'}</span>
        <span>Swipe to change pizza</span>
        <span className="animate-pulse">{'>'}</span>
      </div>
    </div>
  )
}
