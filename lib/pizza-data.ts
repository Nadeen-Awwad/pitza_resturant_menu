export interface Ingredient {
  id: string
  name: string
  nameAr: string
  image: string // Icon image for the panel (shows group/pile)
  pieceImage: string // Individual piece image for scattering on pizza
  price: number
  pieceCount: number // Number of pieces to scatter
  pieceSize: number // Size in pixels
  rotation: boolean // Whether pieces should rotate randomly
}

export interface PizzaType {
  id: string
  name: string
  nameAr: string
  description: string
  descriptionAr: string
  image: string
  basePrice: number
  existingIngredients: string[]
  availableIngredients: string[]
}

// All available ingredients with realistic images
export const allIngredients: Record<string, Ingredient> = {
  pepperoni: {
    id: "pepperoni",
    name: "Pepperoni",
    nameAr: "بيبروني",
    image: "/images/ingredients/pepperoni.jpg",
    pieceImage: "/images/pieces/pepperoni-piece.jpg",
    price: 2.5,
    pieceCount: 8,
    pieceSize: 32,
    rotation: true,
  },
  mushroom: {
    id: "mushroom",
    name: "Mushrooms",
    nameAr: "فطر",
    image: "/images/ingredients/mushroom.jpg",
    pieceImage: "/images/pieces/mushroom-piece.jpg",
    price: 1.5,
    pieceCount: 7,
    pieceSize: 26,
    rotation: true,
  },
  onion: {
    id: "onion",
    name: "Onion",
    nameAr: "بصل",
    image: "/images/ingredients/onion.jpg",
    pieceImage: "/images/pieces/onion-piece.jpg",
    price: 1.0,
    pieceCount: 8,
    pieceSize: 24,
    rotation: true,
  },
  corn: {
    id: "corn",
    name: "Sweet Corn",
    nameAr: "ذرة",
    image: "/images/ingredients/corn.jpg",
    pieceImage: "/images/pieces/corn-piece.jpg",
    price: 1.0,
    pieceCount: 18,
    pieceSize: 12,
    rotation: false,
  },
  olives: {
    id: "olives",
    name: "Black Olives",
    nameAr: "زيتون اسود",
    image: "/images/ingredients/olives.jpg",
    pieceImage: "/images/pieces/olive-piece.jpg",
    price: 1.5,
    pieceCount: 9,
    pieceSize: 20,
    rotation: true,
  },
  pepper: {
    id: "pepper",
    name: "Bell Peppers",
    nameAr: "فلفل حلو",
    image: "/images/ingredients/pepper.jpg",
    pieceImage: "/images/pieces/pepper-piece.jpg",
    price: 1.5,
    pieceCount: 8,
    pieceSize: 28,
    rotation: true,
  },
  bacon: {
    id: "bacon",
    name: "Bacon",
    nameAr: "لحم مقدد",
    image: "/images/ingredients/bacon.jpg",
    pieceImage: "/images/pieces/bacon-piece.jpg",
    price: 3.0,
    pieceCount: 6,
    pieceSize: 30,
    rotation: true,
  },
  pineapple: {
    id: "pineapple",
    name: "Pineapple",
    nameAr: "اناناس",
    image: "/images/ingredients/pineapple.jpg",
    pieceImage: "/images/pieces/pineapple-piece.jpg",
    price: 2.0,
    pieceCount: 7,
    pieceSize: 22,
    rotation: true,
  },
  basil: {
    id: "basil",
    name: "Fresh Basil",
    nameAr: "ريحان طازج",
    image: "/images/ingredients/basil.jpg",
    pieceImage: "/images/pieces/basil-piece.jpg",
    price: 1.0,
    pieceCount: 5,
    pieceSize: 22,
    rotation: true,
  },
  ham: {
    id: "ham",
    name: "Ham",
    nameAr: "لحم",
    image: "/images/ingredients/ham.jpg",
    pieceImage: "/images/pieces/ham-piece.jpg",
    price: 2.5,
    pieceCount: 5,
    pieceSize: 34,
    rotation: true,
  },
  sausage: {
    id: "sausage",
    name: "Italian Sausage",
    nameAr: "سجق ايطالي",
    image: "/images/ingredients/sausage.jpg",
    pieceImage: "/images/pieces/sausage-piece.jpg",
    price: 2.5,
    pieceCount: 8,
    pieceSize: 22,
    rotation: true,
  },
  mozzarella: {
    id: "mozzarella",
    name: "Extra Mozzarella",
    nameAr: "جبنة موزاريلا اضافية",
    image: "/images/ingredients/mozzarella.jpg",
    pieceImage: "/images/pieces/mozzarella-piece.jpg",
    price: 2.0,
    pieceCount: 6,
    pieceSize: 26,
    rotation: true,
  },
}

