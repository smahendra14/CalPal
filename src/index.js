import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.js";
import reportWebVitals from "./reportWebVitals.js";
import { createClient } from "@supabase/supabase-js";
import { SessionContextProvider } from "@supabase/auth-helpers-react";

const supabase = createClient(
  "https://aoapofprbeqinxzapgku.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFvYXBvZnByYmVxaW54emFwZ2t1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzOTQwODksImV4cCI6MjA0OTk3MDA4OX0.WmZqrRXiLysBQz5h8N2I56RztW15yIuWmrClkOwdc-4"
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <SessionContextProvider supabaseClient={supabase}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </SessionContextProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
