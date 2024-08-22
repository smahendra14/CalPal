import React from "react";
import "./App.css";
// import EventInput from "./components/EventInput.js";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
// import EventViewModal from "./components/EventViewModal.js";
import LandingPage from "./components/LandingPage/LandingPage.js";
import Home from "./components/Home/Home.js";

function App() {
  const session = useSession(); // similar to accessing a users info and tokens, session exists = have a user
  const supabase = useSupabaseClient(); // for talking to supabase
  const { isLoading } = useSessionContext();
  // const [events, setEvents] = useState([]);
  // const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return <></>; // used to get around flickering that occurs when you reload the page when signed in
  }

  // async function getEventsNextDay() {
  //   console.log("Getting events for tomorrow");
  //   // Calculate the start and end times for the next day
  //   const startOfDay = new Date();
  //   startOfDay.setDate(startOfDay.getDate() + 1);
  //   startOfDay.setHours(0, 0, 0, 0);

  //   const endOfDay = new Date(startOfDay);
  //   endOfDay.setHours(23, 59, 59, 999);

  //   // Construct the URL with query parameters
  //   const url = new URL(
  //     "https://www.googleapis.com/calendar/v3/calendars/primary/events"
  //   );
  //   url.searchParams.append("timeMin", startOfDay.toISOString());
  //   url.searchParams.append("timeMax", endOfDay.toISOString());
  //   url.searchParams.append("singleEvents", "true");
  //   url.searchParams.append("orderBy", "startTime");

  //   try {
  //     const response = await fetch(url, {
  //       method: "GET",
  //       headers: {
  //         Authorization: "Bearer " + session.provider_token, // access token for google
  //         Accept: "application/json",
  //       },
  //     });

  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     const data = await response.json();
  //     console.log(data);

  //     // Process and display the events
  //     const events = data.items;
  //     if (events.length) {
  //       setEvents(events);
  //     } else {
  //       setEvents([]);
  //     }
  //     setIsModalOpen(true); // Open the modal to display events
  //   } catch (error) {
  //     console.error("Error fetching events:", error);
  //   }
  // }

  return (
    <div className="App">
      <div>
        {session ? (
          <Home session={session} supabase={supabase} isLoading={isLoading}/>
        ) : (
          <>
            <LandingPage supabase={supabase} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
