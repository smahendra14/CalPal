import React, { useState, useEffect, useRef } from "react";
import "./Home.css";
import { extractEventInfo } from "../../functions/langchainFunctions.js";
import { format } from "date-fns";

const Home = ({ session, supabase, isLoading }) => {
  const [eventDescription, setEventDescription] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState();
  const [eventEnd, setEventEnd] = useState();
  const [formattedStart, setFormattedStart] = useState();
  const [formattedEnd, setFormattedEnd] = useState();
  const [manualDate, setManualDate] = useState(null);

  const openModal = () => {
    setIsConfirmModalOpen(true);
  };

  const closeModal = () => {
    setIsConfirmModalOpen(false);
  };

  async function signOut() {
    await supabase.auth.signOut();
  }

  const handleInputChange = (e) => {
    setEventDescription(e.target.value);
  };

  const handleConfirmInputChange = (e) => {
    setEventTitle(e.target.value);
  };

  function formatDate(dateString) {
    const date = new Date(dateString);

    const formattedDate = format(date, "MMMM do 'at' h:mm a");

    return formattedDate;
  }

  async function showConfirmation() {
    const extractResponse = await extractEventInfo(eventDescription);
    setEventTitle(extractResponse.title);
    setEventStart(extractResponse.calendarStartInputTime);
    setEventEnd(extractResponse.calendarEndInputTime);
    setFormattedStart(formatDate(extractResponse.calendarStartInputTime));
    setFormattedEnd(formatDate(extractResponse.calendarEndInputTime));
    setEventDescription("");
    openModal();
  }

  async function addEvent() {
    setEventDescription("");
    const event = {
      summary: eventTitle,
      start: {
        dateTime: eventStart,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: eventEnd,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
    await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + session.provider_token,
        },
        body: JSON.stringify(event),
      }
    )
      .then((data) => {
        return data.json();
      })
      .then((data) => {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
        }, 4000);
      });
  }

  if (isLoading) {
    return <></>; // used to get around flickering that occurs when you reload the page when signed in
  }

  return (
    <div className="home-container">
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
            You are currently linked to the primary calendar associated with:
          </h4>
          <h4>{session.user.email}</h4>
          <button className="sign-out" onClick={() => signOut()}>
            Sign Out
          </button>
        </div>
      </div>
      <div className="body-container">
        <div>
          <input
            className="event-input"
            placeholder="Enter event description i.e. practice coding on the 25th at 9 am"
            onChange={handleInputChange}
            value={eventDescription}
          />
        </div>
        <button onClick={showConfirmation} className="add-to-calendar-button">
          Add to Calendar
        </button>
        {isConfirmModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <input
                value={eventTitle}
                className="confirmation-title"
                onChange={handleConfirmInputChange}
              />
              <div>from</div>
              <p>{formattedStart}</p>
              <div>to</div>
              <p>{formattedEnd}</p>
              <button onClick={addEvent}>Confirm</button>
              <div></div>
              <button onClick={closeModal}>Cancel</button>
              {manualDate && <p>{manualDate}.toLocaleDateString()</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
