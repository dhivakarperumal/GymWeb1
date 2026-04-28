const API_BASE = 'http://localhost:5000/api';

const equipments = [
  {
    name: "Commercial Treadmill T800",
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
    category: "Strength",
    purchaseDate: "2023-12-10",
    condition: "Good",
    status: "available",
    serviceDueMonth: "June 2024",
    underWarranty: false,
    underMaintenance: false
  },
  {
    name: "Power Rack with Pull-up Bar",
    category: "Strength",
    purchaseDate: "2023-11-05",
    condition: "Excellent",
    status: "available",
    serviceDueMonth: "May 2024",
    underWarranty: true,
    underMaintenance: false
  },
  {
    name: "Leg Press 45 Degree",
    category: "Strength",
    purchaseDate: "2023-10-15",
    condition: "Good",
    status: "available",
    serviceDueMonth: "April 2024",
    underWarranty: false,
    underMaintenance: true
  },
  {
    name: "Functional Cable Crossover",
    category: "Functional",
    purchaseDate: "2024-02-01",
    condition: "New",
    status: "available",
    serviceDueMonth: "August 2024",
    underWarranty: true,
    underMaintenance: false
  },
  {
    name: "Dumbbell Set (2.5kg - 30kg)",
    category: "Strength",
    purchaseDate: "2023-09-20",
    condition: "Good",
    status: "available",
    serviceDueMonth: null,
    underWarranty: false,
    underMaintenance: false
  },
  {
    name: "Air Bike Pro",
    category: "Cardio",
    purchaseDate: "2024-02-15",
    condition: "New",
    status: "available",
    serviceDueMonth: "August 2024",
    underWarranty: true,
    underMaintenance: false
  },
  {
    name: "Battle Ropes (50ft)",
    category: "Functional",
    purchaseDate: "2024-03-01",
    condition: "Excellent",
    status: "available",
    serviceDueMonth: null,
    underWarranty: false,
    underMaintenance: false
  },
  {
    name: "Yoga Mat Set (10 units)",
    category: "Flexibility",
    purchaseDate: "2024-03-10",
    condition: "Excellent",
    status: "available",
    serviceDueMonth: null,
    underWarranty: false,
    underMaintenance: false
  }
];

const seed = async () => {
  console.log('🚀 Starting to seed gym equipments...');
  for (const eq of equipments) {
    try {
      const res = await fetch(`${API_BASE}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eq)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Added Equipment: ${eq.name}`);
      } else {
        console.error(`❌ Failed: ${eq.name} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${eq.name} - ${err.message}`);
    }
  }
  console.log('✨ Equipment seeding complete!');
};

seed();
