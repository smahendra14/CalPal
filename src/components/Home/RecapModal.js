import React, { useEffect, useState } from "react";
import "./RecapModal.css";
import { readError } from "../../utils/api.js";

const RecapModal = ({ session, onClose }) => {
    const [recap, setRecap] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Cancel the request if the modal closes, so a late response doesn't update a closed modal
        const controller = new AbortController();
        fetch(`${process.env.REACT_APP_API_URL}/api/insights`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
            signal: controller.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(await readError(response, "Couldn't load your calendar recap."));
                }
                setRecap(await response.json());
            })
            .catch((err) => {
                if (err.name !== "AbortError") setError(err.message);
            });
        return () => controller.abort();
    }, [session.access_token]);

    const renderBody = () => {
        if (error) {
            return <p className="recap-message">{error}</p>;
        }
        if (!recap) {
            return <p className="recap-message">Sorting your events...</p>;
        }

        const categories = Object.entries(recap.hoursByCategory).sort((a, b) => b[1] - a[1]);
        if (categories.length === 0) {
            return <p className="recap-message">No events on your calendar in the last 4 months.</p>;
        }
        const total = categories.reduce((sum, [, hours]) => sum + hours, 0);
        return (
            <>
                <h3>Where your time went in the last 4 months</h3>
                <ul className="recap-categories">
                    {categories.map(([category, hours]) => (
                        <li key={category}>
                            <span className="recap-category-name">{category}</span>
                            <div className="recap-category-track">
                                <div
                                    className="recap-category-fill"
                                    style={{ width: `${(hours / categories[0][1]) * 100}%` }}
                                ></div>
                            </div>
                            <span className="recap-category-hours">
                                {hours}h · {Math.round((hours / total) * 100)}%
                            </span>
                        </li>
                    ))}
                </ul>
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
