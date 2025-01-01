import React, { useState, useEffect } from "react";
import "./App.css";
import {
    useSession,
    useSupabaseClient,
    useSessionContext,
} from "@supabase/auth-helpers-react";
import LandingPage from "./components/LandingPage/LandingPage.js";
import Home from "./components/Home/Home.js";

/**
 * Stores the refresh token of the signed-in user in the database
 * by invoking a Supabase database function via RPC (Remote Procedure Call).
 * This provides a secure way to persist sensitive information.
 * 
 * @param {SupabaseClient} supabase - The Supabase client instance for interacting with the database.
 * @param {string} email - The email address of the signed-in user
 * @param {string} refreshToken - The refresh token associated with the user's session
 */
const storeRefreshTokenInDatabase = async (supabase, email, refreshToken) => {
    const { error } = await supabase.rpc("store_refresh_token", {
        user_email: email,
        refresh_token: refreshToken,
    });

    if (error) {
        console.error("Error storing refresh token:", error.message);
    } else {
        console.log("Refresh token stored successfully!");
    }
};

/**
 * Fetches the refresh token for the current user from the database.
 * Ensures that the token is securely retrieved upon session initialization.
 *
 * @param {SupabaseClient} supabase - The Supabase client instance for interacting with the database.
 * @param {string} email - The email address of the signed-in user.
 * @returns {string} The refresh token if found, or an empty string if not.
 */
const fetchRefreshTokenFromDatabase = async (supabase, email) => {
    const { data, error } = await supabase.rpc("get_refresh_token", { email });

    if (error) {
        console.error("Error fetching refresh token:", error.message);
        return "";
    } else if (data) {
        console.log("Refresh token fetched succesfully!");
        return data;
    } else {
        console.log("No refresh token found for this user.");
        return "";
    }
};

function App() {
    // const session = useSession(); // similar to accessing a users info and tokens, session exists = have a user
    const supabase = useSupabaseClient(); // for talking to supabase
    const { session, isLoading } = useSessionContext();
    const [refreshToken, setRefreshToken] = useState("");

    // UseEffect to track session changes
    useEffect(() => {
        const manageRefreshToken = async () => {
            if (session) {
                const email = session.user.email;
                let token = session.provider_refresh_token;

                if (!token) {
                    token = await fetchRefreshTokenFromDatabase(
                        supabase,
                        email
                    );
                }

                // Store the refresh token if it's newly retrieved from the session
                if (token && token !== refreshToken) {
                    setRefreshToken(token);
                    storeRefreshTokenInDatabase(supabase, email, token);
                }
            }
        };
        manageRefreshToken();
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
