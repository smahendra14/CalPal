import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import {
    useSession,
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
import { encryptToken } from "./utils/encryption.js";

/**
 * Stores the encrypted refresh token of the signed-in user in the database
 * by invoking a Supabase database function via RPC (Remote Procedure Call).
 * This provides a secure way to persist sensitive information.
 *
 * @param {SupabaseClient} supabase - The Supabase client instance for interacting with the database.
 * @param {string} email - The email address of the signed-in user
 * @param {string} refreshToken - The refresh token associated with the user's session
 */
const storeRefreshTokenInDatabase = async (supabase, email, refreshToken) => {
    try {
        // Encrypt the refresh token before storing
        const encryptedToken = encryptToken(refreshToken);

        const { error } = await supabase.rpc("store_refresh_token", {
            user_email: email,
            refresh_token: encryptedToken,
        });

        if (error) {
            throw error;
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
                // Check for and store the refresh token if available
                const refreshToken = session.provider_refresh_token;
                const email = session.user.email;
                if (refreshToken) {
                    try {
                        await storeRefreshTokenInDatabase(
                            supabase,
                            email,
                            refreshToken
                        );
                    } catch (error) {
                        // Log error but don't break the user experience
                        console.error(
                            "Token storage failed, continuing without persistent tokens"
                        );
                    }
                }
            }
        };

        handleTokenStorage();
    }, [session]); // Re-run effect when session changes

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
