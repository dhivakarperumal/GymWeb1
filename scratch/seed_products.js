import api from "./frontend/src/api.js";

const sampleProducts = [
  {
    name: "Whey Protein Gold Standard",
    category: "Food",
    subcategory: "Solid",
    description: "Premium whey protein for muscle recovery.",
    ratings: 5,
    weight: ["500g", "1kg"],
    mrp: 2500,
    offer: 10,
    offerPrice: 2250,
    stock: {
      "500g": { qty: 20, mrp: 2500, offer: 10, offerPrice: 2250 },
      "1kg": { qty: 15, mrp: 4500, offer: 15, offerPrice: 3825 }
    },
    images: ["https://images.unsplash.com/photo-1593095191850-2a733009e487?q=80&w=200&auto=format&fit=crop"]
  },
  {
    name: "Creatine Monohydrate",
    category: "Food",
    subcategory: "Solid",
    description: "Pure micronized creatine for strength.",
    ratings: 4,
    weight: ["250g", "500g"],
    mrp: 1200,
    offer: 5,
    offerPrice: 1140,
    stock: {
      "250g": { qty: 50, mrp: 1200, offer: 5, offerPrice: 1140 },
      "500g": { qty: 30, mrp: 2200, offer: 10, offerPrice: 1980 }
    },
    images: ["https://images.unsplash.com/photo-1579722820308-d74e571900a9?q=80&w=200&auto=format&fit=crop"]
  },
  {
    name: "BCAA Energy",
    category: "Food",
    subcategory: "Liquid",
    description: "Intra-workout recovery drink.",
    ratings: 4,
    weight: ["500ml", "1L"],
    mrp: 800,
    offer: 20,
    offerPrice: 640,
    stock: {
      "500ml": { qty: 40, mrp: 800, offer: 20, offerPrice: 640 },
      "1L": { qty: 25, mrp: 1400, offer: 25, offerPrice: 1050 }
    },
    images: ["https://images.unsplash.com/photo-1594498639139-e48717a12cd9?q=80&w=200&auto=format&fit=crop"]
  },
  {
    name: "Gym Training Hoodie",
    category: "Dress",
    subcategory: "Hoodie",
    description: "Comfortable and breathable gym wear.",
    ratings: 5,
    size: ["M", "L", "XL"],
    gender: ["Male", "Female"],
    mrp: 1500,
    offer: 15,
    offerPrice: 1275,
    stock: {
      "M-Male": { qty: 10 }, "L-Male": { qty: 12 }, "XL-Male": { qty: 8 },
      "M-Female": { qty: 5 }, "L-Female": { qty: 7 }, "XL-Female": { qty: 4 }
    },
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=200&auto=format&fit=crop"]
  },
  {
    name: "Lifting Grips",
    category: "Accessories",
    subcategory: "Gloves",
    description: "Professional grade lifting grips.",
    ratings: 4,
    size: ["S", "M", "L"],
    gender: ["Male", "Female"],
    mrp: 600,
    offer: 10,
    offerPrice: 540,
    stock: {
      "S-Male": { qty: 15 }, "M-Male": { qty: 20 }, "L-Male": { qty: 15 },
      "S-Female": { qty: 10 }, "M-Female": { qty: 15 }, "L-Female": { qty: 10 }
    },
    images: ["https://images.unsplash.com/photo-1583454110551-21f2fa2adfcd?q=80&w=200&auto=format&fit=crop"]
  }
];

const seedProducts = async () => {
  for (const product of sampleProducts) {
    try {
      await api.post("/products", product);
      console.log(`Added ${product.name}`);
    } catch (err) {
      console.error(`Failed to add ${product.name}`, err.message);
    }
  }
};

seedProducts();
