import express from "express";
import { validate, loginUser, calculator, auditLog,setStockController,insertTransactionController,getUserTransactionsController,getStocksController,getAllStrategyNamesController } from "../controllers/mainController.js";

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

router.post("/info", getUserTransactionsController);

router.get("/stockList", getStocksController);

router.get('/strategies', getAllStrategyNamesController);



export default router;

