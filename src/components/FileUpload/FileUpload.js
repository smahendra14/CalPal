import React, { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./FileUpload.css";

// --- Helper Component for Event Display ---
const EventCard = ({ event, onAddToCalendar, isAdding }) => {
    const formatDate = (dateTime) => {
        if (!dateTime) return "N/A";
        return new Date(dateTime).toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    return (
        <div className="event-card">
            <h3 className="event-summary">{event.summary}</h3>
            <p className="event-description">
                {event.description || "No description provided."}
            </p>
            <div className="event-times">
                <p>
                    <strong>Start:</strong> {formatDate(event.start?.dateTime)}
                </p>
                <p>
                    <strong>End:</strong> {formatDate(event.end?.dateTime)}
                </p>
            </div>
            <button
                className={`add-to-calendar-btn ${isAdding ? "loading" : ""}`}
                onClick={() => onAddToCalendar(event)}
                disabled={isAdding}
            >
                {isAdding ? (
                    <>
                        <i className="fas fa-spinner fa-spin"></i> Adding...
                    </>
                ) : (
                    <>
                        <i className="fas fa-calendar-plus"></i> Add to Calendar
                    </>
                )}
            </button>
        </div>
    );
};

function FileUpload({ supabase, session }) {
    const [selectedFile, setSelectedFile] = useState(null);
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [courseName, setCourseName] = useState("");
    const [semester, setSemester] = useState("");
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [addingEvents, setAddingEvents] = useState(false);
    const [addingEventIndex, setAddingEventIndex] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileSelect = (file) => {
        if (!file) return;
        setError(null);
        setEvents([]);
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            setError("File is too large. Please upload a file under 10MB.");
            return;
        }
        if (file.type !== "application/pdf") {
            setError("Invalid file type. Please upload a PDF.");
            return;
        }
        setSelectedFile(file);
    };

    const handleReset = () => {
        setSelectedFile(null);
        setEvents([]);
        setError(null);
        setIsLoading(false);
        setCourseName("");
        setSemester("");
        setYear(new Date().getFullYear().toString());
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleExtractEvents = async () => {
        if (!selectedFile) return;
        setIsLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("courseName", courseName);
        formData.append("semester", semester);
        formData.append("year", year);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/parse-syllabus`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: formData,
                }
            );
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "Failed to extract events.");
            }
            if (data.events && data.events.length > 0) {
                setEvents(data.events);
            } else {
                setError("No events could be found in the provided PDF.");
            }
            setSelectedFile(null);
        } catch (err) {
            console.error("Extraction failed:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const addEventToCalendar = async (event) => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/create-event`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(
                    error.error || "Failed to add event to calendar"
                );
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const handleAddSingleEventToCalendar = async (event) => {
        try {
            setAddingEventIndex(events.indexOf(event));
            const result = await addEventToCalendar(event);

            // Remove the added event from the list
            setEvents((prev) => prev.filter((e) => e !== event));

            // Show success message (you might want to add a toast notification system)
            console.log(result.message);
        } catch (error) {
            setError(`Failed to add event: ${error.message}`);
        } finally {
            setAddingEventIndex(null);
        }
    };

    const handleAddAllEventsToCalendar = async () => {
        try {
            setAddingEvents(true);

            for (const event of events) {
                setAddingEventIndex(events.indexOf(event));
                await addEventToCalendar(event);
            }

            // Clear events after all are added
            setEvents([]);

            // Show success message
            console.log("All events have been added to your calendar");
        } catch (error) {
            setError(`Failed to add all events: ${error.message}`);
        } finally {
            setAddingEvents(false);
            setAddingEventIndex(null);
        }
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Extracting events, please wait...</p>
                </div>
            );
        }
        if (error) {
            return (
                <div className="error-state">
                    <p>
                        <strong>Error:</strong> {error}
                    </p>
                    <button className="reset-button" onClick={handleReset}>
                        Try Again
                    </button>
                </div>
            );
        }
        if (events.length > 0) {
            return (
                <div className="events-list-container">
                    <h2>Extracted Events</h2>
                    <div className="events-list-actions">
                        <button
                            className={`confirm-all-btn ${
                                addingEvents ? "loading" : ""
                            }`}
                            onClick={handleAddAllEventsToCalendar}
                            disabled={addingEvents}
                        >
                            {addingEvents ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i>{" "}
                                    Adding Events...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-check-double"></i>{" "}
                                    Confirm & Add All
                                </>
                            )}
                        </button>
                        <button
                            className="reset-button"
                            onClick={handleReset}
                            disabled={addingEvents}
                        >
                            <i className="fas fa-undo"></i> Start Over
                        </button>
                    </div>
                    <div className="events-list">
                        {events.map((event, index) => (
                            <EventCard
                                key={index}
                                event={event}
                                onAddToCalendar={handleAddSingleEventToCalendar}
                                isAdding={addingEventIndex === index}
                            />
                        ))}
                    </div>
                </div>
            );
        }
        if (selectedFile) {
            return (
                <>
                    <div className="file-preview">
                        <i className="fas fa-file-pdf"></i>
                        <span className="file-name">{selectedFile.name}</span>
                        <button
                            className="remove-file-btn"
                            onClick={handleReset}
                            title="Remove file"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="course-info-form">
                        <input
                            type="text"
                            placeholder="Course Name (e.g., CS 101)"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Semester (e.g., Fall)"
                            value={semester}
                            onChange={(e) => setSemester(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Year (e.g., 2024)"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                    </div>
                    <button
                        className="extract-button"
                        onClick={handleExtractEvents}
                    >
                        <i className="fas fa-cogs"></i>
                        <span>Extract Calendar Events</span>
                    </button>
                </>
            );
        }
        return (
            <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
            >
                <i className="fas fa-cloud-upload-alt"></i>
                <span>Upload PDF Syllabus</span>
            </button>
        );
    };

    return (
        <div className="file-upload-container">
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
            <div className="upload-area">{renderContent()}</div>
        </div>
    );
}

export default FileUpload;
