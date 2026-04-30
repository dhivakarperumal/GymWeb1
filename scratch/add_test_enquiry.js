async function addTestEnquiry() {
  const url = 'http://localhost:5000/api/enquiries';
  const data = {
    name: "Jane NewUser",
    email: "jane.new@example.com",
    phone: "8887776665",
    subject: "Membership Inquiry",
    message: "I want to join the gym. Please convert me!",
    status: "pending",
    gender: "Female",
    dob: "1998-08-20",
    address: "456 Fitness Avenue, Los Angeles"
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTestEnquiry();
