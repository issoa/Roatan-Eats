export const categories = ["Food", "Drinks", "Seafood", "Pizza"];

export const restaurants = [
  {
    id: "beachers",
    name: "Beachers West Bay",
    category: "Food",
    rating: 4.7,
    deliveryFee: 3.0,
    eta: "25-35",
    image: "https://beachersroatan.com/wp-content/uploads/2020/02/beachers-roatan-west-bay.jpg",
    menu: [
      { id: "beach-burger", name: "Beach Burger", description: "Burger with fries", price: 9.5 },
      { id: "fish-tacos", name: "Fish Tacos", description: "Fresh island fish tacos", price: 10.5 },
      { id: "wings", name: "Chicken Wings", description: "Crispy wings with sauce", price: 8.5 },
    ],
  },
  {
    id: "argentinian-grill",
    name: "Argentinian Grill West Bay",
    category: "Food",
    rating: 4.8,
    deliveryFee: 3.5,
    eta: "30-40",
    image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900",
    menu: [
      { id: "grilled-steak", name: "Grilled Steak", description: "Argentinian style steak", price: 18 },
      { id: "empanadas", name: "Empanadas", description: "Beef pastries", price: 7 },
      { id: "choripan", name: "Choripán", description: "Sausage sandwich", price: 8 },
    ],
  },
  {
    id: "fosters-west-bay",
    name: "Foster's West Bay",
    category: "Seafood",
    rating: 4.6,
    deliveryFee: 3.0,
    eta: "25-35",
    image: "https://images.unsplash.com/photo-1544148103-0773bf10d330?w=900",
    menu: [
      { id: "grilled-fish", name: "Grilled Fish", description: "Fresh catch with sides", price: 14 },
      { id: "shrimp-plate", name: "Shrimp Plate", description: "Garlic shrimp with rice", price: 15 },
      { id: "lobster", name: "Lobster Tail", description: "Seasonal lobster tail", price: 24 },
    ],
  },
  {
    id: "caribe-tesoro",
    name: "Caribe Tesoro Sunset Grill",
    category: "Food",
    rating: 4.5,
    deliveryFee: 3.5,
    eta: "30-40",
    image: "https://images.unsplash.com/photo-1543352634-a1c51d9f1fa7?w=900",
    menu: [
      { id: "caribbean-tacos", name: "Caribbean Tacos", description: "Shrimp, chicken, or fish tacos", price: 9 },
      { id: "tesoro-burger", name: "Tesoro Burger", description: "Burger with island fries", price: 12 },
      { id: "chicken-sandwich", name: "Chicken Sandwich", description: "Chicken sandwich with fries", price: 8 },
    ],
  },
  {
    id: "pizza-roatan",
    name: "Pizza Roatan West Bay",
    category: "Pizza",
    rating: 4.4,
    deliveryFee: 3.0,
    eta: "25-35",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=900",
    menu: [
      { id: "pepperoni", name: "Pepperoni Pizza", description: "Classic pepperoni pizza", price: 12 },
      { id: "veggie", name: "Veggie Pizza", description: "Mixed vegetables", price: 11 },
      { id: "cheese", name: "Cheese Pizza", description: "Classic cheese pizza", price: 10 },
    ],
  },
];