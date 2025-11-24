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

router.post("/:id/proof-of-delivery", authenticate, controller.uploadProofOfDelivery);

module.exports = router;
