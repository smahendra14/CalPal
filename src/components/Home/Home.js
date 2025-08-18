// file: Home.jsx

import React, { useState, useEffect, useRef } from "react";
// REMOVED: import { io } from "socket.io-client";
import "./Home.css";
import { Link } from "react-router-dom";

// This is now just for UI autocomplete convenience
const TOOL_OPTIONS = ["getCalendarEvents", "addCalendarEvents"];

const Home = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [status, setStatus] = useState("Idle"); // Simplified status
    const [threadId, setThreadId] = useState(null); // State to hold the conversation ID

    const [showToolPopup, setShowToolPopup] = useState(false);
    const [filteredTools, setFilteredTools] = useState(TOOL_OPTIONS);
    const [selectedToolIdx, setSelectedToolIdx] = useState(0);

    // REMOVED: const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // This effect runs once to generate a unique ID for the chat session
    useEffect(() => {
        setThreadId(`thread_${crypto.randomUUID()}`);
    }, []);

    // This effect handles auto-scrolling to the latest message (no changes needed)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);
    
    // NEW: The core logic for sending a message and handling the response
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || status === "Thinking..." || !threadId) {
            return;
        }

        const userMessage = { author: "user", text: inputValue };
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        
        const currentInput = inputValue;
        setInputValue("");
        setStatus("Thinking...");

        try {
            // Make the API call to your Express backend using fetch
            const response = await fetch("http://localhost:8000/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: currentInput,
                    thread_id: threadId,
                }),
            });

            if (!response.ok) {
                // Handle HTTP errors like 500, 404 etc.
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const botResponseText = await response.json();

            // Add the bot's successful response to the UI
            const botMessage = { author: "bot", text: botResponseText };
            setMessages((prevMessages) => [...prevMessages, botMessage]);

        } catch (error) {
            console.error("Error fetching from agent:", error);
            // Add an error message to the chat window for the user
            const errorMessage = { author: "bot", text: "Sorry, I couldn't get a response. Please try again." };
            setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } finally {
            // Reset status whether the API call succeeded or failed
            setStatus("Idle");
        }
    };
    
    // All other functions and the JSX below can remain exactly the same.
    // I am including them here for a complete, copy-paste-ready file.

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    useEffect(() => {
        const match = inputValue.match(/@(\w*)$/);
        if (match) {
            const query = match[1].toLowerCase();
            const filtered = TOOL_OPTIONS.filter((tool) => tool.startsWith(query));
            setFilteredTools(filtered);
            setShowToolPopup(filtered.length > 0);
            setSelectedToolIdx(0);
        } else {
            setShowToolPopup(false);
        }
    }, [inputValue]);
    
    const handleToolSelect = (tool) => {
        setInputValue((prev) => prev.replace(/@\w*$/, `@${tool} `));
        setShowToolPopup(false);
        inputRef.current?.focus();
    };

    const handleInputKeyDown = (e) => {
        if (showToolPopup && filteredTools.length > 0) {
            if (e.key === "Enter") {
                e.preventDefault();
                handleToolSelect(filteredTools[selectedToolIdx]);
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedToolIdx((idx) => (idx + 1) % filteredTools.length);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedToolIdx((idx) => (idx - 1 + filteredTools.length) % filteredTools.length);
            } else if (e.key === "Escape") {
                setShowToolPopup(false);
            }
        }
    };
    
    return (
        <div className="main-container chat-bg">
            <div className="chat-interface styled-chat">
                <div className="chat-header styled-header">
                    <h2>CalPal Assistant</h2>
                    <p className={`status ${status.toLowerCase()}`}>{status}</p>
                </div>
                <div className="messages-window styled-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-wrapper ${msg.author}`}>
                            <div className={`message-bubble ${msg.author}-bubble`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form
                    className="input-form styled-input-form"
                    onSubmit={handleSendMessage}
                    style={{ position: "relative" }}
                >
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleInputKeyDown}
                        placeholder="Ask me to schedule an event..."
                        disabled={status === "Thinking..."}
                        autoComplete="off"
                    />
                    <button type="submit" disabled={status === "Thinking..."} className="send-btn">
                        Send
                    </button>
                    {showToolPopup && (
                         <div className="tool-popup">
                             {filteredTools.map((tool, idx) => (
                                 <div
                                     key={tool}
                                     className={`tool-option${idx === selectedToolIdx ? " selected" : ""}`}
                                     onMouseDown={() => handleToolSelect(tool)}
                                 >
                                     @{tool}
                                 </div>
                             ))}
                         </div>
                     )}
                </form>
            </div>
            <footer className="footer">
                <div className="footer-content">
                    <Link to="/privacy" className="footer-link">Privacy Policy</Link>
                    <span className="footer-separator">•</span>
                    <Link to="/terms" className="footer-link">Terms of Service</Link>
                </div>
            </footer>
        </div>
    );
};

export default Home;