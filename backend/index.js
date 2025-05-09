const express = require("express");
const multer = require("multer");
const bodyParser = require("body-parser");
const axios = require("axios");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5000;

// Middleware
app.use(bodyParser.json());
const upload = multer({ dest: "uploads/" });

// Job listings (mock data for demonstration)
const jobListings = [
  { title: "Software Engineer", requiredSkills: ["JavaScript", "React", "Node.js"] },
  { title: "Backend Developer", requiredSkills: ["Node.js", "Python", "AWS"] },
];

// Job matching logic
const matchJobs = (skills) => {
  return jobListings.filter((job) =>
    job.requiredSkills.some((skill) => skills.includes(skill))
  );
};

// Resume upload and analysis
app.post("/upload", upload.single("resume"), async (req, res) => {
  const resumePath = path.join(__dirname, req.file.path);

  // Read the resume content
  const resumeContent = fs.readFileSync(resumePath, "utf-8");

  try {
    // Call the Gemini API to analyze the resume (assuming you've set up an API key for Gemini NLP)
    const geminiResponse = await axios.post(
      "https://api.gemini.com/analyze",
      {
        document: resumeContent,
      },
      {
        headers: {
          "Authorization": `Bearer AIzaSyDxuQInhGeuGfgF4pPMua-gmgyjRHgJT-0`,
        },
      }
    );

    const resumeData = geminiResponse.data; // This will contain extracted skills, experience, etc.
    const matchedJobs = matchJobs(resumeData.skills);

    res.json({
      message: "Resume uploaded and analyzed successfully",
      resumeData: resumeData,
      jobMatches: matchedJobs,
    });

    // Clean up uploaded file
    fs.unlinkSync(resumePath);
  } catch (error) {
    console.error("Error analyzing resume:", error);
    res.status(500).json({ error: "Error analyzing resume" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
