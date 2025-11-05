const express = require("express");
const mongoose = require("mongoose");
const donorRoutes = require("./router/donor");
const userRoutes = require("./router/user");
const bloodBankRoutes = require("./router/bloodBank");
const hospitalRoutes = require("./router/hospital");
const bloodDonationRoutes = require("./router/bloodDonation");
const bloodRequestRoutes = require("./router/bloodRequest");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const methodOverride = require("method-override");
const staticroutes = require("./router/staticroutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));
app.use(express.static("public"));
app.use(cookieParser());
app.use(cors());

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("db connected");
});

app.use("/donor", donorRoutes);
app.use("/", userRoutes);
app.use("/bloodBank", bloodBankRoutes);
app.use("/hospital", hospitalRoutes);
app.use("/donation", bloodDonationRoutes);
app.use("/request", bloodRequestRoutes);
app.use("/", staticroutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Backend server running on URL: http://localhost:${PORT}`);
});