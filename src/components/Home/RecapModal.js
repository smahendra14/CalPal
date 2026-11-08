import React, { useCallback, useEffect, useState } from "react";
import "./RecapModal.css";
import { readError } from "../../utils/api.js";

// "2026-11-02" -> "Nov 2"
const formatWeek = (weekStart) =>
    new Date(`${weekStart}T00:00:00Z`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });

const RecapModal = ({ session, onClose }) => {
    const [insights, setInsights] = useState(null);
    const [error, setError] = useState(null);
    const [attempt, setAttempt] = useState(0);

    const load = useCallback(
        async (signal) => {
            setInsights(null);
            setError(null);
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/insights`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    }),
                    signal,
                });
                if (!response.ok) {
                    throw new Error(await readError(response, "Couldn't load your calendar recap."));
                }
                setInsights((await response.json()).insights);
            } catch (err) {
                if (err.name !== "AbortError") setError(err.message);
            }
        },
        [session.access_token]
    );

    useEffect(() => {
        const controller = new AbortController();
        load(controller.signal);
        return () => controller.abort();
    }, [load, attempt]);

    const renderBody = () => {
        if (error) {
            return (
                <div className="recap-message">
                    <p>{error}</p>
                    <button className="modal-button confirm" onClick={() => setAttempt((n) => n + 1)}>
                        Retry
                    </button>
                </div>
            );
        }
        if (!insights) {
            return (
                <div className="recap-message">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Looking through your calendar...</p>
                </div>
            );
        }
        if (insights.weeks.length === 0) {
            return (
                <div className="recap-message">
                    <p>No events on your calendar in the last few months.</p>
                </div>
            );
        }

        const maxHours = Math.max(...insights.weeks.map((w) => w.scheduledHours), 1);
        const byStart = Object.fromEntries(insights.weeks.map((w) => [w.weekStart, w]));
        return (
            <>
                <section>
                    <h3>Hours scheduled each week</h3>
                    <div className="recap-timeline">
                        {insights.weeks.map((week) => (
                            <div
                                key={week.weekStart}
                                className={`recap-bar ${week.isPast ? "past" : ""} ${week.isCurrent ? "current" : ""}`}
                                style={{ height: `${(week.scheduledHours / maxHours) * 100}%` }}
                                title={`Week of ${formatWeek(week.weekStart)}: ${week.scheduledHours} hours`}
                                aria-label={`Week of ${formatWeek(week.weekStart)}: ${week.scheduledHours} hours`}
                                role="img"
                            ></div>
                        ))}
                    </div>
                    <div className="recap-timeline-labels">
                        <span>{formatWeek(insights.weeks[0].weekStart)}</span>
                        <span>{formatWeek(insights.weeks.at(-1).weekStart)}</span>
                    </div>
                </section>

                {insights.busiestPastWeeks.length > 0 && (
                    <section>
                        <h3>Busiest weeks so far</h3>
                        <ol className="recap-cards">
                            {insights.busiestPastWeeks.map((weekStart) => (
                                <li key={weekStart}>
                                    <span>Week of {formatWeek(weekStart)}</span>
                                    <strong>{byStart[weekStart].scheduledHours} hours</strong>
                                </li>
                            ))}
                        </ol>
                    </section>
                )}

                {insights.heaviestWeekday && (
                    <p className="recap-fact">
                        Your busiest day of the week is <strong>{insights.heaviestWeekday}</strong>.
                    </p>
                )}
            </>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content recap-modal"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Calendar Recap"
            >
                <h2>Calendar Recap</h2>
                {renderBody()}
                <div className="modal-actions">
                    <button className="modal-button cancel" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RecapModal;
