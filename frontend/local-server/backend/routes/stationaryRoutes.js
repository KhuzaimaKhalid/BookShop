const express = require('express');
const router = express.Router();
const {
    createStationary,
    getStationaryList,
    addOrUpdateStationaryProduct,
    getProductsByStationary,
    customizeStationaryForCheckout,
    getNumberOfProductsInStationary
} = require('../controllers/stationaryController');

router.post('/create', createStationary);
router.get('/all', getStationaryList);
router.get('/products-count/:id', getNumberOfProductsInStationary);
router.post('/update-product', addOrUpdateStationaryProduct);
router.get('/products/:stationary_id', getProductsByStationary);
router.post('/checkout-preview', customizeStationaryForCheckout);

module.exports = router;