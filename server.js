require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Listing = require("./models/Listing");

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://landsureUser:Amoghy%4023@cluster0.fkot8rm.mongodb.net/LandSureProject?retryWrites=true&w=majority&appName=Cluster0"
)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// Suggestions (unique location names)
app.get("/api/listings/search-suggestions", async (req, res) => {
    try {
        const q = req.query.q || "";
        const locations = await Listing.find({
            location: { $regex: q, $options: "i" }
        }).distinct("location");

        res.json(locations);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// Actual search (listings for results page)
app.get("/api/listings/search", async (req, res) => {
    try {
        const q = req.query.q || "";
        const listings = await Listing.find({
            $or: [
                { title: { $regex: q, $options: "i" } },
                { location: { $regex: q, $options: "i" } }
            ]
        });

        res.json(listings);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
});

// ------------------- ROUTES -------------------
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/seed-images", express.static(path.join(__dirname, "seed-images")));

const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

const listingRoutes = require("./routes/listings");
app.use("/api/listings", listingRoutes);

const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);

const feedbackRoutes = require("./routes/feedback");
app.use("/api/feedback", feedbackRoutes);

// ------------------- START SERVER -------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
