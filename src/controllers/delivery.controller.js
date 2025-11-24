const admin = require("../config/firebase");
const db = admin.firestore();
const fs = require('fs');
const path = require('path');

// CREATE DELIVERY
exports.createDelivery = async (req, res) => {
  try {
    const { title, description, destination, items } = req.body;

    if (!title || !destination || !items)
      return res.status(400).json({ message: "Missing required fields" });

    const docRef = db.collection("deliveries").doc();

    const payload = {
      title,
      description: description || "",
      destination,
      items,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      assignedDriverId: null,
      driverName: null,
      status: "pending",
      completedAt: null,
      approvedAt: null,
      approvedBy: null,
    };

    await docRef.set(payload);

    res.status(201).json({ message: "Delivery created", id: docRef.id });

  } catch (err) {
    console.error("Create delivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET ALL DELIVERIES
exports.getDeliveries = async (req, res) => {
  try {
    const snap = await db.collection("deliveries").orderBy("createdAt", "desc").get();

    const list = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(list);

  } catch (err) {
    console.error("Get deliveries error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET DELIVERY BY ID
exports.getDeliveryById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("deliveries").doc(id).get();

    if (!doc.exists)
      return res.status(404).json({ message: "Delivery not found" });

    res.json({ id: doc.id, ...doc.data() });

  } catch (err) {
    console.error("Get delivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// UPDATE DELIVERY
exports.updateDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await db.collection("deliveries").doc(id).update(updates);

    res.json({ message: "Delivery updated" });

  } catch (err) {
    console.error("Update delivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ASSIGN DRIVER
exports.assignDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body;

    const driverDoc = await db.collection("users").doc(driverId).get();
    if (!driverDoc.exists || driverDoc.data().role !== "driver")
      return res.status(400).json({ message: "Invalid driver ID" });

    await db.collection("deliveries").doc(id).update({
      assignedDriverId: driverId,
      driverName: driverDoc.data().fullname || null,
      status: "assigned",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Driver assigned" });

  } catch (err) {
    console.error("Assign driver error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// MARK DELIVERY COMPLETE (driver)
exports.markCompleted = async (req, res) => {
  try {
    const { id } = req.params;

    // Only the assigned driver can complete
    const doc = await db.collection("deliveries").doc(id).get();
    const data = doc.data();

    if (!data) return res.status(404).json({ message: "Delivery not found" });

    if (data.assignedDriverId !== req.user.userId)
      return res.status(403).json({ message: "Not your delivery" });

    await db.collection("deliveries").doc(id).update({
      status: "completed",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Delivery marked completed" });

  } catch (err) {
    console.error("Complete delivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// APPROVE DELIVERY (admin)
exports.approveDelivery = async (req, res) => {
  try {
    const { id } = req.params;

    await db.collection("deliveries").doc(id).update({
      status: "approved",
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedBy: req.user.userId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: "Delivery approved" });

  } catch (err) {
    console.error("Approve delivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE DELIVERY
exports.deleteDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("deliveries").doc(id).delete();
    res.json({ message: "Delivery deleted" });
  } catch (err) {
    console.error("Delete delivery error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Upload Proof of Delivery images
 * POST /api/deliveries/:deliveryId/proof-of-delivery
 * Body: { packageImages: [], locationImage: "", signature: "" }
 */
exports.uploadProofOfDelivery = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { packageImages, locationImage, signature } = req.body;

    // Validate required fields
    if (!packageImages || !Array.isArray(packageImages) || packageImages.length === 0) {
      return res.status(400).json({ message: 'At least one package image is required' });
    }

    if (!locationImage) {
      return res.status(400).json({ message: 'Location image is required' });
    }

    if (!signature) {
      return res.status(400).json({ message: 'Signature is required' });
    }

    // Verify delivery exists
    const deliveryRef = db.collection('deliveries').doc(deliveryId);
    const deliveryDoc = await deliveryRef.get();

    if (!deliveryDoc.exists) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    // Create directory for this delivery
    const deliveryDir = path.join(uploadsDir, deliveryId);
    if (!fs.existsSync(deliveryDir)) {
      fs.mkdirSync(deliveryDir, { recursive: true });
    }

    // Process and save package images
    const packageImageUrls = [];
    for (let i = 0; i < packageImages.length; i++) {
      const base64Data = packageImages[i];
      const filename = `${deliveryId}_${i + 1}.jpg`;
      const filepath = path.join(deliveryDir, filename);
      
      // Save base64 image to file
      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '');
      fs.writeFileSync(filepath, base64Image, 'base64');
      
      // Generate URL (adjust based on your server URL)
      const imageUrl = `/uploads/deliveries/${deliveryId}/${filename}`;
      packageImageUrls.push(imageUrl);
    }

    // Process and save location image
    const locationFilename = `${deliveryId}_sign.jpg`;
    const locationFilepath = path.join(deliveryDir, locationFilename);
    const locationBase64 = locationImage.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(locationFilepath, locationBase64, 'base64');
    const locationImageUrl = `/uploads/deliveries/${deliveryId}/${locationFilename}`;

    // Process and save signature
    const signatureFilename = `${deliveryId}_DO.jpg`;
    const signatureFilepath = path.join(deliveryDir, signatureFilename);
    const signatureBase64 = signature.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(signatureFilepath, signatureBase64, 'base64');
    const signatureUrl = `/uploads/deliveries/${deliveryId}/${signatureFilename}`;

    // Return URLs to mobile app
    return res.status(200).json({
      message: 'Proof of delivery uploaded successfully',
      packageImages: packageImageUrls,
      locationImage: locationImageUrl,
      signature: signatureUrl,
    });

  } catch (err) {
    console.error('Upload proof of delivery error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
};