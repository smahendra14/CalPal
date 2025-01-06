import React, { useState } from "react";
import "./Home.css";
import { DateTime } from "luxon";
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
                        Cancel
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

    /**
     * Log a user out of their Supabase session
     */
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

        // pass in local time zone to backend for relative timings
        const userLocalTime = DateTime.now()
            .set({ second: 0, millisecond: 0 })
            .toString();

        try {
            setShowAlert(true);
            const response = await fetch(
                "https://calpal-backend-deploy.vercel.app/api/calendar/extractSingleEventInfo",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        eventDescription: eventDescription,
                        userLocalTime: userLocalTime,
                    }),
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
            let accessToken = session.provider_token;
            // Test the current token by making a lightweight request or assuming expiry
            try {
                const testResponse = await fetch(
                    "https://www.googleapis.com/oauth2/v3/tokeninfo",
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (!testResponse.ok) {
                    throw new Error("Token is invalid");
                }
            } catch (error) {
                // Refresh the token if the current one is invalid
                // setShowErrorAlert(true);
                // setErrorMessage(
                //     "Failed to add event because your session has expired. Please log in again."
                // );

                // console.log("Access token expired, refreshing...");
                // accessToken = await getRefreshedToken(refreshToken); // Use your passed-in refresh token
            }

            const response = await fetch(
                "https://www.googleapis.com/calendar/v3/calendars/primary/events",
                {
                    method: "POST",
                    headers: {
                        Authorization: "Bearer " + accessToken,
                    },
                    body: JSON.stringify(pendingEvent),
                }
            );

            if (!response.ok) {
                // Check for 401 unauthorized
                if (response.status === 401 || response.status === 403) {
                    setErrorMessage(
                        "Failed to add event because your session has expired. Please try logging in again."
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

    async function getRefreshedToken(refreshToken) {
        try {
            const response = await fetch(
                "https://oauth2.googleapis.com/token",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({
                        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
                        client_secret:
                            process.env.REACT_APP_GOOGLE_CLIENT_SECRET,
                        refresh_token: refreshToken,
                        grant_type: "refresh_token",
                    }),
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to refresh token: ${response.statusText}`
                );
            }

            const data = await response.json();
            return data.access_token; // The new access token
        } catch (error) {
            console.error("Error refreshing token:", error);
            throw error;
        }
    }

    async function enableDailySummary() {
        try {
            const { error } = await supabase
                .from("UserInfo")
                .update({ send_daily_summary: true })
                .eq("email", session.user.email);
            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Error updating send_daily_summary", error.message);
        }
    }

    async function disableDailySummary() {
        try {
            const { error } = await supabase
                .from("UserInfo")
                .update({ send_daily_summary: false })
                .eq("email", session.user.email);
            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Error updating send_daily_summary", error.message);
        }
    }

    const cancelAddEvent = () => {
        setShowConfirmModal(false);
        setPendingEvent(null);
        setEventDescription("");
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
                    <br />
                    <br />
                    {/*<div className="toggle-daily-summary-container">
                        <button onClick={enableDailySummary}>
                            Enable Daily Summary
                        </button>
                        <br />
                        <br />
                        <button onClick={disableDailySummary}>
                            Disable Daily Summary
                        </button>
                    </div>
                    */}
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
