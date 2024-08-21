import React, { useState, useEffect } from "react";
import EventModal from "./EventModal.js";
import "./EventInput.css";

function EventInput({ eventDescription, setEventDescription, addEvent }) {
  const [showModal, setShowModal] = useState(false);

  const handleInputClick = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEventDescription("");
  };

  const handleInputChange = (e) => {
    setEventDescription(e.target.value);
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.altKey && event.key === "n") {
        setShowModal(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []); // Run effect only once

  return (
    <div className="event-description-container">
      <input
        type="text"
        onClick={handleInputClick}
        placeholder="Enter event description"
        className="event-description-input"
        onChange={handleInputChange}
        value={eventDescription}
      />
      <EventModal
        show={showModal}
        onClose={handleCloseModal}
        description={eventDescription}
        setDescription={setEventDescription}
        addEvent={addEvent}
      />
    </div>
  );
}

export default EventInput;
