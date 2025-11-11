// src/App.jsx
import React, { useState, useEffect } from 'react';
// Import our new Firebase auth and db
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
import { Calendar, MapPin, Users, Plus, LogIn, LogOut, User, CheckCircle } from 'lucide-react';

const VolunteerHub = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });

  // --- Data Collection Reference ---
  const eventsCollectionRef = collection(db, "volunteer-events");

  // --- UseEffect Hooks ---

  // 1. THIS IS THE NEW AUTH LOGIC
  // This runs ONLY ONCE when the app first loads
  useEffect(() => {
    // Check if a user is ALREADY logged in (e.g., from a previous session)
    // This stops the buggy "listener" from running
    const user = auth.currentUser;
    if (user) {
      setCurrentUser({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0]
      });
    }
    // We are done loading, even if there's no user
    setLoading(false);
  }, []); // <-- Empty dependency array. Runs ONCE.

  // 2. Load events from Firebase
  useEffect(() => {
    const unsubscribe = onSnapshot(eventsCollectionRef, (snapshot) => {
      const loadedEvents = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));
      setEvents(loadedEvents);
    });
    
    return () => unsubscribe(); // Cleanup
  }, []);

  // --- Auth Functions (Real) ---
  
  // 2. THIS IS THE NEW AUTH LOGIC
  // We manually set the user state on login/signup
  const handleAuth = async () => {
    try {
      if (authMode === 'signup') {
        // 1. Create the user
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        // 2. Update their profile
        await updateProfile(userCredential.user, {
          displayName: authForm.name
        });
        
        // 3. Manually set state with the CORRECT name from the form
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: authForm.name // <-- The correct name
        });

      } else { // 'login'
        // 1. Sign in
        const userCredential = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        
        // 2. Manually set state with the user's saved name
        setCurrentUser({
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName || userCredential.user.email.split('@')[0]
        });
      }
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed: ' + error.message);
    }
  };

  // 3. THIS IS THE NEW AUTH LOGIC
  // We manually clear the user on logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Manually set state
      setCurrentUser(null);
      setCurrentPage('home');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleForgotPassword = async () => {
    if (!authForm.email) {
      alert('Please enter your email in the email field first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, authForm.email);
      alert('Password reset email sent! Check your inbox.');
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '', name: '' });
    } catch (error) {
      console.error('Forgot password error:', error);
      alert('Failed to send reset email: ' + error.message);
    }
  };

  // --- Event Functions (Real) ---

  const handleRegister = async (eventId, event) => {
    if (!currentUser) {
      setShowAuthModal(true);
      setAuthMode('login');
      return;
    }
    const isRegistered = event.volunteers.includes(currentUser.uid);
    const isFull = event.volunteers.length >= event.maxVolunteers;

    if (isRegistered) {
      alert('You are already registered!');
      return;
    }
    if (isFull) {
      alert('This event is full!');
      return;
    }
    try {
      const eventDocRef = doc(db, "volunteer-events", eventId);
      await updateDoc(eventDocRef, {
        volunteers: arrayUnion(currentUser.uid)
      });
      alert('Successfully registered!');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please try again.');
    }
  };

  const handlePostEvent = async (eventData) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    try {
      await addDoc(eventsCollectionRef, {
        ...eventData,
        maxVolunteers: parseInt(eventData.maxVolunteers, 10),
        volunteers: [],
        createdBy: currentUser.uid,
      });
      setCurrentPage('events');
      alert('Event posted successfully!');
    } catch (error) {
      console.error('Error posting event:', error);
      alert('Failed to post event. Please try again.');
    }
  };

  // --- Page Components ---
  // (All page components are identical to before)
  
  const HomePage = () => (
    <div className="space-y-8">
      <div className="event-card" style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: '2rem' }}>Find Your Next Opportunity to Help</h2>
        <p>Browse local events and make a difference in your community.</p>
        <button
          onClick={() => setCurrentPage('events')}
          className="btn"
        >
          See All Events
        </button>
      </div>
      <div className="event-card">
        <h3 className="text-2xl font-bold mb-4">For Organizers</h3>
        <p className="text-gray-600 mb-6">Have an event that needs volunteers? Post it here and reach our community.</p>
        <button
          onClick={() => setCurrentPage('post')}
          className="btn"
        >
          Post an Event
        </button>
      </div>
    </div>
  );

  const EventsPage = () => {
    return (
      <div>
        <h2>Available Volunteer Events</h2>
        {events.length === 0 ? (
          <p>No events available. Be the first to post one!</p>
        ) : (
          <div>
            {events.map(event => {
              const isRegistered = currentUser && event.volunteers.includes(currentUser.uid);
              const isFull = event.volunteers.length >= event.maxVolunteers;
              const spotsLeft = event.maxVolunteers - event.volunteers.length;
              
              return (
                <div key={event.id} className="event-card">
                  <h3>{event.title}</h3>
                  <div className="space-y-2">
                    <p><strong>Organizer:</strong> {event.organizer}</p>
                    <p><Calendar size={16} className="icon" /> {new Date(event.date + 'T00:00:00').toLocaleDateString()}</p>
                    <p><MapPin size={16} className="icon" /> {event.location}</p>
                    <p><Users size={16} className="icon" /> {spotsLeft} spots left ({event.volunteers.length}/{event.maxVolunteers})</p>
                  </div>
                  <p>{event.description}</p>
                  {isRegistered ? (
                    <button disabled className="btn">
                      <CheckCircle size={20} className="icon" />
                      Registered
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRegister(event.id, event)}
                      disabled={isFull}
                      className="btn"
                    >
                      {isFull ? 'Event Full' : 'Register to Volunteer'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const PostEventPage = () => {
    const [formData, setFormData] = useState({
      title: '', organizer: '', date: '', location: '', description: '', maxVolunteers: 10
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.title || !formData.organizer || !formData.date || !formData.location || !formData.description) {
        alert('Please fill in all fields');
        return;
      }
      handlePostEvent(formData);
    };

    return (
      <div className="form-page">
        <h2>Post Your Event</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label>Event Title *</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}/>
          </div>
          <div>
            <label>Organizer Name *</label>
            <input type="text" value={formData.organizer} onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}/>
          </div>
          <div>
            <label>Date *</label>
            <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })}/>
          </div>
          <div>
            <label>Location *</label>
            <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })}/>
          </div>
          <div>
            <label>Max Volunteers *</label>
            <input type="number" min="1" value={formData.maxVolunteers} onChange={(e) => setFormData({ ...formData, maxVolunteers: e.target.value })}/>
          </div>
          <div>
            <label>Description *</label>
            <textarea rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}/>
          </div>
          <button type="submit" className="btn">
            <Plus className="icon" size={20} />
            Post Event
          </button>
        </form>
      </div>
    );
  };

  const MyEventsPage = () => {
    const myEvents = events.filter(event => currentUser && event.volunteers.includes(currentUser.uid));
    return (
      <div>
        <h2>My Registered Events</h2>
        {myEvents.length === 0 ? (
          <p>You haven't registered for any events yet.</p>
        ) : (
          myEvents.map(event => (
            <div key={event.id} className="event-card">
              <h3>{event.title}</h3>
              <p><Calendar size={16} className="icon" /> {new Date(event.date + 'T00:00:00').toLocaleDateString()}</p>
              <p><MapPin size={16} className="icon" /> {event.location}</p>
            </div>
          ))
        )}
      </div>
    );
  };
  
  // --- Render App ---
  
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <header>
        <nav>
          <h1>Volunteer Hub</h1>
          <div className="nav-links">
            <button onClick={() => setCurrentPage('home')}>Home</button>
            <button onClick={() => setCurrentPage('events')}>Find Events</button>
            <button onClick={() => setCurrentPage('post')}>Post Event</button>
            {currentUser && (
              <button onClick={() => setCurrentPage('my-events')}>My Events</button>
            )}
          </div>
          <div className="auth-buttons">
            {currentUser ? (
              <>
                <span><User size={20} className="icon" /> {currentUser.name}</span>
                <button onClick={handleLogout}><LogOut size={20} className="icon" /> Logout</button>
              </>
            ) : (
              <button onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}>
                <LogIn size={20} className="icon" /> Login
              </button>
            )}
          </div>
        </nav>
      </header>

      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'events' && <EventsPage />}
        {currentPage === 'post' && <PostEventPage />}
        {currentPage === 'my-events' && <MyEventsPage />}
      </main>

      {showAuthModal && (
        <div className="modal">
          <div className="modal-content form-page">
            <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
            <div className="space-y-4">
              
              {authMode === 'signup' && (
                <div>
                  <label>Name</label>
                  <input type="text" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}/>
                </div>
              )}
              
              <div>
                <label>Email</label>
                <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}/>
              </div>
              <div>
                <label>Password</label>
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}/>
              </div>
              <button onClick={handleAuth} className="btn">
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </div>
            
            <hr style={{ margin: '1rem 0' }} />

            {authMode === 'login' ? (
              <>
                <button onClick={handleForgotPassword} style={{ background: 'none', color: '#007bff', border: 'none', cursor: 'pointer', padding: '5px' }}>
                  Forgot Password?
                </button>
                <button onClick={() => setAuthMode('signup')} style={{ background: 'none', color: '#007bff', border: 'none', cursor: 'pointer', padding: '5px' }}>
                  Don't have an account? Sign up
                </button>
              </>
            ) : (
              <button onClick={() => setAuthMode('login')} style={{ background: 'none', color: '#007bff', border: 'none', cursor: 'pointer', padding: '5px' }}>
                Already have an account? Login
              </button>
            )}
            
            <button onClick={() => setShowAuthModal(false)} style={{ background: '#6c757d', marginTop: '10px' }} className="btn">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerHub;