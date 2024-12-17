import React, { useState } from "react";
import { extractEventInfoFromFile } from "../../../functions/langchainFunctions.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/web/pdf_viewer.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;


const FileUpload = () => {
  const [file, setFile] = useState(null);
  const [events, setEvents] = useState([]);
  const [pdfText, setPdfText] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    console.log(file);
  };

  const extractInfo = async () => {
    extractEventInfoFromFile(file);
  }

  const extractTextFromPDF = async (file) => {
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

      setPdfText(extractedText);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];

    if (file && file.type === "application/pdf") {
      extractTextFromPDF(file);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>PDF Upload and Display</h1>
      <input type="file" accept="application/pdf" onChange={handleFileUpload} />
      <div style={{ whiteSpace: "pre-wrap", marginTop: "20px" }}>
        <h2>Extracted PDF Text:</h2>
        {pdfText || "Upload a PDF to see its contents."}
      </div>
    </div>
  );
};

export default FileUpload;
