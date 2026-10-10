const axios = require('axios');

async function run() {
  try {
    const res = await axios.get('http://localhost:8080/');
    console.log("Emulator response status:", res.status);
    console.log("Emulator response data:", res.data);
  } catch (error) {
    console.log("Could not connect to emulator:", error.message);
  }
}

run().catch(console.error);
