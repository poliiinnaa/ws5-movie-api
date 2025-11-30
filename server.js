// server.js
// Yksinkertainen Movie API: Node + Express + MongoDB (Mongoose)

// Ladataan ympäristömuuttujat (.env-tiedostosta)
require("dotenv").config();

// Tuodaan kirjastot
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Luodaan Express-sovellus
const app = express();

// Portti: Render antaa PORT-ympäristömuuttujan, paikallisesti käytetään 3000
const PORT = process.env.PORT || 3000;

// MongoDB-yhteys:
//  - Renderissä käytetään MONGODB_URI-ympäristömuuttujaa (esim. Atlas-url)
//  - paikallisesti fallback localhost-tietokantaan
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ws5_movies";

// ----- Middlewaret -----

// Sallii pyynnöt muista domaineista (esim. React-frontend eri portista)
app.use(cors());

// Parsii requestien bodyt automaattisesti JSONiksi (req.body)
app.use(express.json());

// ----- MongoDB-yhteys Mongoosella -----

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    // Jos tietokantaan ei saada yhteyttä, ei ole järkeä käynnistää serveriä
    process.exit(1);
  });

// ----- Mongoose-schema ja -malli elokuville -----

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Pakollinen
    year: Number,
    director: String,
    rating: Number,
  },
  { timestamps: true } // Luo createdAt ja updatedAt automaattisesti
);

const Movie = mongoose.model("Movie", movieSchema);

// ----- REST API -reitit (CRUD) -----

// GET /api/movies – hae kaikki elokuvat (max 50)
app.get("/api/movies", async (req, res) => {
  try {
    const movies = await Movie.find({}).limit(50).lean();
    res.status(200).json(movies);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch movies" });
  }
});

// GET /api/movies/:id – hae yksi elokuva id:llä
app.get("/api/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.status(200).json(movie);
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// POST /api/movies – luo uusi elokuva
app.post("/api/movies", async (req, res) => {
  try {
    const movie = await Movie.create(req.body);
    res.status(201).json(movie);
  } catch (err) {
    res.status(400).json({ error: "Invalid movie data" });
  }
});

// PUT /api/movies/:id – päivitä olemassa oleva elokuva
app.put("/api/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.status(200).json(movie);
  } catch (err) {
    res.status(400).json({ error: "Invalid update data" });
  }
});

// DELETE /api/movies/:id – poista elokuva
app.delete("/api/movies/:id", async (req, res) => {
  try {
    const movie = await Movie.findByIdAndDelete(req.params.id);

    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }

    res.status(200).json({ message: "Deleted", id: movie._id });
  } catch (err) {
    res.status(400).json({ error: "Invalid id" });
  }
});

// -----
