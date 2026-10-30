import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Movie, Show, Booking } from './models.js';

await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/imovies');
await Promise.all([User.deleteMany({}), Movie.deleteMany({}), Show.deleteMany({}), Booking.deleteMany({})]);
const [admin, user] = await User.create([
  { name: 'Demo Admin', email: 'admin@imovies.demo', password: await bcrypt.hash('Admin123!', 12), role: 'admin' },
  { name: 'Demo User', email: 'user@imovies.demo', password: await bcrypt.hash('User123!', 12), role: 'user' }
]);
const movies = await Movie.create([
  { title: 'The Last Orbit', synopsis: 'A crew races to save a fading space station and the people aboard.', genre: ['Sci-Fi', 'Adventure'], language: 'English', durationMinutes: 136, rating: 8.4, posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80' },
  { title: 'Monsoon Melody', synopsis: 'Two musicians find an unexpected connection during a rainy season.', genre: ['Romance', 'Drama'], language: 'Hindi', durationMinutes: 124, rating: 7.8, posterUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80' },
  { title: 'Midnight Protocol', synopsis: 'A cyber investigator has one night to stop a city-wide blackout.', genre: ['Thriller', 'Action'], language: 'English', durationMinutes: 118, rating: 8.1, posterUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=900&q=80' },
  { title: 'The Little Planet', synopsis: 'A curious child discovers a tiny world hidden in the garden.', genre: ['Animation', 'Family'], language: 'Hindi', durationMinutes: 96, rating: 8.7, posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=900&q=80' }
]);
const seats = Array.from({ length: 40 }, (_, i) => ({ code: `${String.fromCharCode(65 + Math.floor(i / 8))}${(i % 8) + 1}`, status: 'available' }));
const now = Date.now();
for (const movie of movies) {
  await Show.create([
    { movie: movie._id, theatre: 'IMovies Central', city: 'Indore', startsAt: new Date(now + 3 * 60 * 60 * 1000), price: 220, seats: seats.map(s => ({ ...s })) },
    { movie: movie._id, theatre: 'IMovies Premium', city: 'Indore', startsAt: new Date(now + 7 * 60 * 60 * 1000), price: 300, seats: seats.map(s => ({ ...s })) }
  ]);
}
console.log('Seed complete. Demo accounts: admin@imovies.demo / Admin123! and user@imovies.demo / User123!');
await mongoose.disconnect();
