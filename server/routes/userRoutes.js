const router = require("express").Router();
const {
  registerController,
  loginController,
} = require("../controllers/userController");

// USER ROUTES
router.post("/", registerController);
router.post("/login", loginController);

module.exports = router;
