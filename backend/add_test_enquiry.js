const axios = require('axios');

async function createTestEnquiry() {
  try {
    const response = await axios.post('http://localhost:5000/api/enquiries', {
      name: "Another Test User",
      email: "test2_enquiry@example.com",
      phone: "9998887772",
      dob: "10-02-2000",
      age: "26",
      gender: "Female",
      blood_group: "B+",
      consent_data: {
        participant_name: "Another Test User",
        agree: true,
        signature: "Another Test User",
        date: "2026-05-15",
        guardian_signature: "",
        witness: ""
      },
      status: "pending",
      termsAccepted: true
    });
    console.log("Test enquiry successfully added!");
    console.log(response.data);
  } catch (err) {
    console.error("Failed to create test enquiry:", err.response ? err.response.data : err.message);
  }
}

createTestEnquiry();
