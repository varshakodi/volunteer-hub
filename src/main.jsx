// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
// Import our main component from App.jsx
import VolunteerHub from './App.jsx' 
import './index.css' // This imports our styles

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <VolunteerHub />
  </React.StrictMode>,
)