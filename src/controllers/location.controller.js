const admin = require("../config/firebase");
const db = admin.firestore();

// GET ALL LOCATIONS (from nested structure)
exports.getAllLocations = async (req, res) => {
  try {
    const driversSnapshot = await db.collection("driverLocations").get();
    
    const locationPromises = driversSnapshot.docs.map(async (driverDoc) => {
      const userId = driverDoc.id;
      
      // Get the most recent location log for this driver
      const logsSnapshot = await db
        .collection("driverLocations")
        .doc(userId)
        .collection("logs")
        .orderBy("timestamp", "desc")
        .limit(1)
        .get();
      
      if (logsSnapshot.empty) return null;
      
      const latestLog = logsSnapshot.docs[0].data();
      
      return {
        userId: userId,
        latitude: latestLog.latitude,
        longitude: latestLog.longitude,
        timestamp: latestLog.timestamp,
        speed: latestLog.speed || 0
      };
    });
    
    const locations = await Promise.all(locationPromises);
    const validLocations = locations.filter(loc => loc !== null);
    
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
      .limit(1)
      .get();

    if (logsSnapshot.empty)
      return res.status(404).json({ message: "Location not found" });

    const latestLog = logsSnapshot.docs[0].data();

    return res.json({
      userId: driverId,
      latitude: latestLog.latitude,
      longitude: latestLog.longitude,
      timestamp: latestLog.timestamp,
      speed: latestLog.speed || 0
    });

  } catch (err) {
    console.error("Error fetching location:", err);
    return res.status(500).json({ message: "Server error" });
  }
};