const express = require('express');
const router = express.Router();

const {createCourse,getCourses,addOrUpdateCourseProduct,getProductsByCourse,customizeCourseForCheckout,getNumberOfProductsInCourse} = require('../controllers/courseController');

router.post('/', createCourse);
router.get('/', getCourses);
router.get('/:course_id/products', getProductsByCourse);
router.put('/products', addOrUpdateCourseProduct);
router.post('/customize-checkout', customizeCourseForCheckout);
router.get('/getNumberOfProductsInCourse/:id', getNumberOfProductsInCourse);


module.exports = router;