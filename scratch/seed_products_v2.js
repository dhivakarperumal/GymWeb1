const API_BASE = 'http://localhost:5000/api';

const sampleProducts = [
  {
    name: "Whey Protein Gold Standard",
    category: "Food",
    subcategory: "Solid",
    description: "Premium whey protein for muscle recovery. 24g of protein per serving.",
    ratings: 5,
    weight: ["500g", "1kg"],
    mrp: 2500,
    offer: 10,
    offerPrice: 2250,
    stock: {
      "500g": { qty: 20, mrp: 2500, offer: 10, offerPrice: 2250 },
      "1kg": { qty: 15, mrp: 4500, offer: 15, offerPrice: 3825 }
    },
    images: ["https://images.unsplash.com/photo-1593095191850-2a733009e487?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "Creatine Monohydrate",
    category: "Food",
    subcategory: "Solid",
    description: "Pure micronized creatine for explosive strength and power.",
    ratings: 4,
    weight: ["250g", "500g"],
    mrp: 1200,
    offer: 5,
    offerPrice: 1140,
    stock: {
      "250g": { qty: 50, mrp: 1200, offer: 5, offerPrice: 1140 },
      "500g": { qty: 30, mrp: 2200, offer: 10, offerPrice: 1980 }
    },
    images: ["https://images.unsplash.com/photo-1579722820308-d74e571900a9?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "BCAA Energy Intra-Workout",
    category: "Food",
    subcategory: "Liquid",
    description: "Essential amino acids with an energy kick for peak performance.",
    ratings: 4,
    weight: ["500ml", "1L"],
    mrp: 800,
    offer: 20,
    offerPrice: 640,
    stock: {
      "500ml": { qty: 40, mrp: 800, offer: 20, offerPrice: 640 },
      "1L": { qty: 15, mrp: 1400, offer: 25, offerPrice: 1050 }
    },
    images: ["https://images.unsplash.com/photo-1594498639139-e48717a12cd9?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "DAP Pro Training Hoodie",
    category: "Dress",
    subcategory: "Hoodie",
    description: "Premium moisture-wicking hoodie for intense training sessions.",
    ratings: 5,
    size: ["M", "L", "XL"],
    gender: ["Male", "Female"],
    mrp: 1800,
    offer: 20,
    offerPrice: 1440,
    stock: {
      "M-Male": { qty: 10 }, "L-Male": { qty: 15 }, "XL-Male": { qty: 5 },
      "M-Female": { qty: 8 }, "L-Female": { qty: 10 }, "XL-Female": { qty: 5 }
    },
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "Elite Lifting Grips",
    category: "Accessories",
    subcategory: "Gloves",
    description: "Superior grip support for heavy pulls and rows. Durable material.",
    ratings: 4,
    size: ["S", "M", "L"],
    gender: ["Male", "Female"],
    mrp: 750,
    offer: 10,
    offerPrice: 675,
    stock: {
      "S-Male": { qty: 12 }, "M-Male": { qty: 18 }, "L-Male": { qty: 12 },
      "S-Female": { qty: 10 }, "M-Female": { qty: 12 }, "L-Female": { qty: 8 }
    },
    images: ["https://images.unsplash.com/photo-1583454110551-21f2fa2adfcd?q=80&w=600&auto=format&fit=crop"]
  }
];

const seed = async () => {
  console.log('🚀 Starting to seed 5 premium products...');
  for (const product of sampleProducts) {
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Added: ${product.name} (ID: ${data.id})`);
      } else {
        console.error(`❌ Failed: ${product.name} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${product.name} - ${err.message}`);
    }
  }
  console.log('✨ Seeding complete!');
};

seed();
