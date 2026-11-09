import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import { readError } from "../../utils/api.js";
import RecapModal from "./RecapModal.js";

// --- Welcome Message Component ---
const WelcomeHeader = ({ userName = "Asal Design" }) => (
    <div className="welcome-header">
        <h1>Welcome!</h1>
        <h2>Can I help you with anything?</h2>
        <p>
            Ready to assist you with anything you need, from scheduling
            <br />
            events to telling you what's on your calendar. Let's get started!
        </p>
    </div>
);

// --- Confirmation Modal Component ---
const ConfirmationModal = ({ event, onConfirm, onCancel, isAdding }) => {
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
                    <button
                        onClick={onCancel}
                        className="modal-button cancel"
                        disabled={isAdding}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="modal-button confirm"
                        disabled={isAdding}
                    >
                        {isAdding ? (
                            <>
                                <i className="fas fa-spinner fa-spin"></i> Adding...
                            </>
                        ) : (
                            "Confirm & Add"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- View Events Modal Component ---
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
                                <p>
                                    <strong>Event:</strong> {event.summary}
                                </p>
                                <p>
                                    <strong>Time:</strong>{" "}
                                    {new Date(
                                        event.start.dateTime
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}{" "}
                                    -{" "}
                                    {new Date(
                                        event.end.dateTime
                                    ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </p>
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

// --- Quick Actions Component ---
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
        <button
            className="quick-action-button"
            onClick={() => onActionClick("Give me a recap of my calendar")}
        >
            <i className="fas fa-chart-bar"></i>
            <div className="quick-action-title">Calendar Recap</div>
            <div className="quick-action-subtitle">Where your time went</div>
        </button>
    </div>
);

// --- File Preview Component ---
const FilePreview = ({ name, onRemove }) => (
    <div className="file-preview">
        <i className="fas fa-file-pdf"></i>
        <span className="file-name">{name}</span>
        <button className="remove-file" onClick={onRemove}>
            <i className="fas fa-times"></i>
        </button>
    </div>
);

// --- Main Chat Component ---
const Home = ({ session }) => {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [status, setStatus] = useState("Idle");
    const [threadId, setThreadId] = useState(null);
    const [uploading, setUploading] = useState(false);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    const [pendingEvent, setPendingEvent] = useState(null);
    const [showEventsModal, setShowEventsModal] = useState(false);
    const [todayEvents, setTodayEvents] = useState([]);
    const [showRecap, setShowRecap] = useState(false);

    // selectedFile is picked but not uploaded yet; attachedDocument is uploaded and used by the chat
    const [selectedFile, setSelectedFile] = useState(null);
    const [attachedDocument, setAttachedDocument] = useState(null);

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

            // A newly picked PDF is uploaded first, then stays attached to the chat
            let documentId = attachedDocument?.id;
            if (selectedFile) {
                setUploading(true);
                const tempBotMessage = {
                    author: "bot",
                    text: `Processing "${selectedFile.name}"...`,
                };
                setMessages((prev) => [...prev, tempBotMessage]);

                const formData = new FormData();
                formData.append("file", selectedFile);
                const uploadResponse = await fetch(`${process.env.REACT_APP_API_URL}/api/pdf/upload`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${supabaseAccessToken}`,
                    },
                    body: formData,
                });
                if (!uploadResponse.ok) {
                    throw new Error(await readError(uploadResponse, "File upload failed."));
                }

                documentId = (await uploadResponse.json()).documentId;
                setAttachedDocument({ id: documentId, name: selectedFile.name });
                clearSelectedFile();
                setMessages((prev) => prev.filter((msg) => msg !== tempBotMessage));
            }

            // The agent searches the attached PDF itself, so follow-up questions keep their context
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/calendar/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAccessToken}`,
                },
                body: JSON.stringify({
                    prompt,
                    thread_id: threadId,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    documentId,
                }),
            });

            if (!response.ok) throw new Error(await readError(response, "Server error"));

            handleAgentReply(await response.json());
        } catch (error) {
            console.error("Error sending message:", error);
            const errorMessage = {
                author: "bot",
                text: error.message || "Sorry, something went wrong.",
            };
             // Clear any temporary messages on error
            setMessages(prev => prev.filter(m => !m.text.startsWith('Processing "')));
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setStatus("Idle");
            setUploading(false);
            if (selectedFile) clearSelectedFile(); // Clean up file input on error too
        }
    };

    // The backend always replies with { type: "text" | "confirm_event" | "events", message, event?, events? }
    const handleAgentReply = (reply) => {
        setMessages((prev) => [...prev, { author: "bot", text: reply.message }]);
        if (reply.type === "confirm_event") {
            setPendingEvent(reply.event);
        } else if (reply.type === "events") {
            setTodayEvents(reply.events);
            setShowEventsModal(true);
        } else if (reply.type === "recap") {
            setShowRecap(true);
        }
    };

    const confirmAddEvent = async () => {
        if (!pendingEvent || !session) return;

        setStatus("Thinking...");

        try {
            const supabaseAccessToken = session.access_token;
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/calendar/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${supabaseAccessToken}`,
                },
                body: JSON.stringify(pendingEvent),
            });

            if (!response.ok) {
                throw new Error(await readError(response, "Failed to create event."));
            }

            const result = await response.json();

            const botMessage = { author: "bot", text: result.message, link: result.link };
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
        setPendingEvent(null);
        setMessages((prev) => [
            ...prev,
            { author: "bot", text: "OK, I've cancelled that." },
        ]);
    };

    const handleQuickAction = (prompt) => {
        handleSendMessage(prompt);
    };

    const handleFileSelect = (file) => {
        if (!file) return;

        const maxSize = 10 * 1024 * 1024; // 10MB limit

        if (file.size > maxSize) {
            setMessages((prev) => [
                ...prev,
                {
                    author: "bot",
                    text: "File is too large. Please upload a PDF under 10MB.",
                },
            ]);
            return;
        }

        if (file.type !== "application/pdf") {
            setMessages((prev) => [
                ...prev,
                {
                    author: "bot",
                    text: "Please upload a PDF file.",
                },
            ]);
            return;
        }

        setSelectedFile(file);
        setMessages((prev) => [
            ...prev,
            {
                author: "bot",
                text: `PDF "${file.name}" selected. You can now send your message.`,
            },
        ]);
    };

    const clearSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input
        }
    };

    const handleRemoveFile = () => {
        clearSelectedFile();
        setAttachedDocument(null);
    };

    return (
        <div className="main-container">
            <div className="content-container">
                <ConfirmationModal
                    event={pendingEvent}
                    onConfirm={confirmAddEvent}
                    onCancel={cancelAddEvent}
                    isAdding={status === "Thinking..."}
                />
                <ViewEventsModal
                    isOpen={showEventsModal}
                    onClose={() => setShowEventsModal(false)}
                    events={todayEvents}
                />
                {showRecap && (
                    <RecapModal session={session} onClose={() => setShowRecap(false)} />
                )}

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
                                    {msg.link && (
                                        <>
                                            {" "}
                                            <a href={msg.link} target="_blank" rel="noreferrer">
                                                View in Google Calendar
                                            </a>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                        {status === "Thinking..." && !uploading && !pendingEvent && (
                            <div className="message-wrapper bot">
                                <div className="message-bubble bot-bubble">
                                    <i className="fas fa-spinner fa-spin"></i> Thinking...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
            </div>
            <div className="input-area">
                <div className="input-container">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".pdf"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            if (e.target.files?.[0]) {
                                handleFileSelect(e.target.files[0]);
                            }
                        }}
                    />
                    {(selectedFile || attachedDocument) && (
                        <FilePreview
                            name={(selectedFile || attachedDocument).name}
                            onRemove={handleRemoveFile}
                        />
                    )}
                    <form
                        className="modern-input-form"
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage(inputValue);
                        }}
                    >
                        <div className="input-tools">
                            <button
                                type="button"
                                className="tool-button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <i className="fas fa-file-pdf"></i>
                            </button>
                        </div>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={
                                selectedFile || attachedDocument
                                    ? "Ask a question about your PDF..."
                                    : "Ask CalPal anything..."
                            }
                            disabled={status === "Thinking..." || uploading}
                        />
                        <button
                            type="submit"
                            className="send-button"
                            disabled={
                                !inputValue.trim() || status === "Thinking..." || uploading
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
