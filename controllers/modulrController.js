const dotenv = require("dotenv");
const asyncHandler = require("express-async-handler");
const signature = require("../modulrUtils/signature");
const axios = require("axios");

const API_KEY =
  process.env.MODULR_API_KEY ||
  "eyJvcmciOiI2NDdlNjg2OTFjNGQxNzAwMDFkYzA5ZWEiLCJpZCI6IjQ0MWNkOTZiYzk0ZjQ4OTg5ODVkYjU4MjUyZTRjNzJlIiwiaCI6Im11cm11cjEyOCJ9";
const API_SECRET =
  process.env.MODULR_API_SECRET ||
  "YzJmZDY1ZGY0NWYyNGMwMGEzYzVhYzU1ZmEyNzk2NDQ=";

console.log("API_KEY: ", API_KEY);

// const signatureHelper = new signature(
//   "28154b2-9c62b93cc22a-24c9e2-5536d7d",
//   "NzAwZmIwMGQ0YTJiNDhkMzZjYzc3YjQ5OGQyYWMzOTI="
// );
const signatureHelper = new signature(API_KEY, API_SECRET);

const signatureResult = signatureHelper.calculate();

// signatureHelper.calculate();

console.log("Signature Result: ", signatureResult.getHTTPHeaders());

const getAccount = async () => {
  try {
    const response = await axios.get(
      "https://api-sandbox.modulrfinance.com/api-sandbox/accounts",
      {
        headers: signatureResult.getHTTPHeaders(),
      }
    );

    // console.log("Response from API: ", signatureResult.getHTTPHeaders());

    if (response.status === 200) {
      console.log("Successful API call, code: ", response.status);
      return response.data;
    } else {
      console.error(
        "Unsuccessful API call, code: ",
        response.status,
        ", body: ",
        response
      );
    }
  } catch (error) {
    console.error("Error in API call: ", error.message);
    throw new Error("API call failed");
  }
};

const getAccountDetails = asyncHandler(async (req, res) => {
  try {
    const response = await axios.get(
      "https://api-sandbox.modulrfinance.com/api-sandbox/accounts",
      {
        headers: signatureResult.getHTTPHeaders(),
      }
    );

    if (response.status === 200) {
      console.log("Successful API call, code: ", response.status);
      res.status(200).json(response.data);
    } else {
      console.error(
        "Unsuccessful API call, code: ",
        response.status,
        ", body: ",
        response
      );
    }
  } catch (error) {
    console.error("Error in API call: ", error.message);
    res.status(500).json({
      error: "API call failed",
      message: error.response.data.message,
      code: error.response.data.code,
    });
  }
});

const makePayment = asyncHandler(async (req, res) => {
  try {
    // const { sourceAccountId } = req.body;

    const data = {
      amount: 999.99,
      currency: "EUR",
      destination: {
        type: "IBAN",
        iban: "IE52MODR99035500333832",
        name: "Beneficiary Name",
      },
      sourceAccountId: "A2100DSMC8",
      reference: "Example Reference",
    };

    const accounts = await getAccount();
    console.log("Accounts: ", accounts);

    const response = await axios.post(
      "https://api-sandbox.modulrfinance.com/api-sandbox/payments",
      data,
      {
        headers: {
          ...signatureResult.getHTTPHeaders(),
          "Content-Type": "application/json",
          //   Acccept: "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("Successful API call, code: ", response.status);
      res.status(200).json(response.data);
    } else {
      console.error(
        "Unsuccessful API call, code: ",
        response.status,
        ", body: ",
        response
      );
    }
  } catch (error) {
    console.error("Error in API call: ", error);
    res.status(500).json({
      error: "API call failed",
      message: error.response.data.message,
      status: error.response.status,
      code: error.response.data.code,
    });
  }
});

const initiatePayment = asyncHandler(async (req, res) => {
  try {
    // const { sourceAccountId } = req.body;

    const data = {
      paymentAmount: {
        currency: "GBP",
        value: 100,
      },
      destination: {
        type: "ACCOUNT",
      },
      paymentReference: "Invoice ABC123",
      aspspId: "H100000001",
    };

    const accounts = await getAccount();
    console.log("Accounts: ", accounts);

    const response = await axios.post(
      "https://api-sandbox.modulrfinance.com/api-sandbox/payment-initiations",
      data,
      {
        headers: {
          ...signatureResult.getHTTPHeaders(),
          "Content-Type": "application/json",
          Acccept: "application/json",
        },
      }
    );

    if (response.status === 200) {
      console.log("Successful API call, code: ", response.status);
      res.status(200).json(response.data);
    } else {
      console.error(
        "Unsuccessful API call, code: ",
        response.status,
        ", body: ",
        response
      );
    }
  } catch (error) {
    console.error("Error in API call: ", error);
    res.status(500).json({
      error: "API call failed",
      message: error.response.data.message,
      status: error.response.status,
      code: error.response.data.code,
    });
  }
});

module.exports = {
  makePayment,
  initiatePayment,
  getAccountDetails,
};
