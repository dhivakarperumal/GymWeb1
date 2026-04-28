const API_BASE = 'http://localhost:5000/api';

const reviews = [
  {
    name: "Rahul Sharma",
    rating: 5,
    message: "The best gym in the city! The equipment is top-notch and the atmosphere is very motivating. I've seen amazing progress in just 2 months.",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&auto=format&fit=crop",
    status: true
  },
  {
    name: "Priya Kapoor",
    rating: 5,
    message: "Amazing trainers who actually care about your progress. The 3-month transformation plan is totally worth it. The diet plan was very easy to follow.",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    status: true
  },
  {
    name: "Anita Raj",
    rating: 4,
    message: "Love the Zen yoga studio here. It's so peaceful and the instructors are excellent. Perfect for balancing out my heavy lifting days.",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop",
    status: true
  },
  {
    name: "Vikram Malhotra",
    rating: 5,
    message: "The swimming pool is always clean and temperature controlled. The steam room is a great way to unwind after a brutal leg day.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
    status: true
  },
  {
    name: "Suresh Tiwari",
    rating: 4,
    message: "Great community and very friendly staff. The nutrition counseling really helped me understand my macros. Highly recommend this gym.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop",
    status: true
  },
  {
    name: "David Lawson",
    rating: 5,
    message: "High-energy classes and great music. The HIIT sessions are brutal but incredibly effective! Best place to sweat it out.",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop",
    status: true
  }
];

const seed = async () => {
  console.log('🚀 Starting to seed 6 member reviews...');
  for (const review of reviews) {
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ Added Review from: ${review.name}`);
      } else {
        console.error(`❌ Failed: ${review.name} - ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(`❌ Error: ${review.name} - ${err.message}`);
    }
  }
  console.log('✨ Review seeding complete!');
};

seed();
