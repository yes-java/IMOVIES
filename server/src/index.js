import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { User, Movie, Show, Booking } from './models.js';
import { signToken, requireAuth, requireAdmin } from './auth.js';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 100 }));
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'IMovies API' }));

app.post('/api/auth/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password || password.length < 8)
    return res.status(400).json({ message: 'Name, email and a password of at least 8 characters are required.' });
  const normalizedEmail = email.toLowerCase().trim();
  if (await User.findOne({ email: normalizedEmail })) return res.status(409).json({ message: 'Email is already registered.' });
  const user = await User.create({ name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').toLowerCase().trim();
  const user = await User.findOne({ email }).select('+password');
  if (!user || !await bcrypt.compare(String(req.body.password || ''), user.password))
    return res.status(401).json({ message: 'Incorrect email or password.' });
  res.json({ token: signToken(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

app.get('/api/auth/me', requireAuth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.auth.sub).select('name email role');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

app.get('/api/movies', asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.q) filter.$text = { $search: String(req.query.q) };
  if (req.query.genre) filter.genre = String(req.query.genre);
  const page = Math.max(1, Number.parseInt(req.query.page || '1', 10));
  const limit = Math.min(30, Math.max(1, Number.parseInt(req.query.limit || '12', 10)));
  const [movies, total] = await Promise.all([
    Movie.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Movie.countDocuments(filter)
  ]);
  res.json({ movies, page, pages: Math.ceil(total / limit), total });
}));

app.get('/api/movies/:id', asyncHandler(async (req, res) => {
  const movie = await Movie.findOne({ _id: req.params.id, isActive: true });
  if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  res.json({ movie });
}));

app.get('/api/movies/:id/shows', asyncHandler(async (req, res) => {
  const shows = await Show.find({ movie: req.params.id, startsAt: { $gte: new Date() } }).sort({ startsAt: 1 });
  res.json({ shows });
}));

app.post('/api/bookings', requireAuth, asyncHandler(async (req, res) => {
  const { showId, seats } = req.body;
  if (!showId || !Array.isArray(seats) || !seats.length || seats.length > 10)
    return res.status(400).json({ message: 'Choose between 1 and 10 seats.' });
  const uniqueSeats = [...new Set(seats.map(String))];
  if (uniqueSeats.length !== seats.length) return res.status(400).json({ message: 'Duplicate seats selected.' });
  const show = await Show.findById(showId).populate('movie');
  if (!show || show.startsAt <= new Date()) return res.status(404).json({ message: 'Show not found or already started.' });
  const chosen = show.seats.filter(s => uniqueSeats.includes(s.code));
  if (chosen.length !== uniqueSeats.length) return res.status(400).json({ message: 'One or more seats do not exist.' });
  if (chosen.some(s => s.status !== 'available')) return res.status(409).json({ message: 'One or more seats are already booked. Refresh and try again.' });
  chosen.forEach(s => { s.status = 'booked'; });
  await show.save();
  const booking = await Booking.create({
    user: req.auth.sub, show: show._id, movieTitle: show.movie.title, theatre: show.theatre,
    startsAt: show.startsAt, seats: uniqueSeats, total: show.price * uniqueSeats.length
  });
  res.status(201).json({ booking });
}));

app.get('/api/bookings/mine', requireAuth, asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.auth.sub }).sort({ createdAt: -1 });
  res.json({ bookings });
}));

app.post('/api/bookings/:id/cancel', requireAuth, asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.auth.sub });
  if (!booking) return res.status(404).json({ message: 'Booking not found.' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled.' });
  if (booking.startsAt <= new Date()) return res.status(400).json({ message: 'Past or started shows cannot be cancelled.' });
  const show = await Show.findById(booking.show);
  if (show) {
    show.seats.forEach(s => { if (booking.seats.includes(s.code)) s.status = 'available'; });
    await show.save();
  }
  booking.status = 'cancelled';
  await booking.save();
  res.json({ booking });
}));

// Admin movie management
app.post('/api/admin/movies', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json({ movie });
}));
app.patch('/api/admin/movies/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  res.json({ movie });
}));
app.delete('/api/admin/movies/:id', requireAuth, requireAdmin, asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!movie) return res.status(404).json({ message: 'Movie not found.' });
  res.json({ message: 'Movie hidden from listings.' });
}));

app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.code === 11000) return res.status(409).json({ message: 'A record with this value already exists.' });
  res.status(500).json({ message: 'Server error. Please try again.' });
});

const port = process.env.PORT || 5000;
try {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');
  app.listen(port, () => console.log(`IMovies API listening on http://localhost:${port}`));
} catch (err) {
  console.error('MongoDB connection failed:', err.message);
  process.exit(1);
}
