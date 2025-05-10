import React, { useState } from 'react';
import axios from 'axios';
import './ResumeUpload.css';

function ResumeUpload() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdFile, setJdFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('');

  const handleResumeChange = (e) => {
    setResumeFile(e.target.files[0]);
    setResult('');
    setMode('');
  };

  const handleJDChange = (e) => {
    setJdFile(e.target.files[0]);
    setJdText('');
  };

  const handleSubmit = async () => {
    if (!resumeFile || !mode) return;

    const formData = new FormData();
    formData.append('resume', resumeFile);

    if (mode === 'compare') {
      if (jdFile) formData.append('jobDescription', jdFile);
      else if (jdText) formData.append('jobText', jdText);
    }

    setLoading(true);
    setResult('');

    try {
      const endpoint = {
        details: '/resume-details',
        compare: '/compare-jd',
        feedback: '/resume-feedback',
      }[mode];

      const res = await axios.post(`http://localhost:5000${endpoint}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const rawOutput = res.data.analysis || res.data.feedback || 'No output';
      setResult(formatContent(rawOutput, mode));
    } catch (err) {
      console.error(err);
      setResult('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const formatContent = (text, mode) => {
    text = text.replace(/\*\*/g, '');

    if (mode === 'compare') {
      const [introPart, tablePart] = splitComparisonContent(text);
      const formattedIntro = formatComparisonPoints(introPart);
      const formattedTable = tablePart && tablePart.includes('|') ? formatAsTable(tablePart) : '';
      return `
        <div class="compare-intro">
          <p><strong>Compares the student’s extracted resume skills and experience with job descriptions.</strong></p>
          <ul>
            <li>Computes relevance scores and recommends suitable job openings.</li>
            <li>Displays a personalized, ranked list of job matches.</li>
          </ul>
        </div>
        <ul class="point-list">${formattedIntro}</ul>
        ${formattedTable}
      `;
    }

    const lines = text
      .split('\n')
      .map(line => line.replace(/^[-*●•\d.]+/, '').trim())
      .filter(line => line !== '');

    if (mode === 'feedback') {
      const summaryLines = [];
      const skills = [];
      let inSkillsSection = false;

      for (const line of lines) {
        if (line.toLowerCase().includes('suggested skills to add')) {
          inSkillsSection = true;
          continue;
        }
        inSkillsSection ? skills.push(line) : summaryLines.push(line);
      }

      const formattedSummary = summaryLines.map(point => `<li>${point}</li>`).join('');
      const formattedSkills = skills.map(skill => `<li>${skill}</li>`).join('');

      return `
        <div class="feedback-summary"><strong>Feedback:</strong></div>
        <ul class="feedback-list">${formattedSummary}</ul>
        <div class="feedback-skill-section">
          <strong>Suggested Skills to Add:</strong>
          <ul class="feedback-skills">${formattedSkills}</ul>
        </div>
      `;
    }

    return lines
      .map(line => {
        if (/^(name|contact|skills|experience|education|projects|certifications|soft skills)/i.test(line)) {
          return `<div class="section-title">${capitalizeFirstWord(line)}</div>`;
        } else {
          const isHighlight = /python|ml|data|react|node|aws|django|typescript|java|c\+\+|b\.tech|intern|match|eligible|strong/i.test(line);
          return `<div class="${isHighlight ? 'highlighted-line' : 'normal-line'}">${line}</div>`;
        }
      })
      .join('');
  };

  const splitComparisonContent = (text) => {
    const lines = text.split('\n');
    const tableStart = lines.findIndex(line => line.includes('|') && line.includes('---'));
    if (tableStart === -1) return [text, ''];
    const intro = lines.slice(0, tableStart).join('\n');
    const table = lines.slice(tableStart - 1).join('\n');
    return [intro, table];
  };

  const formatComparisonPoints = (text) => {
    return text
      .split('\n')
      .map(line => line.replace(/^[-*●•\d.]+/, '').trim())
      .filter(line => line)
      .map(line => {
        const highlight = /(eligible|match|strong|missing|excellent|recommended|not suitable|score|good|relevant|present|missing|fit)/i.test(line);
        return `<li class="${highlight ? 'highlighted-point' : 'normal-point'}">${line}</li>`;
      })
      .join('');
  };

  const formatAsTable = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    const header = lines[0].split('|').map(cell => cell.trim());
    const rows = lines.slice(2).map(line => line.split('|').map(cell => cell.trim()));

    let tableHTML = `<table class="styled-table"><thead><tr>`;
    header.forEach(h => tableHTML += `<th>${h}</th>`);
    tableHTML += `</tr></thead><tbody>`;

    rows.forEach(row => {
      tableHTML += '<tr>';
      row.forEach(cell => {
        const highlight = /match|high|excellent|yes|present/i.test(cell);
        tableHTML += `<td class="${highlight ? 'highlight-cell' : ''}">${cell}</td>`;
      });
      tableHTML += '</tr>';
    });

    tableHTML += '</tbody></table>';
    return tableHTML;
  };

  const capitalizeFirstWord = (text) => {
    const [first, ...rest] = text.split(' ');
    return `<span class="section-heading">${first}:</span> ${rest.join(' ')}`;
  };

  return (
    <div className="upload-container">

      <h1 style={{ textAlign: 'center', position: 'relative' }}>
  AI Resume Analyzer
  <img
    src="rvce-logo.png"
    alt="RVCE Logo"
    style={{ position: 'absolute', top: 0, right: 0, height: '60px' }}
  />
</h1>
      

      <div className="section">
        <label>Upload Resume (PDF):</label>
        <input type="file" accept="application/pdf" onChange={handleResumeChange} />
      </div>

      {resumeFile && (
        <div className="button-group">
          <button onClick={() => setMode('details')}>View Resume Details</button>
          <button onClick={() => setMode('compare')}>Compare with Job Description</button>
          <button onClick={() => setMode('feedback')}>Get Resume Feedback</button>
        </div>
      )}

      {mode === 'compare' && (
        <div className="section">
          <p>Upload JD file or paste below:</p>
          <input type="file" accept="application/pdf" onChange={handleJDChange} />
          <textarea
            rows="5"
            placeholder="Or paste job description here..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
        </div>
      )}

      {mode && (
        <div className="center-button">
          <button className="submit-btn" onClick={handleSubmit}>Submit</button>
        </div>
      )}

      {loading && <p className="loading">Analyzing...</p>}

      {result && (
        <div className="result-box">
          <div dangerouslySetInnerHTML={{ __html: result }} />
        </div>
      )}
    </div>
  );
}

export default ResumeUpload;
