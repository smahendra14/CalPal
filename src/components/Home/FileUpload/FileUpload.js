import React, { useState } from "react";
import { extractEventInfoFromFile } from "../../../functions/langchainFunctions.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;


const FileUpload = () => {
  const [pdfText, setPdfText] = useState("");
  const [events, setEvents] = useState([]);
  const [file, setFile] = useState();
  const [loading, setLoading] = useState(false);

  const extractTextFromPDF = async (file) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const typedArray = new Uint8Array(event.target.result);

      // Load the PDF
      const loadingTask = pdfjsLib.getDocument(typedArray);
      const pdf = await loadingTask.promise;

      let extractedText = "";

      // Loop through all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        // Extract text items
        const pageText = textContent.items.map((item) => item.str).join(" ");
        extractedText += `\nPage ${i}:\n${pageText}`;
      }

      try { 
        const events = await extractEventInfoFromFile(extractedText);
        console.log(events);
        setEvents(events);
      } catch (e) { 
        alert("Error parsing the file you uploaded. Please try again with a different file.");
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = async (event) => {
    if (file && file.type === "application/pdf") {
        try {
            await extractTextFromPDF(file); 
          } catch (error) {
            alert("Error parsing the file you uploaded. Please try again with a different file.");
          } 
      } else {
        alert("Please upload a valid PDF file.");
      }
  }

  const handleFileChange = (event) => {
    const uploadedFile = event.target.files[0];
    setFile(uploadedFile);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>PDF Upload and Event Display</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>
        Upload
      </button>
      {loading && 
        <p>Loading ...</p>
      }

      {/* Event Display Section */}
      <div style={{ marginTop: "20px" }}>
        <h2>Extracted Events:</h2>
        {events.length > 0 ? (
          <ul>
            {events.map((event, index) => (
              <li key={index} style={{ marginBottom: "10px" }}>
                <strong>Title:</strong> {event.title} <br />
                <strong>Date:</strong> {event.date} <br />
                <strong>Time:</strong> {event.startTime} - {event.endTime}
              </li>
            ))}
          </ul>
        ) : (
          <p>Upload a PDF to extract events.</p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
