import React, { useEffect, useRef } from "react";
import "./EventModal.css";

function EventModal({ show, onClose, description, setDescription, addEvent }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (show && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [show]);

  if (!show) {
    return null;
  }

  function showOutput(){
    console.log("pressed test ouput button with a value of " + description);
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="enter event description e.g. 'soccer practice every tuesday 7-8 pm'"
          className="modal-textarea"
        />
        <button onClick={addEvent} className="add-to-calendar-button">
          Add to Calendar
        </button>
        <button onClick={onClose} className="cancel-button">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default EventModal;
