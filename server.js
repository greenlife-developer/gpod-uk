const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

let authToken = null;
let refreshToken = null;
let tokenExpiresAt = null;

app.get("/", (req, res) => {
  res.send("HMRC VAT API is running");
});

// Redirect user to HMRC consent screen
app.get("/api/oauth/login", (req, res) => {
  const redirectTo = req.query.redirectTo || "/";
  const authUrl =
    `https://test-api.service.hmrc.gov.uk/oauth/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.CLIENT_ID}&` +
    `scope=read:vat write:vat&` +
    `redirect_uri=${encodeURIComponent(process.env.REDIRECT_URI)}`;

  res.cookie("postLoginRedirect", redirectTo, {
    httpOnly: true,
    sameSite: "Lax",
  }); 

  res.redirect(authUrl);
});

// Callback endpoint to exchange code for access token
app.get("/api/oauth/callback", async (req, res) => {
  const code = req.query.code;

  const tokenUrl = "https://test-api.service.hmrc.gov.uk/oauth/token";
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("client_id", process.env.CLIENT_ID);
  params.append("client_secret", process.env.CLIENT_SECRET);
  params.append("redirect_uri", process.env.REDIRECT_URI);
  params.append("code", code);

  try {
    const response = await axios.post(tokenUrl, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    authToken = response.data.access_token;
    refreshToken = response.data.refresh_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    console.log("Access Token obtained:", authToken);

    const redirectTo = req.cookies.postLoginRedirect || "/";
    res.clearCookie("postLoginRedirect");

    res.redirect(redirectTo);

    // res.json({
    //   message: "Access token obtained",
    //   access_token: authToken,
    //   refresh_token: refreshToken,
    // });
  } catch (error) {
    console.error(
      "Error getting token:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to exchange code for token" });
  }
});

// Refresh token logic (optional for future use)
async function refreshAccessToken() {
  const url = "https://test-api.service.hmrc.gov.uk/oauth/token";
  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("client_id", process.env.CLIENT_ID);
  params.append("client_secret", process.env.CLIENT_SECRET);
  params.append("refresh_token", refreshToken);

  try {
    const response = await axios.post(url, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    authToken = response.data.access_token;
    tokenExpiresAt = Date.now() + response.data.expires_in * 1000;

    console.log("Token refreshed:", authToken);
    return authToken;
  } catch (error) {
    console.error(
      "Error refreshing token:",
      error.response?.data || error.message
    );
    throw error;
  }
}

async function ensureToken(req, res, next) {
  if (!authToken || Date.now() >= tokenExpiresAt) {
    if (refreshToken) {
      await refreshAccessToken();
      return next();
    } else {
      const redirectTo = encodeURIComponent(req.originalUrl);
      // return res.redirect("/api/oauth/login"); // redirect user to login page
      return res.redirect(`/api/oauth/login?redirectTo=${redirectTo}`);
    }
  } else {
    return next();
  }
}

// Reusable API call with current token
async function apiRequest(endpoint, method = "GET", data = null) {
  // await ensureToken();

  const url = `https://test-api.service.hmrc.gov.uk${endpoint}`;

  try {
    const response = await axios({
      method,
      url,
      headers: {
        Authorization: `Bearer ${authToken}`,
        Accept: "application/vnd.hmrc.1.0+json",
        "Content-Type": "application/json",
      },
      data,
    });

    return response.data;
  } catch (error) {
    console.error(
      `API error [${method} ${endpoint}]:`,
      error.response?.data || error.message
    );
    throw error;
  }
}


app.get("/api/vat-obligations/:vrn", ensureToken, async (req, res) => {
  const { vrn } = req.params;
  const { from = "2017-01-01", to = "2017-12-31", status } = req.query;

  const query = new URLSearchParams({ from, to });
  if (status) query.append("status", status);

  try {
    const result = await apiRequest(
      `/organisations/vat/${vrn}/obligations?${query.toString()}`,
      "GET"
    );
    res.json(result);
  } catch (error) {
    console.error(
      "Error fetching VAT obligations:",
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch VAT obligations" });
  }
});

// Submit VAT return
app.post("/api/vat-return/:vrn", ensureToken, async (req, res) => {
  const { vrn } = req.params;
  const body = req.body;

  try {
    const result = await apiRequest(
      `/organisations/vat/${vrn}/returns`,
      "POST",
      body
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit VAT return" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
