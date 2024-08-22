import React from "react";
import googleLogo from '../../assets/google-logo.png'
import "./LandingPage.css";



const LandingPage = ({ supabase }) => {
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

  return (
    <div className="container">
      <h1 className="title-text">CalPal</h1>
      <h1 className="header-text">
        The calendar assistant that{" "}
        <span className="special-header-text">speaks your language</span>
      </h1>
      <div className="description-container">
        <h3 className="description-text">
          CalPal converts natural language descriptions into events on your
          Google Calendar so creating events is now as easy as typing "practice
          coding on the 25th at 9 am"
        </h3>
        <h3 className="sign-in-label-text">
          To get started, sign in to sync your Google Calendar
        </h3>
      </div>

      <button onClick={() => googleSignIn()} className="google-signin-button">
        <img src={googleLogo} alt="google logo" className="google-icon" />
        Sign In With Google
      </button>
    </div>
  );
};

export default LandingPage;
