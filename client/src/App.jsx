import React, { useEffect, useState } from 'react';
import { Link, NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Film, Search, Ticket, UserRound, LogOut, Star, Clock3, MapPin, ArrowRight, Popcorn, X } from 'lucide-react';
import api from './api';

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('imovies_user') || 'null'); } catch { return null; }
  });
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const notify = (message) => { setToast(message); window.setTimeout(() => setToast(''), 3200); };
  const logout = () => { localStorage.removeItem('imovies_token'); localStorage.removeItem('imovies_user'); setUser(null); notify('You have been logged out.'); };
  return <div className="app-shell">
    <header className="navbar-wrap"><nav className="container navbar navbar-expand-lg">
      <Link className="brand" to="/"><span className="brand-icon"><Film size={21}/></span>i<span>MOVIES</span></Link>
      <div className="nav-links">
        <NavLink to="/" end>Discover</NavLink>
        <a href="/#movies">Movies</a>
        {user && <NavLink to="/bookings">My tickets</NavLink>}
      </div>
      <div className="nav-actions">
        <label className="nav-search"><Search size={16}/><input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && (window.location.href = '/?q=' + encodeURIComponent(query))} placeholder="Search movies"/></label>
        {user ? <><span className="welcome">Hi, {user.name.split(' ')[0]}</span><button className="icon-btn" title="Log out" onClick={logout}><LogOut size={18}/></button></> : <Link className="sign-in" to="/login"><UserRound size={16}/> Sign in</Link>}
      </div>
    </nav></header>
    <main><Routes>
      <Route path="/" element={<Home notify={notify}/>}/>
      <Route path="/movie/:id" element={<MoviePage user={user} notify={notify}/>}/>
      <Route path="/login" element={<Auth mode="login" setUser={setUser} notify={notify}/>}/>
      <Route path="/register" element={<Auth mode="register" setUser={setUser} notify={notify}/>}/>
      <Route path="/bookings" element={<Bookings user={user} notify={notify}/>}/>
      <Route path="*" element={<div className="container py-5"><h2>Page not found</h2><Link to="/">Back home</Link></div>}/>
    </Routes></main>
    <footer><div className="container footer-inner"><Link className="brand" to="/"><span className="brand-icon"><Film size={18}/></span>i<span>MOVIES</span></Link><span>Your seat. Your story. Your movie night.</span><span>© 2026 IMovies</span></div></footer>
    {toast && <div className="toast-message"><span>{toast}</span><button onClick={() => setToast('')}><X size={15}/></button></div>}
  </div>;
}

function Home({ notify }) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(new URLSearchParams(window.location.search).get('q') || '');
  const [genre, setGenre] = useState('All');
  useEffect(() => { api.get('/movies').then(r => setMovies(r.data.movies)).catch(() => notify('Could not load movies. Is the server running?')).finally(() => setLoading(false)); }, []);
  const filtered = movies.filter(m => (!query || (m.title + ' ' + m.synopsis + ' ' + (m.genre || []).join(' ')).toLowerCase().includes(query.toLowerCase())) && (genre === 'All' || (m.genre || []).includes(genre)));
  const genres = ['All', ...new Set(movies.flatMap(m => m.genre || []))];
  return <><section className="hero"><div className="hero-glow"></div><div className="container hero-content">
    <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"></span> THE BIG SCREEN EXPERIENCE</div><h1>Your next story<br/>starts <em>here.</em></h1><p>Big feelings. Brilliant stories. Unforgettable nights. Find the movie that makes your day.</p><div className="hero-buttons"><a href="#movies" className="btn-primary-custom">Explore movies <ArrowRight size={17}/></a><span className="hero-note"><Popcorn size={17}/> The perfect night out</span></div></div>
    <div className="hero-art"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="ticket-art"><Film size={62}/><span>ADMIT ONE</span><strong>YOUR<br/>MOVIE<br/>NIGHT</strong><div className="ticket-line"></div><small>GOOD TIMES AHEAD</small></div><div className="floating-star star-a">✦</div><div className="floating-star star-b">✧</div><div className="floating-pill">NOW SHOWING <span>●</span></div></div>
  </div><div className="hero-bottom container"><span><strong>01</strong> Discover films</span><span><strong>02</strong> Pick your seats</span><span><strong>03</strong> Enjoy the show</span></div></section>
  <section className="movies-section container" id="movies"><div className="section-top"><div><div className="eyebrow">PICK YOUR NEXT ADVENTURE</div><h2>Now <em>showing</em></h2><p className="section-subtitle">Handpicked stories for every kind of movie lover.</p></div><div className="movie-count">{filtered.length.toString().padStart(2,'0')} <span>FILMS</span></div></div>
  <div className="filters"><div className="filter-search"><Search size={17}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Find a movie, genre or mood..."/></div><div className="genre-chips">{genres.map(g => <button key={g} className={genre === g ? 'chip active' : 'chip'} onClick={() => setGenre(g)}>{g}</button>)}</div></div>
  {loading ? <div className="loading">Loading the good stuff…</div> : filtered.length ? <div className="movie-grid">{filtered.map((m, i) => <MovieCard key={m._id} movie={m} index={i}/>)}</div> : <div className="empty-state"><Film size={34}/><h3>No films found</h3><p>Try a different search or genre.</p></div>}
  </section><section className="experience-band"><div className="container experience-inner"><div className="experience-icon"><Ticket size={26}/></div><div><h3>Make it a movie night.</h3><p>Pick your film, choose your seats, and let the magic begin.</p></div><a href="#movies">Find your film <ArrowRight size={16}/></a></div></section></>;
}

