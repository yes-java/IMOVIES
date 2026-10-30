# IMovies — MERN Movie Ticket Booking

A full-stack starter project using React, Express, MongoDB and JWT authentication.

## Features
- Browse and search movies
- Register and log in
- View movie details and showtimes
- Select seats and create bookings
- View booking history
- Admin-ready movie CRUD API (requires `admin` role)
- Password hashing with bcrypt, JWT auth, validation and basic rate limiting

> This is a learning/demo project. Payments are simulated; do not use it for real transactions without adding a payment provider, robust seat-locking transactions, production security and tests.

## Requirements
- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI

## Setup

### 1. Backend
```bash
cd server
cp .env.example .env
# Edit MONGO_URI and JWT_SECRET in .env
npm install
npm run seed
npm run dev
```
Backend runs at `http://localhost:5000`.

Demo admin after seeding:
- Email: `admin@imovies.demo`
- Password: `Admin123!`

Demo user:
- Email: `user@imovies.demo`
- Password: `User123!`

### 2. Frontend (new terminal)
```bash
cd client
npm install
npm run dev
```
Open the URL shown by Vite (usually `http://localhost:5173`).

## Important notes
- The seed command clears and recreates demo movies and demo accounts.
- To promote another user to admin, update that user's `role` to `admin` in MongoDB.
- Seat availability is checked on the server before booking, but a production deployment should use atomic transactions/unique constraints or a dedicated seat-locking design to prevent concurrent double-bookings.
- Add your own GitHub and deployed demo URLs to your project dashboard after publishing.
