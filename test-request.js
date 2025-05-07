const axios = require("axios");

// Your server URL
const SERVER_URL = "http://localhost:3000/api/start-download";

// A simple MP4 file to test
const VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

async function sendTestRequest() {
  try {
    console.log("Sending request to server...");

    const response = await axios.post(SERVER_URL, {
      url: VIDEO_URL,
    });

    console.log("✅ Success! Server responded:");
    console.log(response.data);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.response) {
      console.error("Server returned status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

sendTestRequest();
