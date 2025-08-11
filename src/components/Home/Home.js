// file: Home.jsx

import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import "./Home.css"; // We'll provide updated styles for this
import { Link } from "react-router-dom";

// The Home component is now our main Chat Interface
const Home = ({ session }) => { // Supabase, isLoading, etc. are no longer needed for the chat
    // State for the conversation history, the current input, and the connection status
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [status, setStatus] = useState("Connecting...");

    // Refs to hold the socket instance and a reference to the end of the message list for auto-scrolling
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);

    // This effect runs once when the component mounts to set up the WebSocket connection
    useEffect(() => {
        // Connect to your backend server.
        // IMPORTANT: In production, replace 'http://localhost:8000' with your Vercel backend URL.
        const socket = io("http://localhost:8000");
        socketRef.current = socket;

        // --- Event Listeners ---
        socket.on("connect", () => setStatus("Connected"));
        socket.on("disconnect", () => setStatus("Disconnected"));
        socket.on("status_update", (msg) => setStatus(msg));

        // This listener handles the final response from the agent
        socket.on("chat_response", (responseMsg) => {
            const botMessage = { author: "bot", text: responseMsg };
            setMessages((prevMessages) => [...prevMessages, botMessage]);
            setStatus("Connected"); // Reset status after a response is received
        });

        // Cleanup function to disconnect the socket when the component unmounts
        return () => {
            socket.disconnect();
        };
    }, []); // The empty dependency array [] ensures this runs only once.

    // This effect handles auto-scrolling to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (inputValue.trim() && socketRef.current && status !== 'Thinking...') {
            // Add the user's message to the UI immediately
            const userMessage = { author: "user", text: inputValue };
            setMessages((prevMessages) => [...prevMessages, userMessage]);

            // Emit the message to the backend agent
            socketRef.current.emit("chat_message", inputValue);

            // Clear the input field
            setInputValue("");
        }
    };

    return (
        <div className="main-container">
            <div className="chat-interface">
                {/* Header Section */}
                <div className="chat-header">
                    <h2>CalPal Assistant</h2>
                    <p className={`status ${status.toLowerCase().replace(/\s/g, '-')}`}>
                        {status}
                    </p>
                </div>

                {/* Messages Window */}
                <div className="messages-window">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-wrapper ${msg.author}`}>
                            <div className="message-bubble">{msg.text}</div>
                        </div>
                    ))}
                    {/* Empty div to which we can scroll */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Form */}
                <form className="input-form" onSubmit={handleSendMessage}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Ask me to schedule an event or look up a stock..."
                        disabled={status === "Thinking..."}
                    />
                    <button type="submit" disabled={status === "Thinking..."}>
                        Send
                    </button>
                </form>
            </div>
            
            {/* Footer remains the same */}
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