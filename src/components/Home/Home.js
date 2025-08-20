import React, { useState, useEffect, useRef } from "react";
import "./Home.css";

// --- Welcome Message Component (Unchanged) ---
const WelcomeHeader = ({ userName = "Asal Design" }) => (
    <div className="welcome-header">
        <h1>Hi, {userName}</h1>
        <h2>Can I help you with anything?</h2>
        <p>
            Ready to assist you with anything you need, from scheduling
            <br />
            events to telling you what's on your calendar. Let's get started!
        </p>
    </div>
);

// --- Confirmation Modal Component (Unchanged) ---
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

// --- NEW: View Events Modal Component ---
const ViewEventsModal = ({ isOpen, onClose, events }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Today's Schedule</h2>
                <div className="event-list">
                    {events && events.length > 0 ? (
                        events.map((event, index) => (
                            <div className="event-details" key={index}>
                                <p><strong>Event:</strong> {event.summary}</p>
                                <p><strong>Time:</strong> {new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(event.end.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        ))
                    ) : (
                        <p>You have no events scheduled for today.</p>
                    )}
                </div>
                <div className="modal-actions">
                    <button onClick={onClose} className="modal-button confirm">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- Quick Actions Component (Unchanged) ---
const QuickActions = ({ onActionClick }) => (
    <div className="quick-actions">
        <button
            className="quick-action-button"
            onClick={() =>
                onActionClick("Schedule a meeting for tomorrow at 10am")
            }
        >
            <i className="fas fa-calendar-plus"></i>
            <div className="quick-action-title">Quick Schedule</div>
            <div className="quick-action-subtitle">
                Create meeting for tomorrow
            </div>
        </button>
        <button
            className="quick-action-button"
            onClick={() => onActionClick("What events do I have today?")}
        >
            <i className="fas fa-calendar-day"></i>
            <div className="quick-action-title">Today's Schedule</div>
            <div className="quick-action-subtitle">View today's events</div>
        </button>
        <button
            className="quick-action-button"
            onClick={() =>
                onActionClick("Find me a free 1-hour slot this week")
            }
        >
            <i className="fas fa-clock"></i>
            <div className="quick-action-title">Find Free Time</div>
            <div className="quick-action-subtitle">Check availability</div>
        </button>
    </div>
);

// --- Main Chat Component ---
const Home = ({ session }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [status, setStatus] = useState("Idle");
    const [threadId, setThreadId] = useState(null);
    const messagesEndRef = useRef(null);

    // --- UPDATED State for all modals ---
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingEvent, setPendingEvent] = useState(null);
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [todayEvents, setTodayEvents] = useState([]);


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
            // console.log("response from the agent to frontend is", botResponseText);
            handleAgentResponse(botResponseText); // Pass to the new handler
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = {
                author: "bot",
                text: "Sorry, something went wrong.",
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setStatus("Idle");
        }
    };

    // --- REVISED Handler for ALL Agent Responses ---
    const handleAgentResponse = (response) => {
    let cleanResponse = response.trim();

    // Step 1: Clean the response string.
    // This reliably removes the markdown wrapper if it exists.
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        // If no JSON is found, treat it as a plain text message.
        const botMessage = { author: "bot", text: response };
        setMessages((prev) => [...prev, botMessage]);
        return;
    }
    
    cleanResponse = jsonMatch[0];

    let parsedResponse;
    try {
        // Step 2: Try to parse the cleaned response.
        parsedResponse = JSON.parse(cleanResponse);
    } catch (e) {
        // If parsing the extracted JSON fails, it's a malformed response.
        console.error("Failed to parse cleaned JSON:", e);
        const botMessage = { author: "bot", text: response }; // Show original response
        setMessages((prev) => [...prev, botMessage]);
        return;
    }

    // Step 3: Process the valid JSON object as before.
    if (parsedResponse.action && parsedResponse.payload) {
         if (parsedResponse.message) {
            const botTextMessage = { author: "bot", text: parsedResponse.message };
            setMessages((prev) => [...prev, botTextMessage]);
         }

        switch (parsedResponse.action) {
            case "CONFIRM_CREATE_EVENT":
                setPendingEvent(parsedResponse.payload);
                setShowConfirmModal(true);
                break;

            case "DISPLAY_TODAY_EVENTS":
                setTodayEvents(parsedResponse.payload.events || []);
                setShowEventsModal(true);
                break;

            default:
                console.warn("Received unknown action:", parsedResponse.action);
                // Even if the action is unknown, we've already shown the message.
                break;
        }
    } else {
         // The JSON was valid but didn't have the expected action/payload format.
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
        setMessages((prev) => [...prev, { author: 'bot', text: 'OK, I\'ve cancelled that.'}])
    };

    const handleQuickAction = (prompt) => {
        handleSendMessage(prompt);
    };

    return (
        <div className="main-container">
            <div className="content-container">
                {/* --- Render ALL Modals --- */}
                <ConfirmationModal
                    event={pendingEvent}
                    onConfirm={confirmAddEvent}
                    onCancel={cancelAddEvent}
                />
                <ViewEventsModal
                    isOpen={showEventsModal}
                    onClose={() => setShowEventsModal(false)}
                    events={todayEvents}
                />

                <div className="chat-interface">
                    {messages.length === 0 && (
                        <>
                            <WelcomeHeader
                                userName={session?.user?.email?.split("@")[0]}
                            />
                            <QuickActions onActionClick={handleQuickAction} />
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
                    <form
                        className="modern-input-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(inputValue);
                        }}
                    >
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
                            disabled={
                                !inputValue.trim() || status === "Thinking..."
                            }
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