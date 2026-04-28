const API_BASE = 'http://localhost:5000/api';

const additionalProducts = [
  {
    name: "Pre-Workout Explosion",
    category: "Food",
    subcategory: "Solid",
    description: "High-intensity energy and focus booster for your hardest workouts.",
    ratings: 5,
    weight: ["300g", "600g"],
    mrp: 1800,
    offer: 15,
    offerPrice: 1530,
    stock: {
      "300g": { qty: 25, mrp: 1800, offer: 15, offerPrice: 1530 },
      "600g": { qty: 15, mrp: 3200, offer: 20, offerPrice: 2560 }
    },
    images: ["https://images.unsplash.com/photo-1593095191850-2a733009e487?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "Casein Protein (Slow Digest)",
    category: "Food",
    subcategory: "Solid",
    description: "Slow-release protein for overnight muscle recovery and growth.",
    ratings: 4,
    weight: ["1kg", "2kg"],
    mrp: 3500,
    offer: 10,
    offerPrice: 3150,
    stock: {
      "1kg": { qty: 20, mrp: 3500, offer: 10, offerPrice: 3150 },
      "2kg": { qty: 10, mrp: 6500, offer: 15, offerPrice: 5525 }
    },
    images: ["https://images.unsplash.com/photo-1579722820308-d74e571900a9?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "Omega-3 Fish Oil",
    category: "Food",
    subcategory: "Solid",
    description: "Essential fatty acids for heart, brain, and joint health.",
    ratings: 5,
    weight: ["60 Caps", "120 Caps"],
    mrp: 900,
    offer: 10,
    offerPrice: 810,
    stock: {
      "60 Caps": { qty: 40, mrp: 900, offer: 10, offerPrice: 810 },
      "120 Caps": { qty: 25, mrp: 1600, offer: 15, offerPrice: 1360 }
    },
    images: ["https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "ZMA Night Recovery",
    category: "Food",
    subcategory: "Solid",
    description: "Zinc, Magnesium, and Vitamin B6 for better sleep and testosterone support.",
    ratings: 4,
    weight: ["90 Caps"],
    mrp: 1100,
    offer: 5,
    offerPrice: 1045,
    stock: {
      "90 Caps": { qty: 30, mrp: 1100, offer: 5, offerPrice: 1045 }
    },
    images: ["https://images.unsplash.com/photo-1616671285430-b39f37f37471?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "DAP Branded Shaker Bottle",
    category: "Accessories",
    subcategory: "Bag",
    description: "Leak-proof, BPA-free shaker with mixing ball for smooth shakes.",
    ratings: 5,
    size: ["700ml"],
    gender: ["Male", "Female"],
    mrp: 450,
    offer: 10,
    offerPrice: 405,
    stock: {
      "700ml-Male": { qty: 50 }, "700ml-Female": { qty: 50 }
    },
    images: ["https://images.unsplash.com/photo-1593095191850-2a733009e487?q=80&w=600&auto=format&fit=crop"]
  },
  {
    name: "Resistance Band Set (5 Levels)",
    category: "Accessories",
    subcategory: "Gloves",
    description: "Versatile bands for warmups, rehabilitation, and resistance training.",
    ratings: 4,
    size: ["One Size"],
    gender: ["Male", "Female"],
    mrp: 1200,
    offer: 20,
    offerPrice: 960,
    stock: {
      "One Size-Male": { qty: 20 }, "One Size-Female": { qty: 20 }
    },
    images: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop"]
  }
];

const seed = async () => {
  console.log('🚀 Starting to seed 6 more premium products...');
  for (const product of additionalProducts) {
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
  console.log('✨ Additional seeding complete!');
};

seed();
