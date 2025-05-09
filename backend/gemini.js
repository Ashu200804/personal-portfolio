const axios = require('axios');
require('dotenv').config();

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function analyzeResumeWithGemini(resumeText) {
  try {
    const prompt = `
You are an intelligent resume analyzer. Given the following resume text, extract:

- Candidate’s name
- Contact information
- Technical skills
- Soft skills
- Work experience (role, company, duration)
- Education (degree, institution, year)
- Certifications
- Projects

Here is the resume content:
"""
${resumeText}
"""`;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [
        { parts: [{ text: prompt }] }
      ]
    });

    return response.data;
  } catch (err) {
    console.error('Gemini API Error:', err);
    return { error: 'Failed to analyze resume.' };
  }
}

// Export the function
module.exports = { analyzeResumeWithGemini };
