import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import {
    useSupabaseClient,
    useSessionContext,
} from "@supabase/auth-helpers-react";
import LandingPage from "./components/LandingPage/LandingPage.js";
import Home from "./components/Home/Home.js";
import Settings from "./components/Settings/Settings.js";
import FileUpload from "./components/FileUpload/FileUpload.js";
import Sidebar from "./components/Sidebar/Sidebar.js";
import PrivacyPolicy from "./components/Legal/PrivacyPolicy/PrivacyPolicy.js";
import TermsOfService from "./components/Legal/TermsOfService/TermsOfService.js";

/**
 * Sends the signed-in user's Google refresh token to the backend, which
 * encrypts it and stores it in the database.
 *
 * @param {string} accessToken - The user's Supabase access token
 * @param {string} refreshToken - The refresh token associated with the user's session
 */
const storeRefreshTokenInDatabase = async (accessToken, refreshToken) => {
    try {
        const res = await fetch(
            `${process.env.REACT_APP_API_URL}/api/auth/refresh-token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken}`,
                },
                body: JSON.stringify({ refreshToken }),
            }
        );

        if (!res.ok) {
            throw new Error(`Server responded with ${res.status}`);
        }

        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
            console.log("Encrypted refresh token stored successfully!");
        }
    } catch (error) {
        console.error("Error storing refresh token:", error.message);
        throw new Error("Failed to store refresh token securely");
    }
};

// Protected Route component to handle authentication
const ProtectedRoute = ({ children, session }) => {
    if (!session) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
    // const session = useSession(); // similar to accessing a users info and tokens, session exists = have a user
    const supabase = useSupabaseClient(); // for talking to supabase
    const { session, isLoading } = useSessionContext();
    const [refreshToken, setRefreshToken] = useState("");

    // UseEffect to track session changes
    useEffect(() => {
        const handleTokenStorage = async () => {
            if (session) {
                // Supabase only includes Google's refresh token in the session right after sign-in and doesn't keep it,
                // so it's sent to the backend now. The backend encrypts and stores it for offline calendar access (daily emails).
                const refreshToken = session.provider_refresh_token;
                if (refreshToken) {
                    try {
                        await storeRefreshTokenInDatabase(
                            session.access_token,
                            refreshToken
                        );
                    } catch (error) {
                        // Log error but don't break the user experience
                        console.error(
                            "Token storage failed, continuing without persistent tokens"
                        );
                    }
                }

                // The daily summary email runs on a UTC server, so it needs
                // to know which day is "today" for this user
                const { error } = await supabase
                    .from("user_info")
                    .update({
                        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    })
                    .eq("id", session.user.id);
                if (error) console.error("Error storing time zone:", error.message);
            }
        };

        handleTokenStorage();
    }, [session, supabase]); // Re-run effect when session changes

    if (isLoading) {
        return <></>; // used to get around flickering that occurs when you reload the page when signed in
    }

    return (
        <BrowserRouter>
            <div className="App">
                {session ? (
                    <div className="app-container">
                        <Sidebar supabase={supabase} session={session} />
                        <div className="main-content">
                            <Routes>
                                <Route
                                    path="/"
                                    element={
                                        <ProtectedRoute session={session}>
                                            <Home
                                                session={session}
                                                supabase={supabase}
                                                isLoading={isLoading}
                                                refreshToken={refreshToken}
                                                setRefreshToken={
                                                    setRefreshToken
                                                }
                                            />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/settings"
                                    element={
                                        <ProtectedRoute session={session}>
                                            <Settings
                                                session={session}
                                                supabase={supabase}
                                            />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/file-upload"
                                    element={
                                        <ProtectedRoute session={session}>
                                            <FileUpload
                                                session={session}
                                                supabase={supabase}
                                            />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/privacy"
                                    element={<PrivacyPolicy />}
                                />
                                <Route
                                    path="/terms"
                                    element={<TermsOfService />}
                                />
                                <Route
                                    path="*"
                                    element={<Navigate to="/" replace />}
                                />
                            </Routes>
                        </div>
                    </div>
                ) : (
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <LandingPage
                                    supabase={supabase}
                                    refreshToken={refreshToken}
                                    setRefreshToken={setRefreshToken}
                                />
                            }
                        />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                )}
            </div>
        </BrowserRouter>
    );
}

export default App;
