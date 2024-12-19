import React, { useState } from "react";
import "./Home.css";
import "./FileUpload/FileUpload.js";
import FileUpload from "./FileUpload/FileUpload.js";

const ConfirmationModal = ({ event, onConfirm, onCancel }) => {
    if (!event) {
        return null;
    }
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Confirm Event Details</h2>
                <p>Please review the event before adding to your calendar:</p>

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
                        Edit Event
                    </button>
                    <button
                        onClick={onConfirm}
                        className="modal-button confirm"
                    >
                        Confirm and Add
                    </button>
                </div>
            </div>
        </div>
    );
};

const Home = ({ session, supabase, isLoading, refreshToken }) => {
    const [eventDescription, setEventDescription] = useState("");
    const [showAlert, setShowAlert] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showErrorAlert, setShowErrorAlert] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingEvent, setPendingEvent] = useState(null);

    async function signOut() {
        await supabase.auth.signOut();
    }

    const handleInputChange = (e) => {
        setEventDescription(e.target.value);

        // Clear any previous error message once the user starts typing again
        if (showErrorAlert) {
            setShowErrorAlert(false);
            setErrorMessage("");
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            if (showConfirmModal) {
                e.preventDefault();
                confirmAddEvent();
            } else {
                e.preventDefault();
                setShowErrorAlert(false);
                setErrorMessage("");
                prepareEventForConfirmation();
            }
        }
    };

    async function prepareEventForConfirmation() {
        // Reset previous errors
        setShowErrorAlert(false);
        setErrorMessage("");

        try {
            setShowAlert(true);
            const response = await fetch(
                "http://localhost:8000/api/calendar/extractSingleEventInfo",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ eventDescription }),
                }
            );
            if (!response.ok) {
                throw new Error("Failed to get event information");
            }

            const extractResponse = await response.json();

            // Validate extracted information
            if (
                !extractResponse.title ||
                !extractResponse.calendarStartInputTime ||
                !extractResponse.calendarEndInputTime
            ) {
                throw new Error(
                    "Could not parse event details. Please check your description."
                );
            }

            const event = {
                summary: extractResponse.title + " (from CalPal)",
                start: {
                    dateTime: extractResponse.calendarStartInputTime,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
                end: {
                    dateTime: extractResponse.calendarEndInputTime,
                    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                },
            };

            // Store pending event and show confirmation modal
            setPendingEvent(event);
            setShowConfirmModal(true);
            setShowAlert(false);
            setEventDescription("");
        } catch (error) {
            console.error("Error preparing event:", error);
            setShowAlert(false);
            setShowErrorAlert(true);
            setErrorMessage(
                "Unable to parse event. Please try a different description."
            );
        }
    }

    async function confirmAddEvent() {
        if (!pendingEvent) {
            return;
        }
        try {
            const response = await fetch(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + session.provider_token,
                    },
                    body: JSON.stringify(pendingEvent),
                }
            );

            if (!response.ok) {
                // Check for 401 unauthorized
                if (response.status === 401 || response.status === 403) {
                    setErrorMessage(
                        "Failed to authenticate user. Please try logging in again."
                    );
                    setShowConfirmModal(false);
                    setShowErrorAlert(true);
                    return;
                }

                // Check for a specific error like 400 Bad Request
                const errorDetails = await response.json();
                throw new Error(
                    `Failed to add event: ${
                        errorDetails.error.message || "Unknown error"
                    }`
                );
            }

            const data = await response.json();

            // Close modal and show success
            setShowConfirmModal(false);
            setShowSuccess(true);
            setPendingEvent(null);

            setTimeout(() => {
                setShowSuccess(false);
            }, 4000);
        } catch (error) {
            console.error("Error adding event:", error);
            setShowErrorAlert(true);
            setErrorMessage(
                "Failed to add event to calendar. Please try again."
            );
        }
    }

    const cancelAddEvent = () => {
        setShowConfirmModal(false);
        setPendingEvent(null);
        setEventDescription("");
    };

    const addToSupabase = async () => {
        console.log("test");
    
        const newUser = {
            email: "test678@gmail.com",
            send_daily_summary: false,
            refresh_token: refreshToken,
            update_time: '08:00:00.000+00',
        };
        const {data, error} = await supabase.from("UserInfo").insert([newUser]).single();
        if (error) { 
          console.log("error adding user", error);
        } else { 
          console.log("added successfully", data);
        }
    };

    if (isLoading) {
        return <></>; // used to get around flickering that occurs when you reload the page when signed in
    }

    return (
        <div className="home-container">
            {/* Error Alert */}
            {showErrorAlert && (
                <div className="alert error">
                    {errorMessage}
                    <button
                        className="close-error"
                        onClick={() => setShowErrorAlert(false)}
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Header */}
            <div className="header-bar">
                <h1 className="title-text">CalPal</h1>
                {showAlert && (
                    <div className="alert" id="alert">
                        Adding event to your calendar...
                    </div>
                )}
                {showSuccess && (
                    <div className="alert">
                        Event added! Check your Google Calendar to confirm
                    </div>
                )}
                <div className="account-actions">
                    <h4 id="description">
                        You are currently linked to the primary calendar
                        associated with:
                    </h4>
                    <h4>{session.user.email}</h4>
                    <button className="sign-out" onClick={() => signOut()}>
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Event input section */}
            <div className="body-container">
                <div>
                    <input
                        className="event-input"
                        placeholder="Enter event description i.e. practice coding on the 25th at 10 am"
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        value={eventDescription}
                    />
                </div>
                <button
                    onClick={prepareEventForConfirmation}
                    className="add-to-calendar-button"
                >
                    Add to Calendar
                </button>
                <button onClick={addToSupabase}>Enable Daily Updates</button>
                <FileUpload />
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <ConfirmationModal
                    event={pendingEvent}
                    onConfirm={confirmAddEvent}
                    onCancel={cancelAddEvent}
                />
            )}
        </div>
    );
};

export default Home;
