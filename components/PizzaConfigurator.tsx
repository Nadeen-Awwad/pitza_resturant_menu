"use client"

import React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import {
  pizzaTypes,
  allIngredients,
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
  size: PizzaSize
  addedIngredients: { id: string; name: string; price: number }[]
  totalPrice: number
}

type PizzaSize = "small" | "medium" | "large"

const sizeConfig = {
  small: { label: "S", scale: 0.75, priceMultiplier: 0.8 },
  medium: { label: "M", scale: 1.0, priceMultiplier: 1.0 },
  large: { label: "L", scale: 1.25, priceMultiplier: 1.3 },
}

export default function PizzaConfigurator() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [direction, setDirection] = useState<"left" | "right" | null>(null)
  const [placedPieces, setPlacedPieces] = useState<Record<string, PlacedPiece[]>>({})
  const [addedIngredients, setAddedIngredients] = useState<Record<string, Set<string>>>({})
  const [flyingPieces, setFlyingPieces] = useState<FlyingPiece[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [isBoxing, setIsBoxing] = useState(false)
  const [boxPhase, setBoxPhase] = useState<"none" | "appearing" | "pizza-entering" | "closing" | "closed" | "flying">("none")
  const [selectedSize, setSelectedSize] = useState<PizzaSize>("medium")

  const pizzaRef = useRef<HTMLDivElement>(null)
  const cartIconRef = useRef<HTMLButtonElement>(null)
  const pieceCounter = useRef(0)

  const currentPizza = pizzaTypes[currentIndex]

  // Calculate total price including added ingredients and size multiplier
  const calculateTotalPrice = () => {
    const ingredients = addedIngredients[currentPizza.id] || new Set()
    const ingredientsCost = Array.from(ingredients).reduce((sum, ingId) => {
      return sum + (allIngredients[ingId]?.price || 0)
    }, 0)
    return (currentPizza.basePrice + ingredientsCost) * sizeConfig[selectedSize].priceMultiplier
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

  const handleTouchStart = useRef(0)

  const onTouchStart = (e: React.TouchEvent) => {
    handleTouchStart.current = e.touches[0].clientX
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = handleTouchStart.current - touchEndX

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

    const currentIngredients = addedIngredients[currentPizza.id] || new Set()
    if (currentIngredients.has(ingredient.id)) {
      return
    }

    const pizzaRect = pizzaRef.current.getBoundingClientRect()
    const pizzaCenterX = pizzaRect.left + pizzaRect.width / 2
    const pizzaCenterY = pizzaRect.top + pizzaRect.height / 2
    
    // حساب نصف القطر للبيتزا المتوسطة (الحجم الأساسي)
    const baseRadius = (pizzaRect.width / 2) / sizeConfig[selectedSize].scale
    // استخدام 55% فقط من نصف القطر لضمان البقاء داخل الحدود
    const safeRadius = baseRadius * 0.55
    
    // حجم القطعة الأساسي (بدون تكبير)
    const basePieceSize = ingredient.pieceSize
    const pieceHalfSize = basePieceSize / 2

    const newFlyingPieces: FlyingPiece[] = []
    
    for (let i = 0; i < ingredient.pieceCount; i++) {
      pieceCounter.current += 1
      
      const angle = Math.random() * Math.PI * 2
      const distance = Math.sqrt(Math.random()) * (safeRadius - pieceHalfSize)
      
      // المواقع النسبية (بدون تكبير)
      const x = Math.cos(angle) * distance
      const y = Math.sin(angle) * distance
      
      // لكن للعرض المؤقت نستخدم الحجم الحالي
      const currentScale = sizeConfig[selectedSize].scale
      
      newFlyingPieces.push({
        id: `${ingredient.id}-${pieceCounter.current}`,
        ingredientId: ingredient.id,
        startX: buttonRect.left + buttonRect.width / 2,
        startY: buttonRect.top + buttonRect.height / 2,
        endX: pizzaCenterX + (x * currentScale),
        endY: pizzaCenterY + (y * currentScale),
        size: basePieceSize * currentScale,
        rotation: Math.random() * 360,
        delay: i * 60,
      })
    }

    setAddedIngredients((prev) => {
      const newSet = new Set(prev[currentPizza.id] || [])
      newSet.add(ingredient.id)
      return {
        ...prev,
        [currentPizza.id]: newSet,
      }
    })

    setFlyingPieces((prev) => [...prev, ...newFlyingPieces])
  }

  const handleFlyingComplete = (pieceId: string, piece: FlyingPiece) => {
    setFlyingPieces((prev) => prev.filter((p) => p.id !== pieceId))

    const pizzaRect = pizzaRef.current?.getBoundingClientRect()
    if (!pizzaRect) return

    const currentScale = sizeConfig[selectedSize].scale
    
    // حساب الموقع النسبي (بدون تكبير)
    const relativeX = (piece.endX - (pizzaRect.left + pizzaRect.width / 2)) / currentScale
    const relativeY = (piece.endY - (pizzaRect.top + pizzaRect.height / 2)) / currentScale

    const newPlacedPiece: PlacedPiece = {
      id: pieceId,
      ingredientId: piece.ingredientId,
      x: relativeX,
      y: relativeY,
      rotation: piece.rotation,
      size: piece.size / currentScale, // حفظ الحجم الأساسي
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
    
    setTimeout(() => setBoxPhase("pizza-entering"), 600)
    setTimeout(() => setBoxPhase("closing"), 1400)
    setTimeout(() => setBoxPhase("closed"), 2000)
    setTimeout(() => setBoxPhase("flying"), 2200)
    setTimeout(() => {
      const ingredients = addedIngredients[currentPizza.id] || new Set()

      const cartItem: CartItem = {
        pizzaId: currentPizza.id,
        pizzaName: currentPizza.name,
        basePrice: currentPizza.basePrice,
        size: selectedSize,
        addedIngredients: Array.from(ingredients).map((ingId) => ({
          id: ingId,
          name: allIngredients[ingId]?.name || ingId,
          price: allIngredients[ingId]?.price || 0,
        })),
        totalPrice: calculateTotalPrice(),
      }

      setCart((prev) => [...prev, cartItem])

      // مسح القطع والمكونات المضافة لهذه البيتزا
      setPlacedPieces((prev) => ({
        ...prev,
        [currentPizza.id]: [],
      }))
      
      setAddedIngredients((prev) => ({
        ...prev,
        [currentPizza.id]: new Set(),
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
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
              pizzaRef={pizzaRef}
              pizzaSize={selectedSize}
            />
          )}

          {/* Pizza */}
          <div
            ref={pizzaRef}
            className={`relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[28rem] lg:h-[28rem] transition-all duration-500 ease-in-out ${getTransformClass()}`}
            style={{
              transform: boxPhase === "pizza-entering" || boxPhase === "closing" || boxPhase === "closed" || boxPhase === "flying"
                ? `scale(${0.85 * sizeConfig[selectedSize].scale}) translateY(-20px)`
                : `scale(${sizeConfig[selectedSize].scale})`,
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
                // المواقع والحجم يتكبران معاً مع البيتزا
                const scaledSize = piece.size * sizeConfig[selectedSize].scale
                const scaledX = piece.x * sizeConfig[selectedSize].scale
                const scaledY = piece.y * sizeConfig[selectedSize].scale
                return (
                  <div
                    key={piece.id}
                    className="absolute rounded-full overflow-hidden pointer-events-none transition-all duration-300"
                    style={{
                      width: scaledSize,
                      height: scaledSize,
                      left: `calc(50% + ${scaledX}px - ${scaledSize / 2}px)`,
                      top: `calc(50% + ${scaledY}px - ${scaledSize / 2}px)`,
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

      {/* Size Selector */}
      <div className="py-3 px-4">
        <div className="flex justify-center gap-3">
          {(Object.keys(sizeConfig) as PizzaSize[]).map((size) => (
            <button
              key={size}
              onClick={() => !isBoxing && setSelectedSize(size)}
              disabled={isBoxing}
              className={`
                px-6 py-2.5 rounded-full font-semibold transition-all duration-300
                ${selectedSize === size 
                  ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                  : "bg-muted text-muted-foreground hover:bg-muted-foreground/20 hover:scale-105"
                }
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg">{sizeConfig[size].label}</span>
                <span className="text-xs opacity-75">
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </span>
              </div>
            </button>
          ))}
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
        <div className="flex gap-3 overflow-x-auto pb-2 px-2 snap-x scrollbar-hide">
          {availableIngredients.map((ingredient) => {
            const isAdded = (addedIngredients[currentPizza.id] || new Set()).has(ingredient.id)
            return (
              <button
                key={ingredient.id}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  handleAddIngredient(ingredient, rect)
                }}
                disabled={isBoxing || isAdded}
                className={`flex-shrink-0 flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl transition-all group snap-center min-w-[100px] ${
                  isAdded 
                    ? "bg-primary/10 opacity-60 cursor-not-allowed" 
                    : "bg-background hover:bg-accent"
                }`}
              >
                <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-md transition-transform group-hover:scale-110">
                  <Image
                    src={ingredient.image || "/placeholder.svg"}
                    alt={ingredient.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  {isAdded && (
                    <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-foreground" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium text-center ${isAdded ? "text-primary" : "text-foreground"}`}>
                  {ingredient.name}
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  {isAdded ? "Added" : `+$${ingredient.price.toFixed(2)}`}
                </span>
                {!isAdded && (
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                    <Plus className="w-3 h-3 text-primary" />
                  </div>
                )}
              </button>
            )
          })}
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
                        <div>
                          <h3 className="font-semibold text-foreground">{item.pizzaName}</h3>
                          <span className="text-xs text-muted-foreground">
                            Size: {item.size.charAt(0).toUpperCase() + item.size.slice(1)}
                          </span>
                        </div>
                        <span className="font-bold text-primary">
                          ${item.totalPrice.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Base: ${item.basePrice.toFixed(2)} × {sizeConfig[item.size].priceMultiplier}
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

// Simple Box Animation Component using CSS
function BoxAnimation({ 
  phase, 
  cartPosition,
  pizzaRef,
  pizzaSize,
}: { 
  phase: "appearing" | "pizza-entering" | "closing" | "closed" | "flying"
  cartPosition: { x: number; y: number }
  pizzaRef: React.RefObject<HTMLDivElement>
  pizzaSize: PizzaSize
}) {
  const [pizzaPosition, setPizzaPosition] = useState({ x: 0, y: 0, width: 0, height: 0 })

  // حساب موقع وحجم البيتزا
  useEffect(() => {
    if (pizzaRef.current) {
      const rect = pizzaRef.current.getBoundingClientRect()
      setPizzaPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height,
      })
    }
  }, [pizzaRef, pizzaSize, phase])

  const getContainerStyle = (): React.CSSProperties => {
    if (phase === "flying") {
      // الطيران إلى السلة
      return {
        position: "fixed",
        left: pizzaPosition.x,
        top: pizzaPosition.y,
        transform: `translate(-50%, -50%) translate(${cartPosition.x - pizzaPosition.x}px, ${cartPosition.y - pizzaPosition.y}px) scale(0.1)`,
        transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: 0,
        zIndex: 50,
        pointerEvents: "none",
      }
    }

    if (phase === "appearing") {
      // النزول من فوق
      return {
        position: "fixed",
        left: pizzaPosition.x,
        top: pizzaPosition.y,
        transform: "translate(-50%, -50%) translateY(-120vh)",
        transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: 15, // تحت البيتزا
        pointerEvents: "none",
      }
    }

    // المراحل الأخرى: في مكان البيتزا
    return {
      position: "fixed",
      left: pizzaPosition.x,
      top: pizzaPosition.y,
      transform: "translate(-50%, -50%)",
      transition: "all 0.6s ease-in-out",
      zIndex: 15, // تحت البيتزا
      pointerEvents: "none",
    }
  }

  // حساب حجم الكرتونة - أكبر من البيتزا شوي
  const boxSize = Math.max(pizzaPosition.width, pizzaPosition.height) * 0.9

  // الغطاء العلوي - دوران
  const getLidTransform = () => {
    if (phase === "appearing" || phase === "pizza-entering") {
      return "perspective(800px) rotateX(-120deg)" // مفتوح للخلف
    }
    return "perspective(800px) rotateX(0deg)" // مقفول
  }

  return (
    <div style={getContainerStyle()}>
      <div 
        className="relative"
        style={{
          width: boxSize,
          height: boxSize,
        }}
      >
        {/* قاعدة الكرتونة المربعة */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-[#d4a574] to-[#b8875a] rounded-lg shadow-2xl border-4 border-[#a67c52]"
          style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 -2px 10px rgba(0,0,0,0.2)",
          }}
        >
          {/* خطوط الكرتونة للواقعية */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-full relative">
              {/* خط عمودي */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8b6f47] opacity-40 -translate-x-1/2" />
              {/* خط أفقي */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#8b6f47] opacity-40 -translate-y-1/2" />
              
              {/* زوايا الكرتونة */}
              <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-[#8b6f47] opacity-50" />
              <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-[#8b6f47] opacity-50" />
              <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-[#8b6f47] opacity-50" />
              <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-[#8b6f47] opacity-50" />
            </div>
          </div>

          {/* جوانب الكرتونة - تأثير 3D */}
          <div className="absolute -left-1 top-2 bottom-2 w-3 bg-[#9d7a52] rounded-l" 
               style={{ transform: "skewY(-2deg)" }} />
          <div className="absolute -right-1 top-2 bottom-2 w-3 bg-[#9d7a52] rounded-r" 
               style={{ transform: "skewY(2deg)" }} />
        </div>

        {/* الغطاء العلوي المربع */}
        <div 
          className="absolute left-0 right-0 origin-bottom"
          style={{
            height: boxSize * 0.15,
            bottom: boxSize * 0.5,
            transform: getLidTransform(),
            transformStyle: "preserve-3d",
            transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <div 
            className="w-full h-full bg-gradient-to-br from-[#d4a574] to-[#b8875a] rounded-t-lg shadow-2xl border-4 border-[#a67c52] border-b-0 relative"
            style={{
              boxShadow: "0 -10px 30px rgba(0,0,0,0.3), inset 0 2px 10px rgba(0,0,0,0.2)",
            }}
          >
            {/* خطوط الغطاء */}
            <div className="absolute inset-0">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-[#8b6f47] opacity-40 -translate-x-1/2" />
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#8b6f47] opacity-40 -translate-y-1/2" />
            </div>

            {/* شعار على الغطاء - يظهر فقط لما تقفل */}
            {(phase === "closed" || phase === "flying") && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-[oklch(0.65_0.18_35)] rounded-full w-24 h-24 flex items-center justify-center shadow-lg"
                     style={{
                       boxShadow: "0 4px 15px rgba(220, 38, 38, 0.5)",
                     }}>
                  <div className="text-center">
                    <div className="text-white font-bold text-xl tracking-wider">PIZZA</div>
                    <div className="text-white text-xs mt-0.5">Fresh &amp; Hot</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
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

  // Calculate position along a curved arc path with random variation
  const dx = piece.endX - piece.startX
  const dy = piece.endY - piece.startY

  // Add upward arc then down to pizza with slight random variation
  const arcHeight = -120 - Math.random() * 60
  const lateralDrift = (Math.random() - 0.5) * 30 // Small random sideways drift

  const currentX = piece.startX + dx * progress + lateralDrift * Math.sin(progress * Math.PI)
  const currentY = piece.startY + dy * progress + arcHeight * Math.sin(progress * Math.PI)

  // Scale: start small, grow, then settle
  const scale = progress < 0.3 
    ? 0.5 + progress * 1.5 
    : progress < 0.7 
      ? 1 + (progress - 0.3) * 0.25 
      : 1.1 - (progress - 0.7) * 0.3

  // Spin during flight with random tumbling
  const baseRotation = Math.random() * 360 // Random starting rotation
  const tumbleSpeed = (Math.random() * 720 + 360) * (Math.random() > 0.5 ? 1 : -1) // Random tumble speed and direction
  const spinRotation = baseRotation + progress * tumbleSpeed

  return (
    <div
      className="fixed pointer-events-none z-40 rounded-full overflow-hidden"
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