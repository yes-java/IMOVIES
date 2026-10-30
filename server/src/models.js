import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  synopsis: { type: String, default: '' },
  genre: [{ type: String }],
  language: { type: String, default: 'English' },
  durationMinutes: { type: Number, default: 120, min: 1 },
  rating: { type: Number, default: 0, min: 0, max: 10 },
  posterUrl: { type: String, default: '' },
  releaseDate: { type: Date },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
movieSchema.index({ title: 'text', synopsis: 'text', genre: 'text' });

const showSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theatre: { type: String, required: true },
  city: { type: String, required: true },
  startsAt: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  seats: [{
    code: { type: String, required: true },
    status: { type: String, enum: ['available', 'booked'], default: 'available' }
  }]
}, { timestamps: true });
showSchema.index({ movie: 1, startsAt: 1 });

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  movieTitle: { type: String, required: true },
  theatre: { type: String, required: true },
  startsAt: { type: Date, required: true },
  seats: [{ type: String, required: true }],
  total: { type: Number, required: true },
  status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
export const Movie = mongoose.model('Movie', movieSchema);
export const Show = mongoose.model('Show', showSchema);
export const Booking = mongoose.model('Booking', bookingSchema);
