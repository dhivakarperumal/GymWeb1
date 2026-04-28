const API_BASE = 'http://localhost:5000/api';

const services = [
  {
    service_id: "SE001",
    title: "Personal Training",
    slug: "personal-training",
    short_desc: "1-on-1 customized fitness coaching.",
    description: "Work with our certified trainers to achieve your specific fitness goals through personalized workout plans and continuous motivation.",
    hero_image: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop",
    points: ["Custom Workout Plan", "Nutrition Guidance", "Progress Tracking"]
  },
  {
    service_id: "SE002",
    title: "Group Fitness Classes",
    slug: "group-fitness",
    short_desc: "Energetic group sessions for all levels.",
    description: "Join our community classes including Aerobics, Step, and Total Body Conditioning. Perfect for those who love working out with others.",
    hero_image: "https://images.unsplash.com/photo-1518611012118-29a8d63ee06b?q=80&w=600&auto=format&fit=crop",
    points: ["Motivating Music", "Certified Instructors", "Community Support"]
  },
  {
    service_id: "SE003",
    title: "Nutrition Counseling",
    slug: "nutrition-counseling",
    short_desc: "Expert dietary advice for weight management.",
    description: "Our dietitians provide science-based meal plans and healthy eating strategies to complement your training and improve your lifestyle.",
    hero_image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop",
    points: ["Personalized Meal Plans", "Grocery Lists", "Calorie Tracking"]
  },
  {
    service_id: "SE004",
    title: "Yoga & Mindfulness",
    slug: "yoga-mindfulness",
    short_desc: "Balance your mind and body with yoga.",
    description: "Experience Hatha, Vinyasa, and restorative yoga sessions designed to increase flexibility, strength, and inner peace.",
    hero_image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=600&auto=format&fit=crop",
    points: ["Flexibility Focus", "Stress Relief", "Breathwork"]
  },
  {
    service_id: "SE005",
    title: "HIIT Sessions",
    slug: "hiit-sessions",
    short_desc: "High-intensity interval training for maximum burn.",
    description: "Burn maximum calories in minimum time with our intense HIIT circuits. Designed to boost metabolism and cardiovascular health.",
    hero_image: "https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?q=80&w=600&auto=format&fit=crop",
    points: ["Fat Burning", "Metabolic Boost", "Time Efficient"]
  },
  {
    service_id: "SE006",
    title: "Body Composition Analysis",
    slug: "body-composition",
    short_desc: "Detailed body metrics with BIA technology.",
    description: "Get accurate data on your body fat percentage, muscle mass, and metabolic rate to better track your transformation progress.",
    hero_image: "https://images.unsplash.com/photo-1593095191850-2a733009e487?q=80&w=600&auto=format&fit=crop",
    points: ["Fat % Analysis", "Muscle Mass Tracking", "BMI Report"]
  },
  {
    service_id: "SE007",
    title: "Sports Massage Therapy",
    slug: "sports-massage",
    short_desc: "Professional recovery and tissue work.",
    description: "Enhance recovery and prevent injuries with specialized sports massage. Focuses on deep tissue relief and muscle mobility.",
    hero_image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=600&auto=format&fit=crop",
    points: ["Muscle Recovery", "Pain Relief", "Injury Prevention"]
  },
  {
    service_id: "SE008",
    title: "Physiotherapy & Rehab",
    slug: "physio-rehab",
    short_desc: "Recover from injuries with expert care.",
    description: "Personalized rehabilitation programs for sports injuries, post-surgery recovery, and chronic pain management.",
    hero_image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?q=80&w=600&auto=format&fit=crop",
    points: ["Injury Rehab", "Post-Op Recovery", "Mobility Drills"]
  },
  {
    service_id: "SE009",
    title: "Swimming Coaching",
    slug: "swimming-coaching",
    short_desc: "Master your strokes in our heated pool.",
    description: "Learn to swim or improve your technique with our professional coaches. Available for children and adults of all skill levels.",
    hero_image: "https://images.unsplash.com/photo-1530549387634-e797514ba24e?q=80&w=600&auto=format&fit=crop",
    points: ["Stroke Correction", "Endurance Training", "Kids & Adults"]
  },
  {
    service_id: "SE010",
    title: "Zumba Dance Fitness",
    slug: "zumba-dance",
    short_desc: "Dance your way to a fitter you.",
    description: "A fun, high-energy dance party that burns calories and improves coordination. Latin-inspired moves that feel like a workout but feel like fun.",
    hero_image: "https://images.unsplash.com/photo-1524594152303-9fd13543fe6e?q=80&w=600&auto=format&fit=crop",
    points: ["Cardio Party", "Stress Relief", "Rhythmic Movement"]
  }
];

const seed = async () => {
  console.log('🚀 Starting to seed 10 gym services...');
  for (const service of services) {
    try {
      const res = await fetch(`${API_BASE}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(service)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Added Service: ${service.title} (ID: ${data.service_id})`);
      } else {
        console.error(`❌ Failed: ${service.title} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${service.title} - ${err.message}`);
    }
  }
  console.log('✨ Service seeding complete!');
};

seed();
