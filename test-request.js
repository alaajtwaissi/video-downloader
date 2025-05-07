const testDownload = async () => {
  try {
    const response = await fetch("http://localhost:3000/api/start-download", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
      }),
    });

    const data = await response.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
};

testDownload();
