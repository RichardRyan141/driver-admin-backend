const admin = require("../config/firebase");
const db = admin.firestore();
const { hashPassword } = require("../utils/encrypt");

// CREATE DRIVER
exports.createDriver = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({ message: "Only admins can create drivers" });

    const { username, password, fullname, phone } = req.body;

    if (!username || !password || !fullname || !phone)
      return res.status(400).json({ message: "All fields required" });

    // Check username exists
    const exists = await db
      .collection("users")
      .where("username", "==", username)
      .get();

    if (!exists.empty)
      return res.status(400).json({ message: "Username already exists" });

    const passwordHash = await hashPassword(password);
    const docRef = db.collection("users").doc();

    const payload = {
      username,
      passwordHash,
      role: "driver",
      fullname,
      phone,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await docRef.set(payload);

    return res.status(201).json({
      message: "Driver account created",
      driverId: docRef.id
    });

  } catch (err) {
    console.error("Create driver error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// GET ALL DRIVERS
exports.getDrivers = async (req, res) => {
  try {
    const snapshot = await db
      .collection("users")
      .where("role", "==", "driver")
      .get();

    const drivers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      passwordHash: undefined, // hide sensitive
    }));

    res.status(200).json(drivers);

  } catch (err) {
    console.error("Get drivers error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET DRIVER BY ID
exports.getDriverById = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({ message: "Only admins can view drivers" });

    const { id } = req.params;

    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists)
      return res.status(404).json({ message: "Driver not found" });

    const data = doc.data();
    if (data.role !== "driver")
      return res.status(400).json({ message: "This user is not a driver" });

    res.status(200).json({
      id: doc.id,
      ...data,
      passwordHash: undefined,
    });

  } catch (err) {
    console.error("Get driver by ID error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE DRIVER
exports.updateDriver = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({ message: "Only admins can update drivers" });

    const { id } = req.params;
    const { fullname, phone, password } = req.body;

    const docRef = db.collection("users").doc(id);
    const doc = await docRef.get();

    if (!doc.exists)
      return res.status(404).json({ message: "Driver not found" });

    if (doc.data().role !== "driver")
      return res.status(400).json({ message: "This user is not a driver" });

    const updates = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (fullname) updates.fullname = fullname;
    if (phone) updates.phone = phone;
    if (password) updates.passwordHash = await hashPassword(password);

    await docRef.update(updates);

    res.status(200).json({ message: "Driver updated" });

  } catch (err) {
    console.error("Update driver error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE DRIVER
exports.deleteDriver = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.role !== "superadmin")
      return res.status(403).json({ message: "Only admins can delete drivers" });

    const { id } = req.params;

    const doc = await db.collection("users").doc(id).get();
    if (!doc.exists)
      return res.status(404).json({ message: "Driver not found" });

    if (doc.data().role !== "driver")
      return res.status(400).json({ message: "This user is not a driver" });

    await db.collection("users").doc(id).delete();

    res.status(200).json({ message: "Driver deleted" });

  } catch (err) {
    console.error("Delete driver error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
