const API_BASE = 'http://localhost:5000/api';

const equipments = [
  {
    name: "Commercial Treadmill T800",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600&auto=format&fit=crop",
    category: "Cardio",
    purchaseDate: "2024-01-15",
    condition: "Excellent",
    status: "available",
    serviceDueMonth: "July 2024",
    underWarranty: true,
    underMaintenance: false
  },
  {
    name: "Elliptical Cross Trainer E50",
    image: "https://images.unsplash.com/photo-1571388208497-71bedc66e932?q=80&w=600&auto=format&fit=crop",
    category: "Cardio",
    purchaseDate: "2024-01-20",
    condition: "Good",
    status: "available",
    serviceDueMonth: "August 2024",
    underWarranty: true,
    underMaintenance: false
  },
  {
    name: "Olympic Flat Bench Press",
    image: "https://images.unsplash.com/photo-1591940742878-13aba4b7a35e?q=80&w=600&auto=format&fit=crop",
    category: "Strength",
    purchaseDate: "2023-12-10",
    condition: "Good",
    status: "available",
    serviceDueMonth: "June 2024",
    underWarranty: false,
    underMaintenance: false
  },
  {
    name: "Functional Cable Crossover",
    image: "https://images.unsplash.com/photo-1590239068512-6c17e93421d9?q=80&w=600&auto=format&fit=crop",
    category: "Functional",
    purchaseDate: "2024-02-01",
    condition: "New",
    status: "available",
    serviceDueMonth: "August 2024",
    underWarranty: true,
    underMaintenance: false
  }
];

const seed = async () => {
  console.log('🚀 Re-seeding Equipment with images...');
  for (const eq of equipments) {
    try {
      await fetch(`${API_BASE}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eq)
      });
      console.log(`✅ Added Equipment: ${eq.name}`);
    } catch (err) {
      console.error(`❌ Error: ${eq.name} - ${err.message}`);
    }
  }
};

seed();
