const express = require('express');

const {
    createPackage,
    getPackages,
    updatePackage,
    deletePackage,
    getPackageContents,
    getPackageSummary,
    assignCourseToPackage,
    assignStationaryToPackage
} = require('../controllers/packageControler');

const router = express.Router();

router.post('/', createPackage);
router.get('/', getPackages);

router.put('/assign-course', assignCourseToPackage);
router.put('/assign-stationary', assignStationaryToPackage);

router.get('/:id/contents', getPackageContents);
router.get('/:id/summary', getPackageSummary);

router.put('/:id', updatePackage);
router.delete('/:id', deletePackage);

module.exports = router;