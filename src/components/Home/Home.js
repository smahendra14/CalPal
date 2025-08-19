import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import { Link } from "react-router-dom";

// --- New Welcome Message Component ---
const WelcomeHeader = ({ userName = "Asal Design" }) => (
    <div className="welcome-header">
        {/* <div className="logo-icon"></div> */}
        <h1>Hi, {userName}</h1>
        <h2>Can I help you with anything?</h2>
        <p>
            Ready to assist you with anything you need, from scheduling
            <br />
            events to telling you what's on your calendar. Let's get started!
        </p>
    </div>
);

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ event, onConfirm, onCancel }) => {
    if (!event) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Event Details</h2>
                <p>Does this look correct?</p>
                <div className="event-details">
                    <p>
                        <strong>Event:</strong> {event.summary}
                    </p>
                    <p>
                        <strong>Start:</strong>{" "}
                        {new Date(event.start.dateTime).toLocaleString()}
                    </p>
                    <p>
                        <strong>End:</strong>{" "}
                        {new Date(event.end.dateTime).toLocaleString()}
                    </p>
                </div>
                <div className="modal-actions">
                    <button onClick={onCancel} className="modal-button cancel">
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="modal-button confirm"
                    >
                        Confirm & Add
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Quick Actions Component ---
const QuickActions = () => (
    <div className="quick-actions">
        <button className="quick-action-button">
            <i className="fas fa-plane"></i>
            <div className="quick-action-title">Wanderlust Destinations 2024</div>
            <div className="quick-action-subtitle">Must-Visit Places</div>
        </button>
        <button className="quick-action-button">
             <div className="logo-icon-small"></div>
            <div className="quick-action-title">CalPal AI: What Sets Us Apart</div>
            <div className="quick-action-subtitle">Key Differentiators</div>
        </button>
        <button className="quick-action-button">
            <i className="fas fa-times"></i>
            <div className="quick-action-title">Design Trends on TikTok 2024</div>
            <div className="quick-action-subtitle">Trending Now</div>
        </button>
    </div>
);


// --- Main Chat Component ---
const Home = ({ session }) => {
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

    const handleSendMessage = async (prompt) => {
        if (!prompt || status === "Thinking...") return;

        if (!session) {
            setMessages((prev) => [
                ...prev,
                { author: "bot", text: "Please log in to use the assistant." },
            ]);
            return;
        }

        const userMessage = { author: "user", text: prompt };
        setMessages((prev) => [...prev, userMessage]);
        setInputValue("");
        setStatus("Thinking...");

        try {
            const supabaseAccessToken = session.access_token;

            const response = await fetch("http://localhost:8000/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAccessToken}`,
                },
                body: JSON.stringify({ prompt, thread_id: threadId }),
            });

            if (!response.ok) throw new Error("Server error");

            const botResponseText = await response.text();
            handleAgentResponse(botResponseText);
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = { author: "bot", text: "Sorry, something went wrong." };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setStatus("Idle");
        }
    };

    const handleAgentResponse = (response) => {
        try {
            const parsedResponse = JSON.parse(response);
            if (
                parsedResponse.needs_confirmation &&
                parsedResponse.event_details
            ) {
                setPendingEvent(parsedResponse.event_details);
                setShowConfirmModal(true);
                const botMessage = {
                    author: "bot",
                    text: "I've prepared the event details for you. Please review them.",
                };
                setMessages((prev) => [...prev, botMessage]);
                return;
            }
        } catch (e) {
            const botMessage = { author: "bot", text: response };
            setMessages((prev) => [...prev, botMessage]);
        }
    };

    const confirmAddEvent = async () => {
        if (!pendingEvent || !session) return;

        setShowConfirmModal(false);
        setStatus("Thinking...");

        try {
            const supabaseAccessToken = session.access_token;
            const response = await fetch("http://localhost:8000/create-event", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAccessToken}`,
                },
                body: JSON.stringify(pendingEvent),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || "Failed to create event.");
            }

            const botMessage = { author: "bot", text: result.message };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error("Error creating event:", error);
            const errorMessage = { author: "bot", text: error.message };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setStatus("Idle");
            setPendingEvent(null);
        }
    };

    const cancelAddEvent = () => {
        setShowConfirmModal(false);
        setPendingEvent(null);
    };

    return (
        <div className="main-container">
            {/* <div className="top-bar">
                <div className="logo-text">CalPal</div>
                <div className="user-icon">
                    <i className="fas fa-user"></i>
                </div>
            </div> */}
            <div className="content-container">
                <ConfirmationModal
                    event={pendingEvent}
                    onConfirm={confirmAddEvent}
                    onCancel={cancelAddEvent}
                />

                <div className="chat-interface">
                    {messages.length === 0 && (
                        <>
                            <WelcomeHeader userName={session?.user?.email?.split("@")[0]} />
                            <QuickActions />
                        </>
                    )}

                    <div className="messages-window">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message-wrapper ${msg.author}`}
                            >
                                <div
                                    className={`message-bubble ${msg.author}-bubble`}
                                >
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
            <div className="input-area">
                 <div className="input-container">
                    {/* <button type="button" className="tool-button-left">
                        <i className="fas fa-th-large"></i>
                    </button> */}
                    <form
                        className="modern-input-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(inputValue);
                        }}
                    >
                        {/* <button type="button" className="tool-button">
                           <div className="logo-icon-small"></div>
                        </button> */}
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask CalPal anything..."
                            disabled={status === "Thinking..."}
                        />
                        <button
                            type="submit"
                            className="send-button"
                            disabled={!inputValue.trim() || status === "Thinking..."}
                        >
                            Send <i className="fas fa-arrow-right"></i>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Home;
