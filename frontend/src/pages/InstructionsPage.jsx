import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import "./Styles/Instruction.css"; 

export default function InstructionsPage() {
      useEffect(() => {
      document.title = "Instructions";
    }, []);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState("");

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // NEW — download extension by folder
  const downloadExtension = async (type) => {
    setDownloading(type);

    try {
      const folder = type === "chrome" ? "activityEx-chrome" : "activityEx-firefox";
      const zip = new JSZip();

      const files = ["manifest.json", "background.js", "focus.html", "focus.js", "activity-tracker.js", "s_logo.png", "popup.html"];

      for (const file of files) {
        const response = await fetch(`/${folder}/${file}`);
        if (!response.ok) throw new Error(`Missing file: ${file}`);
        if (file.endsWith(".png") || file.endsWith(".jpg") || file.endsWith(".ico")) {
          const blob = await response.arrayBuffer();
          zip.file(file, blob, { binary: true });
        } else {
          zip.file(file, await response.text());
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${folder}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      alert("Failed to download extension files.");
    }

    setDownloading("");
  };

  return (
    <div className="inst-container">
      <div className="inst-card">

        <div className="inst-header">
          <h1>Extension Setup Guide</h1>
        </div>

        <p className="inst-desc">
          Follow the steps below to install and set up the Focus Module browser extension.
        </p>


        {/* Download Section */}
        <div className="inst-box center">
          <h2>Step 1: Download Your Extension</h2>
          <p>Select your browser version:</p>

          <button
            className="primary-btn"
            disabled={downloading === "chrome"}
            onClick={() => downloadExtension("chrome")}
          >
            {downloading === "chrome" ? "Downloading..." : "Download for Chrome"}
          </button>

          <br /><br />

          <button
            className="primary-btn"
            disabled={downloading === "firefox"}
            onClick={() => downloadExtension("firefox")}
          >
            {downloading === "firefox" ? "Downloading..." : "Download for Firefox"}
          </button>
          
        </div>

        <ul>
            <li>Locate the downloaded ZIP file (usually in your Downloads folder)</li>
            <li>Right-click the ZIP file and select "Extract All..." or "Extract Here"</li>
            <li>Remember the location where you extracted the files - you'll need it in the next step</li>
        </ul>

        {/* Chrome Install Section */}
        <div className="inst-section">
          <h2>Step 2A: Install in Chrome / Brave / Edge</h2>

          <div className="step-card">
            <span className="step-number">1</span>
            <div>
              <h3>Open Extensions Page</h3>
              <p>Go to <code className="code-box">chrome://extensions</code></p>
              <button
                className={`copy-btn ${copied ? "copied" : ""}`}
                onClick={() => copyToClipboard("chrome://extensions")}
              >
                {copied ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>

          <div className="step-card">
            <span className="step-number">2</span>
            <div>
              <h3>Enable Developer Mode</h3>
              <p>Toggle "Developer Mode" in the top-right</p>
            </div>
          </div>

          <div className="step-card">
            <span className="step-number">3</span>
            <div>
              <h3>Click on 'Load Unpacked'</h3>
              <p>Select the folder where you extracted the ZIP file</p>
            </div>
          </div>
        </div>

        {/* Firefox Install Section */}
        <div className="inst-section">
          <h2>Step 2B: Install in Firefox</h2>

          <div className="step-card">
            <span className="step-number">1</span>
            <div>
              <h3>Open Temporary Add-ons</h3>
              <p>
                Go to <code className="code-box">about:debugging#/runtime/this-firefox</code>
              </p>
              <button
                className={`copy-btn ${copied ? "copied" : ""}`}
                onClick={() => copyToClipboard("about:debugging#/runtime/this-firefox")}
              >
                {copied ? "Copied!" : "Copy URL"}
              </button>
            </div>
          </div>

          <div className="step-card">
            <span className="step-number">2</span>
            <div>
              <h3>Load Temporary Add-on</h3>
              <p>Select <code className="code-box">(Folder where you extracted your ZIP file)/manifest.json</code></p>
            </div>
          </div>

          <div className="step-card">
            <span className="step-number">3</span>
            <div>
              <h3>Extension Installed!</h3>
              <p>You may need to re-load it when restarting Firefox</p>
            </div>
          </div>
        </div>

        <div className="footer-cta">
          <h2>Ready to continue?</h2>
          <p>Go add blocked sites now!</p>
          <button className="white-btn" onClick={() => navigate("/settings")}>
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  );
}
