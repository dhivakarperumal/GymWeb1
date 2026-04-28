const API_BASE = 'http://localhost:5000/api';

const plans = [
  {
    name: "1 Month Basic",
    image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600&auto=format&fit=crop",
    description: "Standard monthly membership for gym access.",
    duration: "1 Month",
    price: 3000,
    discount: 0,
    finalPrice: 3000,
    facilities: ["Gym Access", "Locker Room", "Shower"],
    trainerIncluded: false,
    dietPlans: [],
    active: true
  },
  {
    name: "3 Months Transformation",
    image: "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=600&auto=format&fit=crop",
    description: "Best for beginners looking to see real results.",
    duration: "3 Months",
    price: 9000,
    discount: 1000,
    finalPrice: 8000,
    facilities: ["Gym Access", "Steam Bath", "Group Classes"],
    trainerIncluded: false,
    dietPlans: ["Basic Nutrition Guide"],
    active: true
  },
  {
    name: "6 Months Power Pack",
    image: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=600&auto=format&fit=crop",
    description: "Commit to your fitness journey with a semi-annual plan.",
    duration: "6 Months",
    price: 18000,
    discount: 3000,
    finalPrice: 15000,
    facilities: ["Gym Access", "Steam Bath", "Group Classes", "Swimming Pool"],
    trainerIncluded: false,
    dietPlans: ["Standard Diet Plan"],
    active: true
  },
  {
    name: "1 Year Elite Membership",
    image: "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=600&auto=format&fit=crop",
    description: "Our best value plan for dedicated athletes.",
    duration: "12 Months",
    price: 36000,
    discount: 11000,
    finalPrice: 25000,
    facilities: ["Unlimited Gym Access", "VIP Lounge", "Swimming Pool", "Steam & Sauna"],
    trainerIncluded: true,
    dietPlans: ["Custom Diet Plan", "Supplement Guide"],
    active: true
  }
];

const seed = async () => {
  console.log('🚀 Re-seeding Plans with images...');
  for (const plan of plans) {
    try {
      await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      console.log(`✅ Added Plan: ${plan.name}`);
    } catch (err) {
      console.error(`❌ Error: ${plan.name} - ${err.message}`);
    }
  }
};

seed();
