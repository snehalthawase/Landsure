const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const authMiddleware = require("../middleware/authMiddleware");

// Get featured listings + recent listings
// Get featured listings + recent listings
router.get("/featured", async (req, res) => {
  try {
    // Get all active featured listings
    const featured = await Listing.find({
      isFeatured: true,
      featuredPaidAmount: { $gt: 0 }
    });

    // Assign weights based on duration (example: 3 months=3, 2 months=2, 1 month=1)
    const weightedList = [];
    featured.forEach(listing => {
      let weight = 1; // default 1
      if (listing.featuredPaidAmount >= 10000) weight = 3; // 3 months
      else if (listing.featuredPaidAmount >= 7000) weight = 2; // 2 months
      // else weight = 1 for 1 month (>=5000)
      
      for (let i = 0; i < weight; i++) {
        weightedList.push(listing);
      }
    });

    // Shuffle weighted list
for (let i = weightedList.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [weightedList[i], weightedList[j]] = [weightedList[j], weightedList[i]];
}

// Pick first 6 **unique** listings
const uniqueFeatured = [];
const seenIds = new Set();

for (let listing of weightedList) {
  if (!seenIds.has(listing._id.toString())) {
    uniqueFeatured.push(listing);
    seenIds.add(listing._id.toString());
  }
  if (uniqueFeatured.length === 6) break;
}

    // Get recent listings excluding the featured ones
    const featuredIds = featured.map(f => f._id);
    const recent = await Listing.find({ _id: { $nin: featuredIds } })
      .sort({ createdAt: -1 })
      .limit(12);

    res.json({ featured: uniqueFeatured, recent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Paginated listings
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;
    const skip = (page - 1) * limit;

    const total = await Listing.countDocuments();
    const listings = await Listing.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ listings, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Total listings
router.get("/count", async (req, res) => {
  try {
    const total = await Listing.countDocuments();
    res.json({ total });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Example route in Express
router.get("/random-lands", async (req, res) => {
  try {
    const randomLands = await Listing.aggregate([
      { $sample: { size: 5 } } // get 5 random documents
    ]);
    res.json(randomLands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get seller's own listings
router.get("/my-listings", authMiddleware, async (req, res) => {
    try {
        const listings = await Listing.find({ userId: req.userId });
        res.json(listings);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch my listings" });
    }
});

// Single listing by ID
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid listing ID" });
    }

    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });

    res.json(listing);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Multer storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ✅ Create listing (auth required)
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
    try {
        const data = req.body;

        if (req.file) data.imageUrl = `/uploads/${req.file.filename}`;

        data.isFeatured = data.isFeatured === "on" ? true : false;
        if (data.featuredPaidAmount) data.featuredPaidAmount = Number(data.featuredPaidAmount);
        if (data.price) data.price = Number(data.price);
        if (data.latitude) data.latitude = Number(data.latitude);
        if (data.longitude) data.longitude = Number(data.longitude);

        data.userId = req.userId;  // ✅ attach userId from token

        const newListing = new Listing(data);
        await newListing.save();

        res.status(201).json({ message: "Listing created", listing: newListing });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// Example route in Express
router.get("/random-lands", authMiddleware, async (req, res) => {
  try {
    // Get the current user's ID from the token
    const userId = req.userId;

    // Exclude this user's listings
    const randomLands = await Listing.aggregate([
      { $match: { userId: { $ne: mongoose.Types.ObjectId(userId) } } },
      { $sample: { size: 5 } } // get 5 random documents
    ]);

    res.json(randomLands);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;