import React, { useState } from "react";
import "./Home.css";
import { extractEventInfo } from "../../functions/langchainFunctions.js";


const Home = ({ session, supabase, isLoading }) => {
  const [eventDescription, setEventDescription] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  async function signOut() {
    await supabase.auth.signOut();
  }

  const handleInputChange = (e) => {
    setEventDescription(e.target.value);
  };

  async function addEvent() {
    setShowAlert(true);
    setEventDescription("");
    const extractResponse = await extractEventInfo(eventDescription);
    const event = {
      summary: extractResponse.title,
      start: {
        dateTime: extractResponse.calendarStartInputTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: extractResponse.calendarEndInputTime,
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
        setShowAlert(false);
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
        {showAlert && <div className="alert" id="alert">Adding event to your calendar...</div>}
        {showSuccess && <div className="alert">Event added! Check your Google Calendar to confirm</div>}
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
        <button onClick={addEvent} className="add-to-calendar-button">
          Add to Calendar
        </button>
      </div>
    </div>
  );
};

export default Home;
