import React from 'react';
import './EventViewModal.css';

function Modal({ onClose, events }) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>X</button>
        <h2>Events for Tomorrow</h2>
        {events.length > 0 ? (
          <ul>
            {events.map((event, index) => (
              <li key={index}>
                <strong>{event.summary}</strong>
                <p>{event.start.dateTime || event.start.date} - {event.end.dateTime || event.end.date}</p>
                <p>{event.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No events found for tomorrow.</p>
        )}
      </div>
    </div>
  );
}

export default Modal;
