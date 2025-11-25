const express = require("express");
const router = express.Router();

const { authenticate, requireRole } = require("../middlewares/auth");
const controller = require("../controllers/delivery.controller");

router.post("/", authenticate, requireRole('admin'), controller.createDelivery);
router.get("/", authenticate, requireRole('admin'), controller.getDeliveries);
router.get("/:id", authenticate, controller.getDeliveryById);
router.put("/:id", authenticate, requireRole('admin'), controller.updateDelivery);

router.patch("/:id/assign", authenticate, requireRole('admin'), controller.assignDriver);

router.post("/:id/complete", authenticate, controller.markCompleted);

router.post("/:id/approve", authenticate, requireRole('admin'), controller.approveDelivery);

router.delete("/:id", authenticate, requireRole('admin'), controller.deleteDelivery);

router.post("/:deliveryId/proof-of-delivery", authenticate, controller.uploadProofOfDelivery);

router.get('/:id/proof-of-delivery', async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryRef = db.collection('deliveries').doc(id);
    const deliveryDoc = await deliveryRef.get();

    if (!deliveryDoc.exists) {
      return res.status(404).json({ message: 'Delivery not found' });
    }

    const deliveryData = deliveryDoc.data();

    // Optional: generate public URLs from Supabase for each stored file
    const generatePublicUrl = (path) => {
      if (!path) return null;
      return supabase.storage.from('driver-images').getPublicUrl(path).data.publicUrl;
    };

    const proof = deliveryData.proofOfDelivery || {};
    const proofWithUrls = {
      packageImages: (proof.packageImages || []).map(generatePublicUrl),
      locationImage: generatePublicUrl(proof.locationImage),
      signature: generatePublicUrl(proof.signature),
      timestamp: proof.timestamp || null,
    };

    res.json({
      ...deliveryData,
      proofOfDelivery: proofWithUrls,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
