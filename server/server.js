// ------------------------
// Digi Rakshak Backend
// ------------------------

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// JSON file to store users
const usersFile = path.join(__dirname, "users.json");

// Helper functions
const readUsers = () => {
  if (!fs.existsSync(usersFile)) return [];
  const data = fs.readFileSync(usersFile, "utf-8");
  return data ? JSON.parse(data) : [];
};

const writeUsers = (users) => {
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
};

// ------------------------
// Signup API
// ------------------------
app.post("/api/signup", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Please fill all fields!" });
  }

  // Validate email: must end with @gmail.com
  if (!email.endsWith("@gmail.com")) {
    return res.json({ success: false, message: "Email must be a Gmail address!" });
  }

  const users = readUsers();
  const existingUser = users.find(u => u.email === email);

  if (existingUser) {
    return res.json({ success: false, message: "Email already registered!" });
  }

  const newUser = {
    name,
    email,
    password,          // stored in plain text for now
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  // Return user without password
  const { password: _p, ...safeUser } = newUser;
  res.json({ success: true, message: "Account created successfully!", user: safeUser });
});

// ------------------------
// Login API
// ------------------------
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ success: false, message: "Please fill all fields!" });
  }

  const users = readUsers();
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.json({ success: false, message: "Invalid credentials!" });
  }

  // Return user without password
  const { password: _p, ...safeUser } = user;
  res.json({ success: true, message: "Login successful!", user: safeUser });
});

// ------------------------
// Get all users (safe: no passwords)
// ------------------------
app.get("/api/users", (req, res) => {
  const users = readUsers();
  const safeUsers = users.map(({ password, ...rest }) => rest);
  res.json({ success: true, users: safeUsers });
});

// ------------------------
// Get single user by email (safe)
// ------------------------
app.get("/api/users/:email", (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.email === req.params.email);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const { password, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

// ------------------------
// Start server
// ------------------------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

