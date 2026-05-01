# 🔥 Date App

A premium, modern dating application built with the MERN stack (MongoDB, Express, React, Node.js). This app features a sleek, mobile-responsive UI inspired by Bumble, complete with interactive preference sliders and multiple photo management.

## ✨ Features

- **Swipe & Discover**: Find people based on your preferences with a smooth card interface.
- **Multiple Photos**: Upload up to 6 profile photos and cycle through them with a tap-to-cycle carousel.
- **Bumble-Style Preferences**: Modern dual-thumb range sliders for age and distance filters.
- **Privacy & Security**: Block unwanted users and securely change your password.
- **Real-time Chat**: Instant messaging with matches using Socket.io.
- **Responsive Design**: Fully optimized for mobile and desktop screens.

## 🚀 Tech Stack

- **Frontend**: React, React Router, Axios, Lucide-React (Icons)
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io
- **Security**: JWT Authentication, Bcrypt Password Hashing
- **Styling**: Vanilla CSS (Premium Glassmorphism Design)

## 🛠️ Installation & Local Setup

### 1. Clone the repository
```bash
git clone https://github.com/annmary-004/date-app.git
cd date-app
```

### 2. Setup Backend
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
PORT=5000
```
Run the server:
```bash
npm start
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
REACT_APP_API_URL=http://localhost:5000
```
Run the app:
```bash
npm start
```

## 🌐 Deployment

### Backend (Render)
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Environment Variables: `MONGO_URI`, `JWT_SECRET`, `PORT`

### Frontend (Vercel)
- Root Directory: `frontend`
- Framework Preset: `Create React App`
- Environment Variable: `REACT_APP_API_URL` (points to your Render URL)

---
Built with ❤️ by [Ann Mary](https://github.com/annmary-004)
