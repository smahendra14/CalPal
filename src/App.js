import React from "react";
import "./App.css";
import {
  useSession,
  useSupabaseClient,
  useSessionContext,
} from "@supabase/auth-helpers-react";
import LandingPage from "./components/LandingPage/LandingPage.js";
import Home from "./components/Home/Home.js";

function App() {
  const session = useSession(); // similar to accessing a users info and tokens, session exists = have a user
  const supabase = useSupabaseClient(); // for talking to supabase
  const { isLoading } = useSessionContext();

  if (isLoading) {
    return <></>; // used to get around flickering that occurs when you reload the page when signed in
  }

  return (
    <div className="App">
      <div>
        {session ? (
          <Home session={session} supabase={supabase} isLoading={isLoading} />
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
