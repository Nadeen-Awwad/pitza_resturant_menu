'use client'

import { useEffect, useState } from 'react'
import type { PizzaType } from '@/lib/pizza-data'
import { pizzaTypes } from '@/lib/pizza-data'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PizzaInfoProps {
  pizza: PizzaType
  currentIndex: number
  onNavigate: (direction: 'left' | 'right') => void
}

export default function PizzaInfo({ pizza, currentIndex, onNavigate }: PizzaInfoProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayedPizza, setDisplayedPizza] = useState(pizza)

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => {
      setDisplayedPizza(pizza)
      setIsAnimating(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [pizza])

  return (
    <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
      <div className="text-center">
        {/* Navigation arrows */}
        <div className="flex items-center justify-center gap-6 mb-4">
          <button
            onClick={() => onNavigate('right')}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-secondary transition-colors"
            aria-label="Previous pizza"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          {/* Pizza indicators */}
          <div className="flex items-center gap-2">
            {pizzaTypes.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'bg-primary w-4' : 'bg-muted-foreground/40'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => onNavigate('left')}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-secondary transition-colors"
            aria-label="Next pizza"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Pizza info */}
        <div
          className={`transition-all duration-300 ${
            isAnimating ? 'opacity-0 transform -translate-y-2' : 'opacity-100 transform translate-y-0'
          }`}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2 text-balance">{displayedPizza.name}</h1>
          <p className="text-muted-foreground text-sm">{displayedPizza.description}</p>
        </div>
      </div>
    </div>
  )
}
