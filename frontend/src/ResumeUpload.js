// frontend/src/ResumeUpload.js

import React, { useState } from 'react';
import axios from 'axios';

function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setAnalysis('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) return;

    const formData = new FormData();
    formData.append('resume', file);

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setAnalysis(response.data.analysis);
    } catch (err) {
      console.error("Upload error:", err);
      setAnalysis('Something went wrong during analysis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container" style={{ padding: "2rem" }}>
      <h2>Upload Your Resume</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button type="submit" style={{ marginTop: "1rem" }}>Analyze Resume</button>
      </form>

      {loading && <p>Analyzing your resume...</p>}

      {analysis && (
        <div style={{ marginTop: "2rem", whiteSpace: "pre-wrap" }}>
          <h3>Gemini Analysis:</h3>
          <p>{analysis}</p>
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
