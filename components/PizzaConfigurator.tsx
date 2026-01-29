"use client"

import React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import {
  pizzaTypes,
  allIngredients,
  generatePiecePositions,
  type Ingredient,
} from "@/lib/pizza-data"
import { ChevronLeft, ChevronRight, Plus, ShoppingCart, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PlacedPiece {
  id: string
  ingredientId: string
  x: number
  y: number
  rotation: number
  size: number
}

interface FlyingPiece {
  id: string
  ingredientId: string
  startX: number
  startY: number
  endX: number
  endY: number
  size: number
  rotation: number
  delay: number
}

interface CartItem {
  pizzaId: string
  pizzaName: string
  basePrice: number
  addedIngredients: { id: string; name: string; price: number }[]
  totalPrice: number
}

export default function PizzaConfigurator() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [direction, setDirection] = useState<"left" | "right" | null>(null)
  const [placedPieces, setPlacedPieces] = useState<Record<string, PlacedPiece[]>>({})
  const [flyingPieces, setFlyingPieces] = useState<FlyingPiece[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [isBoxing, setIsBoxing] = useState(false)
  const [boxPhase, setBoxPhase] = useState<"none" | "appearing" | "pizza-entering" | "closing" | "closed" | "flying">("none")

  const pizzaRef = useRef<HTMLDivElement>(null)
  const cartIconRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef(0)

  const currentPizza = pizzaTypes[currentIndex]

  // Calculate total price including added ingredients
  const calculateTotalPrice = () => {
    const addedPieces = placedPieces[currentPizza.id] || []
    const uniqueIngredients = [...new Set(addedPieces.map((p) => p.ingredientId))]
    const ingredientsCost = uniqueIngredients.reduce((sum, ingId) => {
      return sum + (allIngredients[ingId]?.price || 0)
    }, 0)
    return currentPizza.basePrice + ingredientsCost
  }

  const navigatePizza = useCallback(
    (dir: "left" | "right") => {
      if (isTransitioning || isBoxing) return

      setDirection(dir)
      setIsTransitioning(true)

      setTimeout(() => {
        if (dir === "right") {
          setCurrentIndex((prev) => (prev + 1) % pizzaTypes.length)
        } else {
          setCurrentIndex((prev) => (prev - 1 + pizzaTypes.length) % pizzaTypes.length)
        }
        setDirection(null)
        setIsTransitioning(false)
      }, 500)
    },
    [isTransitioning, isBoxing]
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigatePizza("right")
      } else {
        navigatePizza("left")
      }
    }
  }

  const handleAddIngredient = (ingredient: Ingredient, buttonRect: DOMRect) => {
    if (!pizzaRef.current || isBoxing) return

    const pizzaRect = pizzaRef.current.getBoundingClientRect()
    const pizzaCenterX = pizzaRect.left + pizzaRect.width / 2
    const pizzaCenterY = pizzaRect.top + pizzaRect.height / 2
    const pizzaRadius = pizzaRect.width / 2

    // Generate positions for all pieces - within the circular pizza area
    const positions = generatePiecePositions(ingredient.pieceCount, pizzaRadius)

    // Create flying pieces for each position with staggered delays
    const newFlyingPieces: FlyingPiece[] = positions.map((pos, index) => ({
      id: `${ingredient.id}-${Date.now()}-${index}`,
      ingredientId: ingredient.id,
      startX: buttonRect.left + buttonRect.width / 2,
      startY: buttonRect.top + buttonRect.height / 2,
      endX: pizzaCenterX + pos.x,
      endY: pizzaCenterY + pos.y,
      size: ingredient.pieceSize + (Math.random() * 6 - 3), // Slight size variation
      rotation: ingredient.rotation ? pos.rotation : 0,
      delay: index * 60, // Stagger for sprinkle effect
    }))

    setFlyingPieces((prev) => [...prev, ...newFlyingPieces])
  }

  const handleFlyingComplete = (pieceId: string, piece: FlyingPiece) => {
    setFlyingPieces((prev) => prev.filter((p) => p.id !== pieceId))

    // Add to placed pieces
    const pizzaRect = pizzaRef.current?.getBoundingClientRect()
    if (!pizzaRect) return

    const relativeX = piece.endX - (pizzaRect.left + pizzaRect.width / 2)
    const relativeY = piece.endY - (pizzaRect.top + pizzaRect.height / 2)

    const newPlacedPiece: PlacedPiece = {
      id: pieceId,
      ingredientId: piece.ingredientId,
      x: relativeX,
      y: relativeY,
      rotation: piece.rotation,
      size: piece.size,
    }

    setPlacedPieces((prev) => ({
      ...prev,
      [currentPizza.id]: [...(prev[currentPizza.id] || []), newPlacedPiece],
    }))
  }

  const handleOrder = () => {
    if (isBoxing) return
    setIsBoxing(true)
    setBoxPhase("appearing")

    // Animation sequence:
    // 1. Box appears open (0-600ms)
    // 2. Pizza slides into box (600-1400ms)
    // 3. Box closes (1400-2200ms)
    // 4. Box flies to cart (2200-3000ms)
    
    setTimeout(() => setBoxPhase("pizza-entering"), 600)
    setTimeout(() => setBoxPhase("closing"), 1400)
    setTimeout(() => setBoxPhase("closed"), 2000)
    setTimeout(() => setBoxPhase("flying"), 2200)
    setTimeout(() => {
      // Add to cart
      const addedPieces = placedPieces[currentPizza.id] || []
      const uniqueIngredients = [...new Set(addedPieces.map((p) => p.ingredientId))]

      const cartItem: CartItem = {
        pizzaId: currentPizza.id,
        pizzaName: currentPizza.name,
        basePrice: currentPizza.basePrice,
        addedIngredients: uniqueIngredients.map((ingId) => ({
          id: ingId,
          name: allIngredients[ingId]?.name || ingId,
          price: allIngredients[ingId]?.price || 0,
        })),
        totalPrice: calculateTotalPrice(),
      }

      setCart((prev) => [...prev, cartItem])

      // Clear placed pieces for this pizza
      setPlacedPieces((prev) => ({
        ...prev,
        [currentPizza.id]: [],
      }))

      setIsBoxing(false)
      setBoxPhase("none")
      setShowCart(true)
    }, 3000)
  }

  const getTransformClass = () => {
    if (!direction) return "translate-x-0 rotate-0"
    if (direction === "right") return "-translate-x-[150%] -rotate-[360deg]"
    return "translate-x-[150%] rotate-[360deg]"
  }

  const currentPlacedPieces = placedPieces[currentPizza.id] || []
  const availableIngredients = currentPizza.availableIngredients
    .map((id) => allIngredients[id])
    .filter(Boolean)

  const totalPrice = calculateTotalPrice()
  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)

  // Get cart icon position for flying animation
  const getCartPosition = () => {
    if (cartIconRef.current) {
      const rect = cartIconRef.current.getBoundingClientRect()
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    }
    return { x: window.innerWidth - 40, y: 40 }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-border">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pizza Studio</h1>
          <p className="text-sm text-muted-foreground">Build your perfect pizza</p>
        </div>
        <Button
          ref={cartIconRef}
          variant="outline"
          size="icon"
          className="relative bg-transparent"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart className="w-5 h-5" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </Button>
      </header>

      {/* Pizza Display */}
      <div
        className="flex-1 flex items-center justify-center relative overflow-hidden px-4 py-6"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 z-10 bg-card/80 hover:bg-card shadow-lg"
          onClick={() => navigatePizza("left")}
          disabled={isTransitioning || isBoxing}
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 z-10 bg-card/80 hover:bg-card shadow-lg"
          onClick={() => navigatePizza("right")}
          disabled={isTransitioning || isBoxing}
        >
          <ChevronRight className="w-6 h-6" />
        </Button>

        {/* Pizza Container */}
        <div className="relative">
          {/* Pizza Box Animation */}
          {isBoxing && boxPhase !== "none" && (
            <BoxAnimation 
              phase={boxPhase} 
              cartPosition={getCartPosition()}
            />
          )}

          {/* Pizza */}
          <div
            ref={pizzaRef}
            className={`relative w-72 h-72 md:w-80 md:h-80 transition-all duration-500 ease-in-out ${getTransformClass()}`}
            style={{
              transform: boxPhase === "pizza-entering" || boxPhase === "closing" || boxPhase === "closed" || boxPhase === "flying"
                ? "scale(0.85) translateY(-20px)"
                : undefined,
              opacity: boxPhase === "closing" || boxPhase === "closed" || boxPhase === "flying" ? 0 : 1,
              transition: "all 0.6s ease-in-out",
            }}
          >
            <div className="relative w-full h-full rounded-full overflow-hidden shadow-2xl">
              <Image
                src={currentPizza.image || "/placeholder.svg"}
                alt={currentPizza.name}
                fill
                className="object-cover"
                priority
              />

              {/* Placed ingredient pieces - using individual piece images */}
              {currentPlacedPieces.map((piece) => {
                const ingredient = allIngredients[piece.ingredientId]
                if (!ingredient) return null
                return (
                  <div
                    key={piece.id}
                    className="absolute rounded-full overflow-hidden shadow-md pointer-events-none"
                    style={{
                      width: piece.size,
                      height: piece.size,
                      left: `calc(50% + ${piece.x}px - ${piece.size / 2}px)`,
                      top: `calc(50% + ${piece.y}px - ${piece.size / 2}px)`,
                      transform: `rotate(${piece.rotation}deg)`,
                    }}
                  >
                    <Image
                      src={ingredient.pieceImage || "/placeholder.svg"}
                      alt={ingredient.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pizza Info & Price */}
      <div className="text-center py-3 px-4">
        <h2 className="text-xl font-bold text-foreground">{currentPizza.name}</h2>
        <p className="text-sm text-muted-foreground">{currentPizza.description}</p>
        <div className="flex justify-center gap-2 mt-2">
          {pizzaTypes.map((_, index) => (
            <button
              key={index}
              onClick={() => !isTransitioning && !isBoxing && setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? "bg-primary w-4" : "bg-muted hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>
        <div className="mt-3 flex items-center justify-center gap-4">
          <span className="text-2xl font-bold text-primary">${totalPrice.toFixed(2)}</span>
          <Button onClick={handleOrder} disabled={isBoxing} className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Order Now
          </Button>
        </div>
      </div>

      {/* Ingredient Panel */}
      <div className="bg-card border-t border-border p-4">
        <h3 className="text-sm font-semibold text-muted-foreground mb-3 text-center uppercase tracking-wide">
          Add Toppings
        </h3>
        <div className="flex gap-3 overflow-x-auto pb-2 px-2 snap-x">
          {availableIngredients.map((ingredient) => (
            <button
              key={ingredient.id}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                handleAddIngredient(ingredient, rect)
              }}
              disabled={isBoxing}
              className="flex-shrink-0 flex flex-col items-center gap-1.5 p-2 rounded-xl bg-background hover:bg-accent transition-all group snap-center disabled:opacity-50"
            >
              <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-md group-hover:scale-110 transition-transform">
                <Image
                  src={ingredient.image || "/placeholder.svg"}
                  alt={ingredient.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              </div>
              <span className="text-xs text-foreground font-medium">{ingredient.name}</span>
              <span className="text-xs text-muted-foreground">+${ingredient.price.toFixed(2)}</span>
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                <Plus className="w-3 h-3 text-primary" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Flying Ingredients - using individual piece images */}
      {flyingPieces.map((piece) => {
        const ingredient = allIngredients[piece.ingredientId]
        if (!ingredient) return null
        return (
          <FlyingPieceComponent
            key={piece.id}
            piece={piece}
            ingredient={ingredient}
            onComplete={() => handleFlyingComplete(piece.id, piece)}
          />
        )
      })}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setShowCart(false)}
          />
          <div className="w-80 bg-card h-full shadow-2xl flex flex-col animate-in slide-in-from-right">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Your Cart</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Your cart is empty</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item, index) => (
                    <div key={index} className="bg-background rounded-lg p-3">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-foreground">{item.pizzaName}</h3>
                        <span className="font-bold text-primary">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Base: ${item.basePrice.toFixed(2)}
                      </p>
                      {item.addedIngredients.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">Extras:</p>
                          {item.addedIngredients.map((ing) => (
                            <p key={ing.id} className="text-xs text-muted-foreground pl-2">
                              + {ing.name} (${ing.price.toFixed(2)})
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-border">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-xl font-bold text-primary">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <Button className="w-full">Checkout</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Box Animation Component
function BoxAnimation({ 
  phase, 
  cartPosition 
}: { 
  phase: "appearing" | "pizza-entering" | "closing" | "closed" | "flying"
  cartPosition: { x: number; y: number }
}) {
  const getBoxStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: "absolute",
      inset: 0,
      zIndex: 30,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.6s ease-in-out",
    }

    if (phase === "flying") {
      return {
        ...baseStyle,
        transform: `translate(${cartPosition.x - window.innerWidth / 2}px, ${cartPosition.y - window.innerHeight / 2}px) scale(0.15)`,
        opacity: 0,
      }
    }

    return baseStyle
  }

  const getImageStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      transition: "all 0.6s ease-in-out",
    }

    if (phase === "appearing") {
      return { ...baseStyle, transform: "scale(0.8)", opacity: 0.5 }
    }
    if (phase === "pizza-entering") {
      return { ...baseStyle, transform: "scale(1.05)" }
    }
    return { ...baseStyle, transform: "scale(1)" }
  }

  return (
    <div style={getBoxStyle()}>
      <div className="relative w-80 h-80 md:w-96 md:h-96" style={getImageStyle()}>
        <Image
          src={phase === "closed" || phase === "flying" ? "/images/box-closed.jpg" : "/images/box-open.jpg"}
          alt="Pizza Box"
          fill
          className="object-contain"
          priority
        />
      </div>
    </div>
  )
}

// Flying Piece Component - uses pieceImage for realistic scattered look
function FlyingPieceComponent({
  piece,
  ingredient,
  onComplete,
}: {
  piece: FlyingPiece
  ingredient: Ingredient
  onComplete: () => void
}) {
  const [progress, setProgress] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    // Apply delay before starting animation
    const delayTimer = setTimeout(() => {
      setStarted(true)
    }, piece.delay)

    return () => clearTimeout(delayTimer)
  }, [piece.delay])

  useEffect(() => {
    if (!started) return

    const duration = 500 + Math.random() * 150 // Slight variation in speed
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const p = Math.min(elapsed / duration, 1)

      // Ease out cubic for natural landing
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(eased)

      if (p < 1) {
        requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }

    requestAnimationFrame(animate)
  }, [started, onComplete])

  if (!started) return null

  // Calculate position along a curved arc path
  const dx = piece.endX - piece.startX
  const dy = piece.endY - piece.startY

  // Add upward arc then down to pizza
  const arcHeight = -120 - Math.random() * 40

  const currentX = piece.startX + dx * progress
  const currentY = piece.startY + dy * progress + arcHeight * Math.sin(progress * Math.PI)

  // Scale: start small, grow, then settle
  const scale = progress < 0.3 
    ? 0.5 + progress * 1.5 
    : progress < 0.7 
      ? 1 + (progress - 0.3) * 0.25 
      : 1.1 - (progress - 0.7) * 0.3

  // Spin during flight
  const spinRotation = piece.rotation + progress * 540

  return (
    <div
      className="fixed pointer-events-none z-40 rounded-full overflow-hidden shadow-lg"
      style={{
        width: piece.size,
        height: piece.size,
        left: currentX - piece.size / 2,
        top: currentY - piece.size / 2,
        transform: `scale(${scale}) rotate(${spinRotation}deg)`,
        opacity: progress > 0.9 ? 1 - (progress - 0.9) * 5 : 1, // Fade slightly at end
      }}
    >
      <Image 
        src={ingredient.pieceImage || "/placeholder.svg"} 
        alt={ingredient.name} 
        fill 
        className="object-cover" 
      />
    </div>
  )
}
