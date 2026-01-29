'use client'

import { useRef } from 'react'
import type { Ingredient, PizzaType } from '@/lib/pizza-data'
import { cn } from '@/lib/utils'

interface IngredientPanelProps {
  pizza: PizzaType
  onIngredientClick: (ingredient: Ingredient, iconRect: DOMRect) => void
}

// SVG icons for realistic ingredient representations
function IngredientIcon({ ingredient }: { ingredient: Ingredient }) {
  switch (ingredient.shape) {
    case 'pepperoni':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <circle cx="20" cy="20" r="16" fill={ingredient.color} />
          <circle cx="14" cy="14" r="2" fill={ingredient.secondaryColor || '#4a0000'} opacity="0.6" />
          <circle cx="24" cy="12" r="1.5" fill={ingredient.secondaryColor || '#4a0000'} opacity="0.6" />
          <circle cx="26" cy="22" r="2" fill={ingredient.secondaryColor || '#4a0000'} opacity="0.6" />
          <circle cx="16" cy="26" r="1.5" fill={ingredient.secondaryColor || '#4a0000'} opacity="0.6" />
          <circle cx="20" cy="18" r="1" fill={ingredient.secondaryColor || '#4a0000'} opacity="0.5" />
        </svg>
      )
    case 'mushroom':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <ellipse cx="20" cy="18" rx="12" ry="8" fill={ingredient.color} />
          <rect x="17" y="18" width="6" height="12" rx="2" fill="#f5f5f4" />
          <path d="M12 18 Q20 10 28 18" fill="none" stroke={ingredient.secondaryColor || '#a8a29e'} strokeWidth="1" />
        </svg>
      )
    case 'olive':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <circle cx="20" cy="20" r="12" fill={ingredient.color} />
          <circle cx="20" cy="20" r="5" fill="#1a1a1a" />
          <ellipse cx="16" cy="16" rx="3" ry="2" fill="#3f3f46" opacity="0.5" />
        </svg>
      )
    case 'corn':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <circle cx="12" cy="14" r="4" fill={ingredient.color} />
          <circle cx="22" cy="12" r="4" fill={ingredient.secondaryColor || '#f59e0b'} />
          <circle cx="28" cy="20" r="4" fill={ingredient.color} />
          <circle cx="18" cy="22" r="4" fill={ingredient.secondaryColor || '#f59e0b'} />
          <circle cx="10" cy="26" r="4" fill={ingredient.color} />
          <circle cx="26" cy="30" r="4" fill={ingredient.secondaryColor || '#f59e0b'} />
        </svg>
      )
    case 'pepper':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <path
            d="M8 20 C8 12, 16 8, 20 8 C24 8, 32 12, 32 20 C32 28, 24 32, 20 32 C16 32, 8 28, 8 20"
            fill={ingredient.color}
          />
          <path d="M18 8 L20 4 L22 8" fill="#16a34a" />
          <path d="M12 16 Q20 20 28 16" fill="none" stroke={ingredient.secondaryColor || '#15803d'} strokeWidth="2" opacity="0.5" />
        </svg>
      )
    case 'onion':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <circle cx="20" cy="20" r="14" fill="none" stroke={ingredient.color} strokeWidth="4" />
          <circle cx="20" cy="20" r="9" fill="none" stroke={ingredient.secondaryColor || '#fecaca'} strokeWidth="3" />
          <circle cx="20" cy="20" r="4" fill="none" stroke={ingredient.color} strokeWidth="2" opacity="0.7" />
        </svg>
      )
    case 'bacon':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <path
            d="M4 15 Q10 10, 16 15 Q22 20, 28 15 Q34 10, 36 15 L36 25 Q34 30, 28 25 Q22 20, 16 25 Q10 30, 4 25 Z"
            fill={ingredient.color}
          />
          <path
            d="M6 18 Q12 14, 18 18 Q24 22, 30 18"
            fill="none"
            stroke={ingredient.secondaryColor || '#dc2626'}
            strokeWidth="3"
          />
        </svg>
      )
    case 'pineapple':
      return (
        <svg viewBox="0 0 40 40" className="w-full h-full">
          <rect x="8" y="12" width="24" height="20" rx="2" fill={ingredient.color} />
          <circle cx="14" cy="18" r="2" fill={ingredient.secondaryColor || '#a16207'} opacity="0.6" />
          <circle cx="26" cy="18" r="2" fill={ingredient.secondaryColor || '#a16207'} opacity="0.6" />
          <circle cx="20" cy="22" r="2" fill={ingredient.secondaryColor || '#a16207'} opacity="0.6" />
          <circle cx="14" cy="26" r="2" fill={ingredient.secondaryColor || '#a16207'} opacity="0.6" />
          <circle cx="26" cy="26" r="2" fill={ingredient.secondaryColor || '#a16207'} opacity="0.6" />
          <path d="M16 12 L20 4 L24 12" fill="#16a34a" />
        </svg>
      )
    default:
      return (
        <div className="w-full h-full rounded-full" style={{ backgroundColor: ingredient.color }} />
      )
  }
}

export default function IngredientPanel({ pizza, onIngredientClick }: IngredientPanelProps) {
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  const handleClick = (ingredient: Ingredient) => {
    const button = buttonRefs.current.get(ingredient.id)
    if (button) {
      const rect = button.getBoundingClientRect()
      onIngredientClick(ingredient, rect)
    }
  }

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
      <div className="bg-card/90 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-border">
        <p className="text-xs text-muted-foreground text-center mb-3 uppercase tracking-wider">
          Tap to add toppings
        </p>
        <div className="flex items-center justify-center gap-4">
          {pizza.ingredients.map((ingredient) => (
            <button
              key={ingredient.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(ingredient.id, el)
              }}
              onClick={() => handleClick(ingredient)}
              className={cn(
                'group flex flex-col items-center gap-2 p-3 rounded-xl',
                'transition-all duration-200 hover:scale-110 hover:bg-secondary/50',
                'active:scale-95 cursor-pointer'
              )}
            >
              <div className="w-12 h-12 relative">
                <IngredientIcon ingredient={ingredient} />
              </div>
              <span className="text-xs font-medium text-foreground/80 group-hover:text-foreground">
                {ingredient.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
