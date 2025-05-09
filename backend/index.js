// backend/index.js

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Upload folder for resumes
const upload = multer({ dest: 'uploads/' });

/**
 * POST /analyze
 * - Accepts resume file
 * - Extracts text from PDF
 * - Sends to Gemini API for intelligent analysis
 */
app.post('/analyze', upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const filePath = path.join(__dirname, req.file.path);
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const resumeText = pdfData.text;

    // Send to Gemini API
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      {
        contents: [{
          parts: [{
            text: `Analyze the following resume and extract key skills, experience, education, and suggest jobs, improvements, and missing skills:\n\n${resumeText}`
          }]
        }]
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const geminiOutput = geminiResponse.data.candidates[0].content.parts[0].text;

    res.json({
      success: true,
      analysis: geminiOutput
    });

    // Clean up uploaded file
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: 'Error processing resume.' });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Backend running on http://localhost:${PORT}`));
