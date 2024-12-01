import express from "express";
import { validate, loginUser, calculator, auditLog,setStockController,insertTransactionController,getUserTransactionsController,getStocksController } from "../controllers/mainController.js";

const router = express.Router();

// User registration endpoint
router.post("/register", validate);

// User login endpoint
router.post("/login", loginUser);

// Transaction calculator endpoint
router.post("/calculate", calculator);

router.get("/audit", auditLog);

router.post("/stock", setStockController);

router.post("/insert", insertTransactionController);

router.get("/info", getUserTransactionsController);

router.get("/stockList", getStocksController);

export default router;