function MovieCard({ movie, index }) {
  return <Link to={`/movie/${movie._id}`} className="movie-card" style={{'--delay': `${index * 70}ms`}}>
    <div className="poster-wrap">{movie.posterUrl ? <img src={movie.posterUrl} alt={movie.title} loading="lazy" onError={e => {e.currentTarget.style.display='none';}}/> : null}<div className="poster-fallback"><Film size={40}/><span>IMOVIES</span></div><div className="poster-overlay"></div><span className="rating"><Star size={13} fill="currentColor"/> {Number(movie.rating || 0).toFixed(1)}</span><span className="poster-genre">{movie.genre?.[0] || 'Cinema'}</span><span className="view-film">View film <ArrowRight size={15}/></span></div>
    <div className="movie-info"><h3>{movie.title}</h3><div className="movie-meta"><span>{movie.language}</span><span className="meta-dot">•</span><span><Clock3 size={13}/> {movie.durationMinutes} min</span></div><p>{movie.synopsis}</p></div>
  </Link>;
}

function MoviePage({ user, notify }) {
  const { id } = useParams(); const navigate = useNavigate();
  const [movie, setMovie] = useState(null); const [shows, setShows] = useState([]); const [selected, setSelected] = useState(null); const [seats, setSeats] = useState([]); const [busy, setBusy] = useState(false);
  useEffect(() => { api.get(`/movies/${id}`).then(r => setMovie(r.data.movie)).catch(() => notify('Movie not found.')); api.get(`/movies/${id}/shows`).then(r => setShows(r.data.shows)).catch(() => {}); }, [id]);
  const toggleSeat = code => setSeats(old => old.includes(code) ? old.filter(s => s !== code) : old.length < 10 ? [...old, code] : old);
  async function book() {
    if (!user) return navigate('/login');
    if (!selected || !seats.length) return notify('Choose a show and at least one seat.');
    setBusy(true);
    try { const r = await api.post('/bookings', { showId: selected._id, seats }); notify(`Booking confirmed! ${r.data.booking.seats.join(', ')}`); navigate('/bookings'); }
    catch (e) { notify(e.response?.data?.message || 'Booking failed. Please retry.'); api.get(`/movies/${id}/shows`).then(r => setShows(r.data.shows)); }
    finally { setBusy(false); }
  }
  if (!movie) return <div className="container py-5">Loading movie…</div>;
  const selectedShow = shows.find(s => s._id === selected?._id);
  return <div className="container detail-page"><Link to="/" className="back-link">← Back to movies</Link><div className="detail-layout"><div className="detail-poster">{movie.posterUrl && <img src={movie.posterUrl} alt={movie.title}/>}<span className="rating"><Star size={13} fill="currentColor"/> {movie.rating}</span></div><div className="detail-copy"><div className="eyebrow">FEATURED FILM</div><h1>{movie.title}</h1><div className="detail-meta"><span><Star size={15}/> {movie.rating}/10</span><span><Clock3 size={15}/> {movie.durationMinutes} min</span><span>{movie.language}</span></div><div className="detail-genres">{movie.genre?.map(g => <span key={g}>{g}</span>)}</div><p>{movie.synopsis}</p><div className="booking-panel"><h3>Choose your showtime</h3><p className="muted">IMovies theatres · Indore</p>{shows.length ? <div className="show-list">{shows.map(s => <button key={s._id} className={selected?._id === s._id ? 'show-option selected' : 'show-option'} onClick={() => {setSelected(s);setSeats([]);}}><strong>{new Date(s.startsAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</strong><span>{s.theatre}</span><small>₹{s.price}</small></button>)}</div> : <p>No upcoming shows are available.</p>}
  {selectedShow && <><div className="seat-heading"><h3>Select your seats</h3><span>{seats.length}/10 selected</span></div><div className="screen">SCREEN THIS WAY</div><div className="seat-grid">{selectedShow.seats.map(s => <button key={s.code} disabled={s.status !== 'available'} title={`${s.code} — ${s.status}`} className={`seat ${s.status === 'booked' ? 'taken' : seats.includes(s.code) ? 'chosen' : ''}`} onClick={() => toggleSeat(s.code)}>{s.code}</button>)}</div><div className="seat-legend"><span><i></i> Available</span><span><i className="legend-chosen"></i> Selected</span><span><i className="legend-taken"></i> Booked</span></div><div className="booking-total"><div><span>Total amount</span><strong>₹{selectedShow.price * seats.length}</strong></div><button disabled={!seats.length || busy} onClick={book}>{busy ? 'Booking…' : user ? 'Confirm booking' : 'Sign in to book'} <ArrowRight size={16}/></button></div></>}</div></div></div></div>;
}

function Auth({ mode, setUser, notify }) {
  const navigate = useNavigate(); const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [busy, setBusy] = useState(false);
  const register = mode === 'register';
  async function submit(e) { e.preventDefault(); setBusy(true); try { const r = await api.post(`/auth/${mode}`, { name, email, password }); localStorage.setItem('imovies_token', r.data.token); localStorage.setItem('imovies_user', JSON.stringify(r.data.user)); setUser(r.data.user); notify(register ? 'Welcome to IMovies!' : 'Welcome back!'); navigate('/'); } catch (err) { notify(err.response?.data?.message || 'Could not sign in. Check the API server.'); } finally { setBusy(false); } }
  return <div className="auth-page"><div className="auth-card"><div className="auth-mark"><Film size={25}/></div><div className="eyebrow">{register ? 'JOIN THE CLUB' : 'WELCOME BACK'}</div><h1>{register ? <>Your movie nights,<br/><em>upgraded.</em></> : <>Good to see<br/><em>you again.</em></>}</h1><p>{register ? 'Create an account and make every seat yours.' : 'Your next great movie night is just a few clicks away.'}</p><form onSubmit={submit}>{register && <label>Full name<input value={name} onChange={e => setName(e.target.value)} required minLength="2" placeholder="Your name"/></label>}<label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"/></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength="8" placeholder="At least 8 characters"/></label><button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button></form><div className="auth-switch">{register ? 'Already have an account?' : 'New to IMovies?'} <Link to={register ? '/login' : '/register'}>{register ? 'Sign in' : 'Create account'}</Link></div><div className="demo-hint">Demo login: <strong>user@imovies.demo</strong> / <strong>User123!</strong></div></div></div>;
}

function Bookings({ user, notify }) {
  const [bookings, setBookings] = useState([]); const [loading, setLoading] = useState(true);
  async function refresh() { try { const r = await api.get('/bookings/mine'); setBookings(r.data.bookings); } catch { notify('Please sign in to view your tickets.'); } finally { setLoading(false); } }
  useEffect(() => { if (user) refresh(); else setLoading(false); }, [user]);
  async function cancel(id) { try { await api.post(`/bookings/${id}/cancel`); notify('Booking cancelled.'); refresh(); } catch (e) { notify(e.response?.data?.message || 'Cancellation failed.'); } }
  if (!user) return <div className="auth-required"><Ticket size={40}/><h2>Your tickets live here.</h2><p>Sign in to see your booking history.</p><Link className="btn-primary-custom" to="/login">Sign in <ArrowRight size={16}/></Link></div>;
  return <div className="container bookings-page"><div className="eyebrow">YOUR CINEMA JOURNEY</div><h1>My <em>tickets</em></h1><p className="section-subtitle">All your movie plans, in one place.</p>{loading ? <p>Loading bookings…</p> : bookings.length ? <div className="booking-history">{bookings.map(b => <div className="history-card" key={b._id}><div className="history-icon"><Ticket size={22}/></div><div className="history-main"><h3>{b.movieTitle}</h3><p><MapPin size={14}/> {b.theatre} · {new Date(b.startsAt).toLocaleString()}</p><span>Seats: {b.seats.join(', ')}</span></div><div className="history-side"><strong>₹{b.total}</strong><span className={`status ${b.status}`}>{b.status}</span>{b.status === 'confirmed' && new Date(b.startsAt) > new Date() && <button onClick={() => cancel(b._id)}>Cancel booking</button>}</div></div>)}</div> : <div className="empty-state"><Ticket size={36}/><h3>No tickets yet</h3><p>Your next movie night is waiting.</p><Link to="/" className="btn-primary-custom">Browse movies <ArrowRight size={16}/></Link></div>}</div>;
}

export default App;
