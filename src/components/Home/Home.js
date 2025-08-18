import React, { useState, useEffect, useRef } from "react";
import "./Home.css"; // Make sure you have styles for the modal
import { Link } from "react-router-dom";

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ event, onConfirm, onCancel }) => {
    if (!event) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Event Details</h2>
                <p>Does this look correct?</p>
                <div className="event-details">
                    <p><strong>Event:</strong> {event.summary}</p>
                    <p><strong>Start:</strong> {new Date(event.start.dateTime).toLocaleString()}</p>
                    <p><strong>End:</strong> {new Date(event.end.dateTime).toLocaleString()}</p>
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel} className="modal-button cancel">Cancel</button>
                    <button onClick={onConfirm} className="modal-button confirm">Confirm & Add</button>
                </div>
            </div>
        </div>
    );
};

// --- Main Chat Component ---
const Home = () => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [status, setStatus] = useState("Idle");
    const [threadId, setThreadId] = useState(null);
    
    // State for the confirmation flow
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingEvent, setPendingEvent] = useState(null);

    const messagesEndRef = useRef(null);

    useEffect(() => {
        setThreadId(`thread_${crypto.randomUUID()}`);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleAgentResponse = (response) => {
        try {
            // Check if the agent's response contains a JSON object for confirmation
            const parsedResponse = JSON.parse(response);
            if (parsedResponse.needs_confirmation && parsedResponse.event_details) {
                setPendingEvent(parsedResponse.event_details);
                setShowConfirmModal(true);
                // Add a message to the chat to prompt the user
                const botMessage = { author: "bot", text: "I've prepared the event details for you. Please review them." };
                setMessages((prev) => [...prev, botMessage]);
                return; // Stop further processing
            }
        } catch (e) {
            // It's not a JSON object, so treat it as a regular text response
            const botMessage = { author: "bot", text: response };
            setMessages((prev) => [...prev, botMessage]);
        }
    };

    const handleSendMessage = async (prompt) => {
        if (!prompt || status === "Thinking...") return;

        const userMessage = { author: "user", text: prompt };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setStatus("Thinking...");

        try {
            // TODO: Get the real JWT from your auth provider
            const jwt = "YOUR_SESSION_JWT_HERE";

            const response = await fetch("http://localhost:8000/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${jwt}`,
                },
                body: JSON.stringify({ prompt, thread_id: threadId }),
            });

            if (!response.ok) throw new Error("Server error");
            
            const botResponseText = await response.json();
            handleAgentResponse(botResponseText);

        } catch (error) {
            const errorMessage = { author: "bot", text: "Sorry, I ran into an error." };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setStatus("Idle");
        }
    };
    
    // --- Modal Action Handlers ---
    const confirmAddEvent = () => {
        // Send the confirmation and the pending event details back to the agent
        const confirmationPrompt = `Yes, please create the event with these details: ${JSON.stringify(pendingEvent)}`;
        handleSendMessage(confirmationPrompt);
        setShowConfirmModal(false);
        setPendingEvent(null);
    };

    const cancelAddEvent = () => {
        // Send a cancellation message to the agent so it knows the context
        handleSendMessage("Never mind, please cancel the event creation.");
        setShowConfirmModal(false);
        setPendingEvent(null);
    };

    return (
        <div className="main-container chat-bg">
            <ConfirmationModal
                event={pendingEvent}
                onConfirm={confirmAddEvent}
                onCancel={cancelAddEvent}
            />
            <div className="chat-interface styled-chat">
                <div className="chat-header styled-header">
                    <h2>CalPal Assistant</h2>
                    <p className="status">{status}</p>
                </div>
                <div className="messages-window styled-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-wrapper ${msg.author}`}>
                            <div className={`message-bubble ${msg.author}-bubble`}>{msg.text}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form
                    className="input-form"
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputValue); }}
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Schedule an event or ask about your day..."
                        disabled={status === "Thinking..."}
                    />
                    <button type="submit" disabled={status === "Thinking..."}>Send</button>
                </form>
            </div>
             {/* Your Footer Here */}
        </div>
    );
};

export default Home;