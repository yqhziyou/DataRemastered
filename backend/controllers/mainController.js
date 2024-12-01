import {calculateAndStoreTransaction,setRoleAndGetAuditLogs,setStock,insertTransaction,getUserTransactions,getStocks,getAllStrategyNames }  from "../models/transcationModel.js";
import { register, login } from "../services/userService.js";

const validate = async (req, res) => {
    const { user_id, password } = req.body;

    try {
        const result = await register(user_id, password);

        if (!result.success) {
            // Registration failed, return success: false with the message
            return res.status(400).json({ success: false, error: result.message });
        }

        // Registration successful, return success: true with a message
        res.status(201).json({ success: true, message: result.message });
    } catch (error) {
        // Server error, return success: false with a generic error message
        res.status(500).json({ success: false, error: 'Server error during registration' });
    }
};

const loginUser = async (req, res) => {
    const { user_id, password } = req.body;

    try {
        const result = await login(user_id, password);

        if (!result.success) {
            // login failed, return error message
            return res.status(400).json({ success: false, error: result.message });
        }

        // login successful, return user login information
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        // server error, return generic error message
        return res.status(500).json({
            success: false,
            error: "Server error during login",
        });
    }
};

const calculator = async (req, res) => {
    console.log('Request body:', req.body);
    const {
        strategyType,
        strikePrice,
        premium,
        currentPrice,
    } = req.body;

    try {
        // parameter type conversion
        const parsedData = {
            strategyType: String(strategyType), // convert to string
            strikePrice: parseFloat(strikePrice), // convert to float
            premium: parseFloat(premium), // convert to float
            currentPrice: parseFloat(currentPrice), // convert to float
        };

        // call the main function to process the transaction logic
        const transactions = await calculateAndStoreTransaction(parsedData);

        // success, return user transaction record
        return res.status(200).json({
            success: true,
            message: "Transaction calculated and stored successfully",
            data: transactions,
        });
    } catch (error) {
        // catch the error thrown by the main function and return server error
        console.error("Error in calculator:", error.message);

        return res.status(500).json({
            success: false,
            error: "Server error during transaction processing",
        });
    }
};

const auditLog = async (req, res) => {
    const id = req.query.id;
    console.log("controller layer id:",id);
    try{
        const data = await setRoleAndGetAuditLogs(id);
        return res.status(200).json({
            success: true,
            message: "get audit log successfully",
            data: data,
        })
    } catch (error) {
        // catch the error thrown by the main function and return server error
        console.error("Error in getAuditLog:", error.message);

        return res.status(500).json({
            success: false,
            error: "Server error during getAuditLog processing",
        })
    }
}

const setStockController = async (req, res) => {
    try {
        const { ticker, currentPrice, volatility } = req.body;
        const stockId = await setStock({ ticker, currentPrice, volatility });
        res.status(200).json({
            success: true,
            stockId,
        });
    } catch (error) {
        console.error(`Error in setStockController: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const insertTransactionController = async (req, res) => {
    try {
        const params = req.body;
        const transactionId = await insertTransaction(await params);
        res.status(200).json({
            success: true,
            transactionId,
        });
    } catch (error) {
        console.error(`Error in insertTransactionController: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getUserTransactionsController = async (req, res) => {
    try {
        const { userId } = req.body; 
        console.log(`controller layer id:${userId}`);
        const transactions = await getUserTransactions(userId);
        res.status(200).json({
            success: true,
            data: transactions,
        });
    } catch (error) {
        console.error(`Error in getUserTransactionsController: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getStocksController = async (req, res) => {
    try {
        const stocks = await getStocks();
        res.status(200).json({
            success: true,
            data: stocks,
        });
    } catch (error) {
        console.error(`Error in getStocksController: ${error.message}`);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getAllStrategyNamesController = async (req, res) => {
    try {
        const strategyNames = await getAllStrategyNames(); 
        res.status(200).json({
            success: true,
            data: strategyNames, 
        });
    } catch (error) {
        console.error(`Error in getAllStrategyNamesController: ${error.message}`);
        res.status(500).json({
            success: false,
            message: "Error fetching strategy names",
        });
    }
};

export { validate, loginUser, calculator, auditLog,setStockController,insertTransactionController,getUserTransactionsController,getStocksController,getAllStrategyNamesController };