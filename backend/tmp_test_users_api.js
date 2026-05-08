const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/users');
    console.log('status', res.status);
    console.log('body length', Array.isArray(res.data) ? res.data.length : typeof res.data);
  } catch (err) {
    if (err.response) {
      console.error('status', err.response.status);
      console.error('data', err.response.data);
    } else {
      console.error(err.message);
    }
    process.exit(1);
  }
})();