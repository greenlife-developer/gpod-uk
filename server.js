const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

let authToken = null;
let tokenExpiresAt = null;

// Function to fetch access token
async function getAccessToken(clientId, clientSecret) {
  try {
    const BASE_URL = "https://test-api.service.hmrc.gov.uk/oauth/token";

    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("scope", "read:vat");
    params.append("client_id", clientId.trim());
    params.append("client_secret", clientSecret.trim());

    const response = await axios.post(BASE_URL, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      auth: {
        username: clientId.trim(),
        password: clientSecret.trim(),
      },
    });

    console.log("Token response:", response.data);

    authToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    return {
      access_token: response.data.access_token,
      expires_in: response.data.expires_in,
    };
  } catch (error) {
    console.error("Error fetching token:", error.response ? error.response.data : error.message);
    throw error;
  }
}

// Ensure token is valid or refresh it
async function ensureToken() {
  if (!authToken || Date.now() >= tokenExpiresAt) {
    await getAccessToken(process.env.CLIENT_ID, process.env.CLIENT_SECRET);
  }
}

// Generic API request
async function apiRequest(endpoint, method, body) {
  await ensureToken();

  const url = `https://test-api.service.hmrc.gov.uk${endpoint}`;
  const headers = {
    Authorization: `Bearer ${authToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  try {
    const response = await axios({
      method,
      url,
      headers,
      data: body ? JSON.stringify(body) : null,
    });
    return response.data;
  } catch (error) {
    console.log(error.response.status);
    console.error(`Error in API request: ${method} ${endpoint}`, error.response ? error.response.data : error.message);
    throw error;
  }
}

// Add or update a manual
app.put("/api/manuals/:slug", async (req, res) => {
  const { slug } = req.params;
  const manualData = req.body;

  console.log("Slug:", slug);

  try {
    const response = await apiRequest(`/hmrc-manuals/${slug}`, "PUT", manualData);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to add or update manual" });
  }
});

// Add or update a section
app.post("/api/manuals/:manualSlug/sections/:sectionSlug", async (req, res) => {
  const { manualSlug, sectionSlug } = req.params;
  const sectionData = req.body;

  try {
    const response = await apiRequest(`/hmrc-manuals/${manualSlug}/sections/${sectionSlug}`, "POST", sectionData);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to add or update section" });
  }
});

// Get a manual
app.get("/api/manuals/:slug", async (req, res) => {
  const { slug } = req.params;

  try {
    const response = await apiRequest(`/hmrc-manuals/${slug}`, "GET");
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch manual" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});