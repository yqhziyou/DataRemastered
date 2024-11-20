import express from "express";
import { validate, loginUser, calculator } from "../controllers/mainController.js";

const router = express.Router();

// User registration endpoint
router.post("/register", validate);

// User login endpoint
router.post("/login", loginUser);

// Transaction calculator endpoint
router.post("/calculate", calculator);

export default router;
