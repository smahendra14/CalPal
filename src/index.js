import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from "./App.js"
import reportWebVitals from './reportWebVitals.js';
import { createClient } from '@supabase/supabase-js';
import { SessionContextProvider } from '@supabase/auth-helpers-react';

const supabase = createClient(
  "https://zoyjtlhkvaswvfbicynf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpveWp0bGhrdmFzd3ZmYmljeW5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTcyODkxMzQsImV4cCI6MjAzMjg2NTEzNH0.xAsjt7g1pc2j0AXvhk5ihtMWYNBepvuX0HGd6nVFwGw"
);

const root = ReactDOM.createRoot(document.getElementById('root'));
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
