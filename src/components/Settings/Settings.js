import React, { useState, useEffect } from "react";
import "./Settings.css"; // Include styles here

const Settings = ({ supabase, session }) => {
    const [isEnabled, setIsEnabled] = useState(true); // Default to true while loading
    const [summaryTime, setSummaryTime] = useState("9:00am"); // State for time selection
    const [loading, setLoading] = useState(true); // To manage loading state

    // Fetch the initial isEnabled value from the database
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data, error } = await supabase
                    .from("UserInfo")
                    .select("send_daily_summary")
                    .eq("email", session.user.email)
                    .single(); // Expect a single row

                if (error) throw error;

                // Set the initial value of isEnabled
                if (data) {
                    setIsEnabled(data.send_daily_summary);
                }
            } catch (error) {
                console.error("Error fetching user settings:", error.message);
            } finally {
                setLoading(false); // Disable loading state
            }
        };

        fetchSettings();
    }, [supabase, session]);

    const toggleSwitch = () => {
        setIsEnabled((prev) => !prev);
    };

    const handleSave = () => {
        alert(`Settings Saved:
    Receive Summaries: ${isEnabled ? "Yes" : "No"}
    Send Summary At: ${summaryTime}`);
        setDailySummary(isEnabled);
    };

    const setDailySummary = async (enabled) => {
        try {
            const { error } = await supabase
                .from("UserInfo")
                .update({ send_daily_summary: enabled })
                .eq("email", session.user.email);
            if (error) throw error;
        } catch (error) {
            console.error("Error updating send_daily_summary", error.message);
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="settings-container">
            <header className="settings-header">
                <h1>Email Summary Settings</h1>
                <p>
                    Get notified through email each day with a summary of your
                    upcoming events!
                </p>
            </header>

            <div className="settings-content">
                <div className="setting-item">
                    <span className="setting-label">
                        Receive Daily Email Summaries
                    </span>
                    <div className="setting-toggle">
                        <span>{isEnabled ? "Yes" : "No"}</span>
                        <button
                            className={`toggle-btn ${
                                isEnabled ? "enabled" : "disabled"
                            }`}
                            onClick={toggleSwitch}
                        >
                            <div className="toggle-thumb" />
                        </button>
                    </div>
                </div>

                <div className="setting-item">
                    <label className="setting-label" htmlFor="summary-time">
                        Send Summary At
                    </label>
                    <select
                        id="summary-time"
                        className="time-select"
                        value={summaryTime}
                        onChange={(e) => setSummaryTime(e.target.value)}
                    >
                        {[
                            "12:00am",
                            "12:30am",
                            "1:00am",
                            "1:30am",
                            "2:00am",
                            "2:30am",
                            "3:00am",
                            "3:30am",
                            "4:00am",
                            "4:30am",
                            "5:00am",
                            "5:30am",
                            "6:00am",
                            "6:30am",
                            "7:00am",
                            "7:30am",
                            "8:00am",
                            "8:30am",
                            "9:00am",
                            "9:30am",
                            "10:00am",
                            "10:30am",
                            "11:00am",
                            "11:30am",
                            "12:00pm",
                            "12:30pm",
                            "1:00pm",
                            "1:30pm",
                            "2:00pm",
                            "2:30pm",
                            "3:00pm",
                            "3:30pm",
                            "4:00pm",
                            "4:30pm",
                            "5:00pm",
                            "5:30pm",
                            "6:00pm",
                            "6:30pm",
                            "7:00pm",
                            "7:30pm",
                            "8:00pm",
                            "8:30pm",
                            "9:00pm",
                            "9:30pm",
                            "10:00pm",
                            "10:30pm",
                            "11:00pm",
                            "11:30pm",
                        ].map((time) => (
                            <option key={time} value={time}>
                                {time}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <button className="save-button" onClick={handleSave}>
                Save
            </button>
        </div>
    );
};

export default Settings;
