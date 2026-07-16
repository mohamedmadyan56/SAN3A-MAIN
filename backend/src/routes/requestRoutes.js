const express = require("express");
const requestController = require("../controllers/requestController");
const authController = require("../controllers/authController");
const { validate } = require('../middleware/validationMiddleware');
const requestValidation = require('../validation/requestValidation');
const router = express.Router();

// أي Route بعد السطر ده لازم المستخدم يكون عامل Login
router.use(authController.protect);
router.get('/:requestId/nearby-craftsmen', requestController.findNearbyCraftsmen);
router.get('/:requestId/match-results', requestController.getMatchResults);
router.post("/",  validate(requestValidation.createRequestSchema),requestController.createRequest);
router.get("/:id", requestController.getRequest);
router.patch('/:requestId/status', requestController.updateRequestStatus);
router.patch('/:requestId/complete', requestController.completeRequest);
router.post('/:requestId/confirm-booking', validate(requestValidation.confirmBookingSchema),requestController.confirmBooking);
router.post('/:requestId/accept', requestController.acceptRequest);
router.post('/:requestId/reject', requestController.rejectRequest);
module.exports = router;
