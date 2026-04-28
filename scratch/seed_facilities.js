const API_BASE = 'http://localhost:5000/api';

const facilities = [
  {
    title: "Main Strength Arena",
    slug: "main-strength-arena",
    shortDesc: "The heart of the gym with heavy iron and machines.",
    description: "Our main floor features over 5,000 sq. ft. of strength equipment, including Olympic lifting platforms, a massive dumbbell range, and premium plate-loaded machines.",
    heroImage: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    equipments: ["Power Racks", "Olympic Benches", "Leg Press", "Cable Crossovers"],
    workouts: ["Strength Training", "Bodybuilding", "Powerlifting"],
    facilities: ["Air Conditioning", "Music System", "Drinking Water"],
    gallery: ["https://images.unsplash.com/photo-1540497077202-7c8a3999166f", "https://images.unsplash.com/photo-1571902943202-507ec2618e8f"],
    active: true
  },
  {
    title: "Cardio Sky Deck",
    slug: "cardio-sky-deck",
    shortDesc: "Panoramic views while you burn calories.",
    description: "Elevate your heart rate on our upper deck featuring high-end treadmills, ellipticals, and rowers, all equipped with personal entertainment screens.",
    heroImage: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=800&auto=format&fit=crop",
    equipments: ["Treadmills", "Ellipticals", "Spin Bikes", "Rowing Machines"],
    workouts: ["Cardio", "Fat Burn", "Endurance"],
    facilities: ["TV Screens", "Wi-Fi", "Towel Service"],
    gallery: ["https://images.unsplash.com/photo-1593079831268-3381b0db4a77"],
    active: true
  },
  {
    title: "Olympic Swimming Pool",
    slug: "swimming-pool",
    shortDesc: "Temperature-controlled 25m swimming pool.",
    description: "Whether you're training for a triathlon or just cooling off, our heated 4-lane pool is perfect for low-impact cardio and recovery.",
    heroImage: "https://images.unsplash.com/photo-1530549387634-e797514ba24e?q=80&w=800&auto=format&fit=crop",
    equipments: ["Kickboards", "Pull Buoys", "Lanes"],
    workouts: ["Lap Swimming", "Aqua Aerobics"],
    facilities: ["Lifeguard on Duty", "Heated Water", "Shower Area"],
    gallery: ["https://images.unsplash.com/photo-1519315901367-f34ff9154487"],
    active: true
  },
  {
    title: "Zen Yoga Studio",
    slug: "yoga-studio",
    shortDesc: "A peaceful sanctuary for mind and body.",
    description: "Our sound-proofed studio provides the perfect atmosphere for Hatha, Vinyasa, and Meditation sessions. Equipped with premium mats and props.",
    heroImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop",
    equipments: ["Yoga Mats", "Blocks", "Straps", "Bolsters"],
    workouts: ["Yoga", "Pilates", "Meditation"],
    facilities: ["Ambient Lighting", "Aromatherapy", "Sound System"],
    gallery: ["https://images.unsplash.com/photo-1552196564-972d46387357"],
    active: true
  },
  {
    title: "Steam & Sauna Spa",
    slug: "steam-sauna-spa",
    shortDesc: "Ultimate post-workout recovery and detox.",
    description: "Unwind after an intense session in our authentic Finnish sauna or eucalyptus-infused steam room. Perfect for muscle relaxation and skin health.",
    heroImage: "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?q=80&w=800&auto=format&fit=crop",
    equipments: ["Hot Stones", "Steam Generator"],
    workouts: ["Recovery", "Detox", "Relaxation"],
    facilities: ["Fresh Towels", "Lockers", "Shower Area"],
    gallery: ["https://images.unsplash.com/photo-1594411603099-055743b1458e"],
    active: true
  },
  {
    title: "Functional Cross-Box",
    slug: "functional-cross-box",
    shortDesc: "High-performance functional training area.",
    description: "Designed for high-intensity functional training, our box includes turf, sleds, battle ropes, and a massive multi-station rig.",
    heroImage: "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?q=80&w=800&auto=format&fit=crop",
    equipments: ["Turf Sled", "Battle Ropes", "Plyo Boxes", "TRX"],
    workouts: ["HIIT", "CrossFit", "Agility"],
    facilities: ["Outdoor Access", "Chalk Station"],
    gallery: ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438"],
    active: true
  },
  {
    title: "DAP Fuel Bar",
    slug: "dap-fuel-bar",
    shortDesc: "Healthy shakes, snacks, and coffee.",
    description: "Refuel your body with our custom protein shakes, pre-workout coffee, or healthy on-the-go snacks. The social hub of our community.",
    heroImage: "https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=800&auto=format&fit=crop",
    equipments: ["Blenders", "Coffee Machine"],
    workouts: ["Nutrition", "Socializing"],
    facilities: ["Free Wi-Fi", "Charging Ports", "Seating Area"],
    gallery: ["https://images.unsplash.com/photo-1594498639139-e48717a12cd9"],
    active: true
  },
  {
    title: "VIP Recovery Lounge",
    slug: "vip-recovery-lounge",
    shortDesc: "Advanced recovery tools for elite athletes.",
    description: "Exclusive access to compression boots, percussion therapy, and cold plunge tanks to accelerate your recovery between sessions.",
    heroImage: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=800&auto=format&fit=crop",
    equipments: ["Normatec Boots", "Theraguns", "Cold Plunge"],
    workouts: ["Active Recovery", "Cryotherapy"],
    facilities: ["VIP Privacy", "Personal Lockers"],
    gallery: ["https://images.unsplash.com/photo-1574680096145-d05b474e2158"],
    active: true
  }
];

const seed = async () => {
  console.log('🚀 Starting to seed 8 gym facilities...');
  for (const facility of facilities) {
    try {
      const res = await fetch(`${API_BASE}/facilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(facility)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Added Facility: ${facility.title}`);
      } else {
        console.error(`❌ Failed: ${facility.title} - ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${facility.title} - ${err.message}`);
    }
  }
  console.log('✨ Facility seeding complete!');
};

seed();
