require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const summaryRoutes = require("./routes/summaryRoutes");
const shopRoutes = require("./routes/shopRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/summary", summaryRoutes);
app.use("/api/shop", shopRoutes);

app.get("/", (req, res) => {
    res.json({ message: "KothaKhata API is running" });
});

const PORT = process.env.PORT || 5000;
const url = `http://localhost:${PORT}`;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open in browser: ${url}`);
});