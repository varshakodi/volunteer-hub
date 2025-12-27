// src/App.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from './firebase'; 
import {
  collection, addDoc, doc, updateDoc, arrayUnion, onSnapshot
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { Calendar, MapPin, Users, Plus, LogIn, LogOut, User, CheckCircle, Filter, Info, Heart, Globe, Zap } from 'lucide-react';

const VolunteerHub = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  
  // --- FILTER STATE ---
  const [filterDate, setFilterDate] = useState('');

  const eventsCollectionRef = collection(db, "volunteer-events");

  // --- UseEffect Hooks ---
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setCurrentUser({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0]
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(eventsCollectionRef, (snapshot) => {
      const loadedEvents = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setEvents(loadedEvents);
    });
    return () => unsubscribe(); 
  }, []);
  

// --- FILTERING LOGIC (With Auto-Expire) ---
  const filteredEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => {
      const isFutureEvent = event.date >= today;
      const matchesFilter = !filterDate || event.date === filterDate;
      return isFutureEvent && matchesFilter;
    });
  }, [events, filterDate]);

  // --- Auth Functions ---
  const handleAuth = async () => {
    try {
      if (authMode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        await updateProfile(userCredential.user, { displayName: authForm.name });
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: authForm.name 
        });
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || userCredential.user.email.split('@')[0]
        });
      }
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (error) {
      alert('Authentication failed: ' + error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentPage('home');
  };

  const handleForgotPassword = async () => {
    if (!authForm.email) return alert('Please enter your email first.');
    try {
      await sendPasswordResetEmail(auth, authForm.email);
      alert('Reset email sent!');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // --- Event Functions ---
  const handleRegister = async (eventId, event) => {
    if (!currentUser) {
      setShowAuthModal(true);
      setAuthMode('login');
      return;
    }
    const isRegistered = event.volunteers.includes(currentUser.uid);
    if (isRegistered) return alert('Already registered!');
    
    try {
      const eventDocRef = doc(db, "volunteer-events", eventId);
      await updateDoc(eventDocRef, { volunteers: arrayUnion(currentUser.uid) });
      alert('Successfully registered!');
    } catch (error) {
      console.error(error);
      alert('Failed to register.');
    }
  };

  const handlePostEvent = async (eventData) => {
    if (!currentUser) return setShowAuthModal(true);
    try {
      await addDoc(eventsCollectionRef, {
        ...eventData,
        maxVolunteers: parseInt(eventData.maxVolunteers, 10),
        volunteers: [],
        createdBy: currentUser.uid,
      });
      setCurrentPage('events');
      alert('Event posted!');
    } catch (error) {
      alert('Failed to post event.');
    }
  };

  // --- Components ---
  
  // --- NEW FILLED-OUT HOME PAGE ---
  const HomePage = () => (
    <div>
      {/* Hero Section with Grid Background */}
      <div className="hero-wrapper">
        <div className="hero-glow"></div> {/* The purple glow effect */}
        
        <h2 className="hero-title">
          Mobilize the <br/>
          <span style={{ color: 'var(--primary)', textShadow: '0 0 20px rgba(57, 255, 20, 0.6)' }}>Future</span>
        </h2>
        
        <p className="hero-subtitle">
          Join the next generation of community helpers. Connect, organize, and make an impact with our decentralized volunteer network.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '3rem' }}>
          <button onClick={() => setCurrentPage('events')} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            START MISSION
          </button>
          <button onClick={() => setCurrentPage('about')} className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            LEARN MORE
          </button>
        </div>

        {/* Stats Strip to fill space */}
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Active Missions</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">200+</span>
            <span className="stat-label">Agents Deployed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">100%</span>
            <span className="stat-label">Impact Rate</span>
          </div>
        </div>
      </div>

      {/* Action Cards Section */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 1rem', paddingBottom: '4rem' }}>
        <div className="action-grid">
          <div className="action-card">
            <Globe size={40} className="icon" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Find Events</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Locate opportunities in your sector.</p>
            <button onClick={() => setCurrentPage('events')} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center' }}>Browse</button>
          </div>
          
          <div className="action-card">
            <Zap size={40} className="icon" style={{ marginBottom: '1rem' }} />
            <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>Create Impact</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Need volunteers? Post a mission.</p>
            <button onClick={() => setCurrentPage('post')} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Post Event</button>
          </div>
        </div>
      </div>
    </div>
  );

  const AboutPage = () => {
    const [activeStep, setActiveStep] = useState(1);
    const steps = [
      { id: 1, title: "Discover", desc: "Browse our curated list of local events. Whether you love animals, tech, or teaching, there is a spot for you." },
      { id: 2, title: "Connect", desc: "Create an account and register for events with one click. No complicated forms, just instant connection." },
      { id: 3, title: "Impact", desc: "Show up, help out, and track your contributions. Organizers get the help they need, and you make a real difference." }
    ];

    return (
      <div className="about-hero">
        <h2 style={{ fontSize: '2.5rem', color: 'var(--text-main)', marginBottom: '1rem' }}>Our Mission</h2>
        <p style={{ maxWidth: '700px', margin: '0 auto', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6' }}>
          Volunteer Hub bridges the gap between eager volunteers and the organizations that need them most. We believe in the power of technology to mobilize kindness.
        </p>
        <img src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?auto=format&fit=crop&w=1000&q=80" alt="Volunteers" className="about-image" />
        <h3 style={{ fontSize: '2rem', marginTop: '4rem', color: 'var(--primary)' }}>How It Works</h3>
        <p style={{ color: 'var(--text-muted)' }}>Click the steps below to learn more</p>
        <div className="steps-container">
          {steps.map((step) => (
            <div key={step.id} className={`step-card ${activeStep === step.id ? 'active' : ''}`} onClick={() => setActiveStep(step.id)}>
              <div className="step-number">0{step.id}</div>
              <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: activeStep === step.id ? 'var(--text-main)' : 'var(--text-muted)' }}>{step.title}</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

const EventsPage = () => {
    const eventsToDisplay = filteredEvents;
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Upcoming Events</h2>
          <div className="filter-group">
            <Filter size={18} style={{ color: 'var(--primary)' }} />
            <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            {filterDate && <button onClick={() => setFilterDate('')} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>}
          </div>
        </div>
        {eventsToDisplay.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'var(--bg-med)', border: '1px solid #333' }}>
            <p style={{ color: '#888' }}>No upcoming events found.</p>
          </div>
        ) : (
          <div>
            {eventsToDisplay.map(event => {
              const isRegistered = currentUser && event.volunteers.includes(currentUser.uid);
              const isFull = event.volunteers.length >= event.maxVolunteers;
              const spotsLeft = event.maxVolunteers - event.volunteers.length;
              
              return (
                <div key={event.id} className="event-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <h3>{event.title}</h3>
                    <span style={{ color: 'black', background: 'var(--primary)', padding: '0.2rem 0.5rem', fontWeight: 'bold' }}>{event.organizer}</span>
                  </div>
                  <div className="event-details-grid">
                    <p><Calendar size={16} className="icon"/> {event.date}</p>
                    <p><MapPin size={16} className="icon"/> {event.location}</p>
                    <p><Users size={16} className="icon"/> {spotsLeft} spots left</p>
                  </div>
                  <p style={{ color: '#ccc', marginBottom: '1rem' }}>{event.description}</p>
                  
                  {/* --- BUTTON AREA --- */}
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    {/* 1. If there is a link, show the Open Link button */}
                    {event.eventLink && (
                      <a 
                        href={event.eventLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-outline"
                        style={{ textDecoration: 'none', justifyContent: 'center', flex: 1 }}
                      >
                        <Globe size={18}/> Open Link
                      </a>
                    )}

                    {/* 2. The Standard Register Button */}
                    {isRegistered ? (
                      <button disabled className="btn" style={{ border: '1px solid var(--success)', color: 'var(--success)', background: 'transparent', flex: 1 }}>
                        <CheckCircle size={18}/> Registered
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleRegister(event.id, event)} 
                        disabled={isFull} 
                        className={isFull ? 'btn btn-danger' : 'btn btn-primary'}
                        style={{ flex: 1 }}
                      >
                        {isFull ? 'Full' : 'Register'}
                      </button>
                    )}
                  </div>
                  {/* ------------------- */}

                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

const PostEventPage = () => {
    // Added 'eventLink' to the state
    const [formData, setFormData] = useState({ 
      title: '', organizer: '', date: '', location: '', description: '', maxVolunteers: 10, eventLink: '' 
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title || !formData.date) return alert('Fill all fields');
      handlePostEvent(formData);
    };

    return (
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Post Mission</h2>
        <form onSubmit={handleSubmit} style={{ background: 'var(--bg-med)', padding: '2rem', border: '1px solid #333' }}>
          
          <label>Title</label>
          <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}/>
          
          <label>Organizer</label>
          <input type="text" value={formData.organizer} onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}/>
          
          {/* --- NEW FIELD: REGISTRATION LINK --- */}
          <label>Registration Link (Google Form / Zoom)</label>
          <input 
            type="url" 
            placeholder="https://..." 
            value={formData.eventLink} 
            onChange={(e) => setFormData({ ...formData, eventLink: e.target.value })}
          />
          {/* ------------------------------------ */}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div><label>Date</label><input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}/></div>
            <div><label>Max Volunteers</label><input type="number" min="1" value={formData.maxVolunteers} onChange={(e) => setFormData({ ...formData, maxVolunteers: e.target.value })}/></div>
          </div>
          
          <label>Location</label>
          <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}/>
          
          <label>Description</label>
          <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>Deploy Event</button>
        </form>
      </div>
    );
  };

  const MyEventsPage = () => {
    const myEvents = events.filter(event => currentUser && event.volunteers.includes(currentUser.uid));
    return (
      <div>
        <h2>My Registered Events</h2>
        {myEvents.length === 0 ? <p style={{ color: 'var(--text-muted)' }}>No events yet.</p> : myEvents.map(event => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            <p><Calendar size={16} className="icon" /> {event.date}</p>
          </div>
        ))}
      </div>
    );
  };
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '100px', color: 'var(--primary)' }}>Loading...</div>;

  return (
    <div>
      <header>
        <nav>
          <h1 onClick={() => setCurrentPage('home')}>VOLUNTEER HUB</h1>
          <div className="nav-links">
            <button onClick={() => setCurrentPage('home')}>Home</button>
            <button onClick={() => setCurrentPage('events')}>Events</button>
            <button onClick={() => setCurrentPage('about')}>About Us</button>
            {currentUser && <button onClick={() => setCurrentPage('my-events')}>My Events</button>}
          </div>
          <div className="auth-buttons">
            {currentUser ? (
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>LOGOUT</button>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setAuthMode('login'); }} className="btn btn-primary">LOGIN</button>
            )}
          </div>
        </nav>
      </header>

      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'events' && <EventsPage />}
        {currentPage === 'post' && <PostEventPage />}
        {currentPage === 'my-events' && <MyEventsPage />}
      </main>

      {showAuthModal && (
        <div className="modal" onClick={(e) => { if(e.target.className === 'modal') setShowAuthModal(false) }}>
          <div className="modal-content">
            <h2 style={{ marginTop: 0, color: 'var(--primary)' }}>{authMode === 'login' ? 'WELCOME BACK' : 'JOIN THE CREW'}</h2>
            <div className="form-field"><label>Email</label><input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}/></div>
            <div className="form-field"><label>Password</label><input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}/></div>
            {authMode === 'signup' && <div className="form-field"><label>Name</label><input type="text" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}/></div>}
            <button onClick={handleAuth} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>{authMode === 'login' ? 'LOG IN' : 'SIGN UP'}</button>
            <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
              <span onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')} style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>
                {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Log in"}
              </span>
            </div>
            {authMode === 'login' && <p onClick={handleForgotPassword} style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', marginTop: '0.5rem' }}>Forgot Password?</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerHub;