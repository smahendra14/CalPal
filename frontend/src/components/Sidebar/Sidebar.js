import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Sidebar.css";

function Sidebar({ supabase, session }) {
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Log a user out of their Supabase session
     */
    async function signOut() {
        await supabase.auth.signOut();
    }

    return (
        <div className="sidebar-body">
            <div className="title-container">
                <h1 className="title-text">CalPal</h1>
            </div>
            <div className="button-container">
                <button
                    className={`btn ${
                        location.pathname === "/" ? "active" : ""
                    }`}
                    onClick={() => navigate("/")}
                >
                    Home
                </button>
                <button
                    className={`btn ${
                        location.pathname === "/settings" ? "active" : ""
                    }`}
                    onClick={() => navigate("/settings")}
                >
                    Settings
                </button>
                <button
                    className={`btn ${
                        location.pathname === "/file-upload" ? "active" : ""
                    }`}
                    onClick={() => navigate("/file-upload")}
                >
                    Upload Syllabus
                </button>
            </div>
            <p>
                You are currently signed in to the primary calendar associated
                with:
                <span className="email">{session.user.email}</span>
            </p>
            <div className="footer">
                <hr className="separator" />
                <p className="logout-text" onClick={() => signOut()}>
                    Logout
                </p>
            </div>
        </div>
    );
}

export default Sidebar;
