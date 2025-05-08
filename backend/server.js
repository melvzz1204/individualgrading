const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Initialize Express app
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGO_URI =
  "mongodb+srv://melvz:melvz123@cluster0.undfyo6.mongodb.net/individual-grading?retryWrites=true&w=majority"; // Replace with your MongoDB URI
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    console.error(
      "Ensure your credentials, database name, and IP whitelist are correct."
    );
  });

// Define schema and model
const GradeSchema = new mongoose.Schema({
  group: String,
  section: String,
  students: [
    {
      name: String,
      performance: String,
    },
  ],
  comment: String,
  submittedBy: String,
  timestamp: { type: Date, default: Date.now },
});

const Grade = mongoose.model("Grade", GradeSchema);

// Routes
app.get("/grades", async (req, res) => {
  try {
    const grades = await Grade.find();
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

app.post("/grades", async (req, res) => {
  try {
    const grade = new Grade(req.body);
    await grade.save();
    res.status(201).json(grade);
  } catch (err) {
    res.status(400).json({ error: "Failed to save grade" });
  }
});

app.delete("/grades/:id", async (req, res) => {
  try {
    await Grade.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Grade deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete grade" });
  }
});

// Serve static files for the frontend
const frontendPath = path.join(__dirname, "../");
app.use(express.static(frontendPath));

// Catch-all route to serve index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
