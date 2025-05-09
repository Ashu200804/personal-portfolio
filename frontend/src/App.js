import React, { useState } from "react";
import axios from "axios";

function App() {
  const [resume, setResume] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [jobMatches, setJobMatches] = useState([]);

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setResume(file);
  };

  // Submit the resume for analysis
  const submitResume = async () => {
    const formData = new FormData();
    formData.append("resume", resume);

    try {
      const response = await axios.post("http://localhost:5000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAnalysisResult(response.data.resumeData);
      setJobMatches(response.data.jobMatches);
    } catch (error) {
      console.error("Error uploading resume:", error);
    }
  };

  return (
    <div className="App">
      <h1>Personal Portfolio</h1>
      <p>Skills: JavaScript, React, Node.js, Python</p>
      <p>Projects: Portfolio Website, Resume Analyzer</p>

      <div>
        <h2>Upload Resume for Analysis</h2>
        <input type="file" onChange={handleFileUpload} />
        <button onClick={submitResume}>Upload Resume</button>
      </div>

      {analysisResult && (
        <div>
          <h3>Resume Analysis</h3>
          <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
        </div>
      )}

      {jobMatches.length > 0 && (
        <div>
          <h3>Job Matches</h3>
          <ul>
            {jobMatches.map((job, index) => (
              <li key={index}>{job.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;