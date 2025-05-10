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

const upload = multer({ dest: 'uploads/' });

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Helper: Extract text from PDF
async function extractPdfText(filePath) {
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  fs.unlinkSync(filePath);
  return data.text;
}

// Helper: Call Gemini API
async function queryGemini(prompt) {
  const response = await axios.post(
    GEMINI_API_URL,
    {
      contents: [{ parts: [{ text: prompt }] }]
    },
    {
      headers: { 'Content-Type': 'application/json' },
      params: { key: GEMINI_API_KEY }
    }
  );
  return response.data.candidates[0].content.parts[0].text;
}

// Endpoint 1: Extract polished resume details
app.post('/resume-details', upload.single('resume'), async (req, res) => {
  try {
    const resumeText = await extractPdfText(req.file.path);
    const prompt = `
You are a resume analyzer. Extract and format the following details in a well-structured, polished, and presentable format:
- Name
- Contact Information
- Technical Skills
- Soft Skills
- Education (degree, institution, year)
- Work Experience (role, company, duration)
- Certifications
- Projects

Present the result clearly with sections and bullet points, not as raw text.

Resume:
"""${resumeText}"""
`;

    const output = await queryGemini(prompt);
    res.json({ analysis: output });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: 'Error processing resume details.' });
  }
});

// Endpoint 2: Compare resume with job description
app.post('/compare-jd', upload.fields([{ name: 'resume' }, { name: 'jobDescription' }]), async (req, res) => {
  try {
    const resumeFile = req.files['resume'][0];
    const resumeText = await extractPdfText(resumeFile.path);

    let jdText = '';
    if (req.files['jobDescription']) {
      const jdFile = req.files['jobDescription'][0];
      jdText = await extractPdfText(jdFile.path);
    } else if (req.body.jobText) {
      jdText = req.body.jobText;
    }

    const prompt = `
You are a hiring assistant. Given the resume and job description below:
- Determine if the candidate meets the job criteria.
- Highlight matching skills between the resume and job description.
- List key missing skills or experience.
- Explain eligibility clearly.
- If the candidate is not eligible, explain why.

Resume:
"""${resumeText}"""

Job Description:
"""${jdText}"""
`;

    const output = await queryGemini(prompt);
    res.json({ analysis: output });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: 'Error comparing resume with job description.' });
  }
});

// Endpoint 3: Provide resume improvement feedback
app.post('/resume-feedback', upload.single('resume'), async (req, res) => {
  try {
    const resumeText = await extractPdfText(req.file.path);

    const prompt = `
Analyze the resume below and return:

Summary:
- List 9–10 short bullet points (1–2 lines each) on areas of improvement in formatting, clarity, content, or missing sections.

Suggested Skills to Add:
- List only the skills (no explanations or numbering).

Resume:
"""${resumeText}"""
`;




    const output = await queryGemini(prompt);
    res.json({ feedback: output });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ success: false, message: 'Error generating resume feedback.' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
