import React, { useState } from "react";
import "./App.css";
import EventInput from "./components/EventInput.js";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle } from "@fortawesome/free-brands-svg-icons";
import EventViewModal from "./components/EventViewModal.js";
import { extractEventInfo } from "./functions/langchainFunctions.js";

function App() {
  const session = useSession(); // similar to accessing a users info and tokens, session exists = have a user
  const supabase = useSupabaseClient(); // for talking to supabase
  const { isLoading } = useSessionContext();
  const [events, setEvents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventTite, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState();
  const [eventSummary, setEventSummary] = useState("");
  const [eventDescription, setEventDescription] = useState("");

  if (isLoading) {
    return <></>; // used to get around flickering that occurs when you reload the page when signed in
  }

  async function googleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/calendar", // delimit separate scopes with a space in between
      },
    });
    if (error) {
      alert("Error logging in to Google provider with Supabase");
      console.log(error);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  async function addEvent() {
    console.log("testing create calendar event functionality");
    const extractResponse  = await extractEventInfo(eventDescription);
    console.log(extractResponse);
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
        console.log(data);
        alert("Event added! Check your Google Calendar to confirm.");
      });
  }

  async function getEventsNextDay() {
    console.log("Getting events for tomorrow");
    // Calculate the start and end times for the next day
    const startOfDay = new Date();
    startOfDay.setDate(startOfDay.getDate() + 1);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // Construct the URL with query parameters
    const url = new URL(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events"
    );
    url.searchParams.append("timeMin", startOfDay.toISOString());
    url.searchParams.append("timeMax", endOfDay.toISOString());
    url.searchParams.append("singleEvents", "true");
    url.searchParams.append("orderBy", "startTime");

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + session.provider_token, // access token for google
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);

      // Process and display the events
      const events = data.items;
      if (events.length) {
        setEvents(events);
      } else {
        setEvents([]);
      }
      setIsModalOpen(true); // Open the modal to display events
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  }

  return (
    <div className="App">
      <div>
        {session ? (
          <div className="container">
            <h4>
              You are currently linked to the primary calendar associated with:{" "}
              <h4 className="user-email">{session.user.email}</h4>
            </h4>
            <hr
              style={{
                border: "1px solid black",
                width: "60%",
                marginBottom: 30,
              }}
            />
            <button className="view-events-button" onClick={getEventsNextDay}>
              See my Calendar Events for Tomorrow
            </button>
            <h2>
              Have plans? Enter them below to have them added to your Google
              Calendar.
            </h2>
            <h3>Try pressing alt + n as a shortcut!</h3>
            <EventInput
              setEventDescription={setEventDescription}
              eventDescription={eventDescription}
              addEvent={addEvent}
            />
            <button onClick={() => signOut()}>Sign Out</button>
          </div>
        ) : (
          <div className="container">
            <h1>Welcome to CalPal!</h1>
            <h3>To get started, sign in to sync your Google Calendar</h3>
            <button
              onClick={() => googleSignIn()}
              className="google-signin-button"
            >
              <FontAwesomeIcon icon={faGoogle} className="google-icon" />
              Sign In With Google
            </button>
          </div>
        )}
      </div>
      {isModalOpen && (
        <EventViewModal onClose={() => setIsModalOpen(false)} events={events} />
      )}
    </div>
  );
}

export default App;
