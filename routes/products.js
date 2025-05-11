const app = require ('express');

const router = app.Router();

router.get('/products/count', (req, res) => {});
router.get('/products/:id', (req, res) => {});
router.put('/products/:id', (req, res) => {});
router.delete('/products/:id', (req, res) => {});


module.exports = router;