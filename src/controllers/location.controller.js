const admin = require("../config/firebase");
const db = admin.firestore();

// GET ALL LOCATIONS (from nested structure)
exports.getAllLocations = async (req, res) => {
  try {
    // 1. Get all driver IDs from users collection
    const usersSnapshot = await db.collection("users").get();
    const driverIds = usersSnapshot.docs.map(doc => doc.id);

    const locationPromises = driverIds.map(async (driverId) => {
      // 2. Query the driver's logs
      const logsSnapshot = await db
        .collection("driverLocations")
        .doc(driverId)
        .collection("logs")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();

      if (logsSnapshot.empty) return null; // skip drivers with no logs

      const latestLog = logsSnapshot.docs[0].data();

      return {
        userId: driverId,
        latitude: latestLog.latitude,
        longitude: latestLog.longitude,
        timestamp: latestLog.timestamp,
        speed: latestLog.speed || 0
      };
    });

    const locations = await Promise.all(locationPromises);
    const validLocations = locations.filter(loc => loc !== null);

    console.log(validLocations);

    return res.json(validLocations);

  } catch (err) {
    console.error("Error fetching locations:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


// GET LOCATION BY DRIVER ID (from nested structure)
exports.getLocationByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;

    const logsSnapshot = await db
      .collection("driverLocations")
      .doc(driverId)
      .collection("logs")
      .orderBy("timestamp", "desc")
      .get();

    if (logsSnapshot.empty)
      return res.status(404).json({ message: "No location logs found" });

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      latitude: doc.data().latitude,
      longitude: doc.data().longitude,
      timestamp: doc.data().timestamp,
      speed: doc.data().speed || 0
    }));

    return res.json({
      userId: driverId,
      logs
    });

  } catch (err) {
    console.error("Error fetching locations:", err);
    return res.status(500).json({ message: "Server error" });
  }
};