import React, { useState, useEffect } from "react";
import "./App.css";
import {
    useSession,
    useSupabaseClient,
    useSessionContext,
} from "@supabase/auth-helpers-react";
import LandingPage from "./components/LandingPage/LandingPage.js";
import Home from "./components/Home/Home.js";

function App() {
    // const session = useSession(); // similar to accessing a users info and tokens, session exists = have a user
    const supabase = useSupabaseClient(); // for talking to supabase
    const { session, isLoading } = useSessionContext();
    const [refreshToken, setRefreshToken] = useState("boohoo");

    // UseEffect to track session changes
    useEffect(() => {
        if (session) {
            // Check for and store the refresh token if available
            const storedRefreshToken = session.provider_refresh_token;
            if (storedRefreshToken) {
                console.log("Stored Refresh Token:", storedRefreshToken);
                setRefreshToken(storedRefreshToken);
            } else {
                console.log("No refresh token available from session.");
            }
        }
    }, [session]); // Re-run effect when session changes

    if (isLoading) {
        return <></>; // used to get around flickering that occurs when you reload the page when signed in
    }

    return (
        <div className="App">
            <div>
                {session ? (
                    <Home
                        session={session}
                        supabase={supabase}
                        isLoading={isLoading}
                        refreshToken={refreshToken}
                        setRefreshToken={setRefreshToken}
                    />
                ) : (
                    <>
                        <LandingPage
                            supabase={supabase}
                            refreshToken={refreshToken}
                            setRefreshToken={setRefreshToken}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
