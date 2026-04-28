const API_BASE = 'http://localhost:5000/api';

const plans = [
  {
    name: "1 Month Basic",
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
    description: "Our best value plan for dedicated athletes.",
    duration: "12 Months",
    price: 36000,
    discount: 11000,
    finalPrice: 25000,
    facilities: ["Unlimited Gym Access", "VIP Lounge", "Swimming Pool", "Steam & Sauna"],
    trainerIncluded: true,
    dietPlans: ["Custom Diet Plan", "Supplement Guide"],
    active: true
  },
  {
    name: "Student Special (3 Months)",
    description: "Discounted rate for students with valid ID.",
    duration: "3 Months",
    price: 9000,
    discount: 3000,
    finalPrice: 6000,
    facilities: ["Gym Access", "Locker Room"],
    trainerIncluded: false,
    dietPlans: [],
    active: true
  },
  {
    name: "Couple Pack (3 Months)",
    description: "Train together and save together.",
    duration: "3 Months",
    price: 18000,
    discount: 4000,
    finalPrice: 14000,
    facilities: ["Gym Access", "Group Classes", "Locker Room"],
    trainerIncluded: false,
    dietPlans: [],
    active: true
  },
  {
    name: "PT Starter (12 Sessions)",
    description: "Kickstart your goals with professional guidance.",
    duration: "1 Month",
    price: 12000,
    discount: 0,
    finalPrice: 12000,
    facilities: ["Personal Training Sessions", "Gym Access"],
    trainerIncluded: true,
    dietPlans: ["Custom Performance Diet"],
    active: true
  },
  {
    name: "Weekend Warrior",
    description: "Access on Saturdays and Sundays only.",
    duration: "1 Month",
    price: 2500,
    discount: 500,
    finalPrice: 2000,
    facilities: ["Weekend Gym Access", "Group Classes"],
    trainerIncluded: false,
    dietPlans: [],
    active: true
  },
  {
    name: "Senior Citizen (1 Year)",
    description: "Specially curated for health and mobility.",
    duration: "12 Months",
    price: 36000,
    discount: 18000,
    finalPrice: 18000,
    facilities: ["Gym Access", "Physio Support", "Yoga Classes"],
    trainerIncluded: true,
    dietPlans: ["Heart-Healthy Diet"],
    active: true
  },
  {
    name: "Corporate Annual",
    description: "Exclusive rate for our corporate partners.",
    duration: "12 Months",
    price: 36000,
    discount: 14000,
    finalPrice: 22000,
    facilities: ["Gym Access", "Swimming Pool", "Locker Room"],
    trainerIncluded: false,
    dietPlans: ["Office-Friendly Meal Plan"],
    active: true
  }
];

const seed = async () => {
  console.log('🚀 Starting to seed 10 membership plans...');
  for (const plan of plans) {
    try {
      const res = await fetch(`${API_BASE}/plans`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Added Plan: ${plan.name} (ID: ${data.plan_id})`);
      } else {
        console.error(`❌ Failed: ${plan.name} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${plan.name} - ${err.message}`);
    }
  }
  console.log('✨ Plan seeding complete!');
};

seed();
