const express = require("express");
const router = express.Router();
const { makePayment, initiatePayment, getAccountDetails } = require("../controllers/modulrController");

router.post("/payments", makePayment);
router.post("/initiate-payments", initiatePayment);
router.get("/get-account", getAccountDetails); 

module.exports = router;
