const express = require('express');
const serviceController = require('../controllers/serviceController');
const { validate } = require('../middleware/validationMiddleware');
const serviceValidation = require('../validation/serviceValidation');
const router = express.Router();

router.route('/').get(serviceController.getAllServices).post( validate(serviceValidation.createServiceSchema),serviceController.createService);
module.exports = router;