export const pizzaTypes: PizzaType[] = [
  {
    id: "margherita",
    name: "Margherita",
    nameAr: "مارغريتا",
    description: "Classic tomato, mozzarella & fresh basil",
    descriptionAr: "طماطم كلاسيكية، موزاريلا وريحان طازج",
    image: "/images/pizza-margherita.jpg",
    basePrice: 12.99,
    existingIngredients: ["basil", "mozzarella"],
    availableIngredients: ["pepperoni", "mushroom", "onion", "olives", "pepper"],
  },
  {
    id: "pepperoni",
    name: "Pepperoni",
    nameAr: "بيبروني",
    description: "Loaded with spicy pepperoni slices",
    descriptionAr: "محملة بشرائح البيبروني الحارة",
    image: "/images/pizza-pepperoni.jpg",
    basePrice: 14.99,
    existingIngredients: ["pepperoni", "mozzarella"],
    availableIngredients: ["mushroom", "onion", "olives", "pepper", "bacon"],
  },
  {
    id: "veggie",
    name: "Veggie Supreme",
    nameAr: "خضار سوبريم",
    description: "Fresh vegetables on a bed of cheese",
    descriptionAr: "خضروات طازجة على سرير من الجبنة",
    image: "/images/pizza-veggie.jpg",
    basePrice: 13.99,
    existingIngredients: ["mushroom", "pepper", "onion"],
    availableIngredients: ["corn", "olives", "basil", "pineapple", "mozzarella"],
  },
  {
    id: "meat-lovers",
    name: "Meat Lovers",
    nameAr: "عشاق اللحوم",
    description: "For the ultimate carnivore",
    descriptionAr: "للعشاق الحقيقيين للحوم",
    image: "/images/pizza-meat.jpg",
    basePrice: 16.99,
    existingIngredients: ["pepperoni", "bacon", "sausage"],
    availableIngredients: ["ham", "onion", "pepper", "olives", "mozzarella"],
  },
  {
    id: "hawaiian",
    name: "Hawaiian",
    nameAr: "هاواي",
    description: "Ham & pineapple tropical twist",
    descriptionAr: "لحم وأناناس بلمسة استوائية",
    image: "/images/pizza-hawaiian.jpg",
    basePrice: 14.99,
    existingIngredients: ["ham", "pineapple"],
    availableIngredients: ["bacon", "corn", "pepper", "onion", "mozzarella"],
  },
]

// Generate random positions for ingredient pieces WITHIN the pizza circle
export function generatePiecePositions(
  pieceCount: number,
  pizzaRadius: number
): { x: number; y: number; rotation: number }[] {
  const positions: { x: number; y: number; rotation: number }[] = []
  const usedPositions: { x: number; y: number }[] = []
  const innerRadius = pizzaRadius * 0.7 // Keep pieces well within pizza bounds

  for (let i = 0; i < pieceCount; i++) {
    let attempts = 0
    let x: number = 0
    let y: number = 0

    do {
      // Random angle and distance from center
      const angle = Math.random() * Math.PI * 2
      const distance = Math.random() * innerRadius

      x = Math.cos(angle) * distance
      y = Math.sin(angle) * distance
      attempts++
    } while (
      attempts < 100 &&
      usedPositions.some(
        (pos) => Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2) < 20
      )
    )

    usedPositions.push({ x, y })
    positions.push({
      x,
      y,
      rotation: Math.random() * 360,
    })
  }

  return positions
}
