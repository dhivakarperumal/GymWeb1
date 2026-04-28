const API_BASE = 'http://localhost:5000/api';

const additionalPlans = [
  {
    name: "Day Pass (Pro)",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=600&auto=format&fit=crop",
    description: "Full access to all facilities for a single day.",
    duration: "1 Day",
    price: 500,
    discount: 0,
    finalPrice: 500,
    facilities: ["Gym Access", "Locker", "Shower"],
    trainerIncluded: false,
    dietPlans: [],
    active: true
  },
  {
    name: "Weekend Warrior (Annual)",
    image: "https://images.unsplash.com/photo-1590239068512-6c17e93421d9?q=80&w=600&auto=format&fit=crop",
    description: "Access every Saturday and Sunday for a full year.",
    duration: "12 Months",
    price: 15000,
    discount: 3000,
    finalPrice: 12000,
    facilities: ["Weekend Access", "Group Classes", "Steam Bath"],
    trainerIncluded: false,
    dietPlans: [],
    active: true
  },
  {
    name: "Body Transformation (30 Days)",
    image: "https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?q=80&w=600&auto=format&fit=crop",
    description: "Intense 30-day program with daily trainer oversight.",
    duration: "1 Month",
    price: 15000,
    discount: 0,
    finalPrice: 15000,
    facilities: ["Personal Trainer", "Daily Classes", "Diet Monitoring"],
    trainerIncluded: true,
    dietPlans: ["Aggressive Fat Loss Diet"],
    active: true
  },
  {
    name: "Senior Mobility Plan",
    image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop",
    description: "Safe and effective strength training for 60+ members.",
    duration: "6 Months",
    price: 12000,
    discount: 2000,
    finalPrice: 10000,
    facilities: ["Safe Weight Area", "Guided Sessions", "Pool Access"],
    trainerIncluded: true,
    dietPlans: ["Joint Support Diet"],
    active: true
  },
  {
    name: "Corporate Team Pack (5 Pax)",
    image: "https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=600&auto=format&fit=crop",
    description: "Group membership for corporate teams of up to 5 members.",
    duration: "1 Year",
    price: 150000,
    discount: 50000,
    finalPrice: 100000,
    facilities: ["Unlimited Access", "Meeting Room Use", "Team Workouts"],
    trainerIncluded: false,
    dietPlans: ["Office Lunch Guide"],
    active: true
  }
];

const seed = async () => {
  console.log('🚀 Adding 5 more pricing plans...');
  for (const plan of additionalPlans) {
    try {
      await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      console.log(`✅ Added Pricing: ${plan.name}`);
    } catch (err) {
      console.error(`❌ Error: ${plan.name} - ${err.message}`);
    }
  }
  console.log('✨ Additional pricing complete!');
};

seed();
