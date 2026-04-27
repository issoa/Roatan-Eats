export const categories = ["Food", "Drinks"];

export const restaurants = [
  {
    id: "beachers",
    name: "Beachers",
    category: "Food",
    rating: 4.7,
    deliveryFee: 3.0,
    eta: "25-35",
    menu: [
      { id: "burger", name: "Beach Burger", description: "Juicy beef burger with fries", price: 9.5 },
      { id: "wings", name: "Chicken Wings", description: "Crispy wings with sauce", price: 8.0 },
      { id: "nachos", name: "Loaded Nachos", description: "Cheese, beef, jalapeños", price: 7.5 },
    ],
  },

  {
    id: "argentinian-grill",
    name: "Argentinian Grill",
    category: "Food",
    rating: 4.8,
    deliveryFee: 3.5,
    eta: "30-40",
    menu: [
      { id: "steak", name: "Grilled Steak", description: "Argentinian style steak", price: 18.0 },
      { id: "empanadas", name: "Empanadas", description: "Beef stuffed pastries", price: 6.5 },
      { id: "choripan", name: "Choripán", description: "Sausage sandwich", price: 7.0 },
    ],
  },

  {
    id: "hangover-hut",
    name: "Hangover Hut",
    category: "Food",
    rating: 4.6,
    deliveryFee: 2.5,
    eta: "20-30",
    menu: [
      { id: "breakfast", name: "Breakfast Plate", description: "Eggs, bacon, toast", price: 7.5 },
      { id: "pancakes", name: "Pancakes", description: "Stack with syrup", price: 6.0 },
      { id: "burrito", name: "Breakfast Burrito", description: "Eggs, cheese, sausage", price: 8.0 },
    ],
  },

  {
    id: "la-palapa",
    name: "La Palapa Beach Bar",
    category: "Drinks",
    rating: 4.5,
    deliveryFee: 2.0,
    eta: "15-25",
    menu: [
      { id: "margarita", name: "Margarita", description: "Classic lime margarita", price: 6.5 },
      { id: "beer", name: "Local Beer", description: "Ice cold Honduran beer", price: 3.0 },
      { id: "mojito", name: "Mojito", description: "Mint and lime cocktail", price: 6.0 },
    ],
  },

  {
    id: "pizza-roatan",
    name: "Pizza Roatan",
    category: "Food",
    rating: 4.4,
    deliveryFee: 3.0,
    eta: "25-35",
    menu: [
      { id: "pepperoni", name: "Pepperoni Pizza", description: "Classic pepperoni", price: 12.0 },
      { id: "hawaiian", name: "Hawaiian Pizza", description: "Ham and pineapple", price: 11.5 },
      { id: "veggie", name: "Veggie Pizza", description: "Mixed vegetables", price: 10.5 },
    ],
  },
];