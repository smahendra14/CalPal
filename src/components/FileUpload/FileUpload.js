import React, { useState, useRef } from "react";
import "./FileUpload.css";
import { readError } from "../../utils/api.js";

const formatDate = (dateTime) => {
    if (!dateTime) return "N/A";
    return new Date(dateTime).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    });
};

const EventCard = ({ event, status, onAddToCalendar, disabled }) => {
    const { state, error } = status;
    return (
        <div className={`event-card ${state}`}>
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
            {state === "failed" && (
                <p className="event-error">
                    <i className="fas fa-exclamation-circle"></i> {error}
                </p>
            )}
            {state === "added" ? (
                <span className="event-added-badge">
                    <i className="fas fa-check"></i> Added
                </span>
            ) : (
                <button
                    className={`add-to-calendar-btn ${state === "adding" ? "loading" : ""}`}
                    onClick={onAddToCalendar}
                    disabled={disabled || state === "adding"}
                >
                    {state === "adding" ? (
                        <>
                            <i className="fas fa-spinner fa-spin"></i> Adding...
                        </>
                    ) : state === "failed" ? (
                        <>
                            <i className="fas fa-redo"></i> Retry
                        </>
                    ) : (
                        <>
                            <i className="fas fa-calendar-plus"></i> Add to Calendar
                        </>
                    )}
                </button>
            )}
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
    // One { state: "pending" | "adding" | "added" | "failed", error } per event.
    const [statuses, setStatuses] = useState([]);
    const [addingEvents, setAddingEvents] = useState(false);
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
        setStatuses([]);
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
        formData.append("timeZone", Intl.DateTimeFormat().resolvedOptions().timeZone);

        try {
            const response = await fetch(
                `${process.env.REACT_APP_API_URL}/api/syllabus/parse`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: formData,
                }
            );
            if (!response.ok) {
                throw new Error(await readError(response, "Failed to extract events."));
            }
            const data = await response.json();
            if (data.events && data.events.length > 0) {
                setEvents(data.events);
                setStatuses(data.events.map(() => ({ state: "pending" })));
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
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/calendar/events`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                throw new Error(
                    await readError(response, "Failed to add event to calendar")
                );
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    const setStatus = (index, status) =>
        setStatuses((prev) => prev.map((s, i) => (i === index ? status : s)));

    const addEvents = async (indices) => {
        setAddingEvents(true);
        for (const i of indices) {
            setStatus(i, { state: "adding" });
            try {
                await addEventToCalendar(events[i]);
                setStatus(i, { state: "added" });
            } catch (err) {
                setStatus(i, { state: "failed", error: err.message });
            }
        }
        setAddingEvents(false);
    };

    const indicesWhere = (...states) =>
        statuses.flatMap((s, i) => (states.includes(s.state) ? [i] : []));

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
            const added = indicesWhere("added");
            const failed = indicesWhere("failed");
            const remaining = indicesWhere("pending", "failed");
            const done = added.length + failed.length;
            const allSettled = !addingEvents && indicesWhere("pending").length === 0;

            if (allSettled) {
                return (
                    <div className="events-summary">
                        <i
                            className={`fas ${failed.length ? "fa-exclamation-triangle" : "fa-check-circle"} summary-icon ${failed.length ? "partial" : ""}`}
                        ></i>
                        <h2>
                            Added {added.length} of {events.length} events to your
                            calendar
                        </h2>
                        {added.length > 0 && (
                            <ul className="summary-list">
                                {added.map((i) => (
                                    <li key={i}>
                                        <i className="fas fa-check"></i>
                                        <span>{events[i].summary}</span>
                                        <span className="summary-date">
                                            {formatDate(events[i].start?.dateTime)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                        {failed.length > 0 && (
                            <>
                                <h3 className="summary-failed-heading">
                                    {failed.length} couldn't be added
                                </h3>
                                <ul className="summary-list failed">
                                    {failed.map((i) => (
                                        <li key={i}>
                                            <i className="fas fa-times"></i>
                                            <span>{events[i].summary}</span>
                                            <span className="summary-date">
                                                {statuses[i].error}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        <div className="events-list-actions">
                            {failed.length > 0 && (
                                <button
                                    className="confirm-all-btn"
                                    onClick={() => addEvents(failed)}
                                >
                                    <i className="fas fa-redo"></i> Retry failed (
                                    {failed.length})
                                </button>
                            )}
                            <a
                                className="reset-button"
                                href="https://calendar.google.com"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <i className="fas fa-calendar"></i> Open Google
                                Calendar
                            </a>
                            <button className="reset-button" onClick={handleReset}>
                                <i className="fas fa-file-upload"></i> Upload another
                                syllabus
                            </button>
                        </div>
                    </div>
                );
            }

            const current = statuses.findIndex((s) => s.state === "adding");
            return (
                <div className="events-list-container">
                    <div className="events-list-header">
                        <h2>Extracted Events ({events.length})</h2>
                        <div className="events-list-actions">
                            <button
                                className={`confirm-all-btn ${addingEvents ? "loading" : ""}`}
                                onClick={() => addEvents(remaining)}
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
                                        Add All ({remaining.length})
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
                        {(addingEvents || done > 0) && (
                            <div className="add-progress">
                                <div
                                    className="add-progress-bar"
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={events.length}
                                    aria-valuenow={done}
                                >
                                    <div
                                        className="add-progress-fill"
                                        style={{
                                            width: `${(done / events.length) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                                <p className="add-progress-text">
                                    {done} of {events.length} done
                                    {failed.length > 0 && ` · ${failed.length} failed`}
                                    {current !== -1 &&
                                        ` · Adding "${events[current].summary}"`}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="events-list">
                        {events.map((event, index) => (
                            <EventCard
                                key={index}
                                event={event}
                                status={statuses[index]}
                                onAddToCalendar={() => addEvents([index])}
                                disabled={addingEvents}
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
