import calculateAndStoreTransaction  from "../models/transcationModel.js";
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
        userId,
        stockId,
        strategyType,
        strikePrice,
        premium,
        maturityTime,
        stockQuantity,
        currentPrice,
    } = req.body;

    try {
        // parameter type conversion
        const parsedData = {
            userId: parseInt(userId, 10), // convert to integer
            stockId: parseInt(stockId, 10), // convert to integer
            strategyType: String(strategyType), // convert to string
            strikePrice: parseFloat(strikePrice), // convert to float
            premium: parseFloat(premium), // convert to float
            maturityTime: parseInt(maturityTime, 10), // convert to integer
            stockQuantity: parseInt(stockQuantity, 10), // convert to integer
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

export { validate, loginUser, calculator };