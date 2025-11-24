const admin = require("../config/firebase"); 
const db = admin.firestore();
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/encrypt"); // your helper

// POST /auth/login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ message: "Username & password required" });

    // Query user by username (because docId is userId)
    const userRef = db.collection("users").where("username", "==", username);
    const snap = await userRef.get();

    if (snap.empty)
      return res.status(404).json({ message: "User not found" });

    const userDoc = snap.docs[0];
    const user = userDoc.data();
    const userId = userDoc.id;

    // Compare password using your helper
    const match = await comparePassword(password, user.passwordHash);

    if (!match)
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.role !== "admin" && user.role !== "superadmin" ) {
      return res.status(403).json({ message: "Access denied: Admin only" });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: userId,
        username: user.username,
        role: user.role,
        fullname: user.fullname,
        phone: user.phone,
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// POST /auth/create
exports.createAdmin = async (req, res) => {
  try {
    const { role } = req.user; // decoded JWT from middleware
    if (role !== "superadmin")
      return res.status(403).json({ message: "Only admins can create accounts" });

    const { username, password, fullname, phone } = req.body;

    if (!username || !password || !fullname || !phone)
      return res.status(400).json({ message: "All fields required" });

    // Check if username already used
    const exist = await db
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!exist.empty)
      return res.status(400).json({ message: "Username already exists" });

    // Hash password
    const passwordHash = await hashPassword(password);

    const userRef = db.collection("users").doc(); // autoId
    const payload = {
      username,
      passwordHash,
      role: "admin",    // "driver" or "admin"
      fullname,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(payload);

    return res.status(201).json({
      message: "User created",
      userId: userRef.id
    });

  } catch (err) {
    console.error("Create account error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET /auth/me
exports.me = async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT middleware

    const snap = await db.collection("users").doc(userId).get();
    if (!snap.exists)
      return res.status(404).json({ message: "User not found" });

    const user = snap.data();

    return res.json({
      id: userId,
      username: user.username,
      fullname: user.fullname,
      phone: user.phone,
      role: user.role
    });

  } catch (err) {
    console.error("ME error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
