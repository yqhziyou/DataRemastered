import oracledb from 'oracledb';
import { getConnection } from '../config/db.js'; // import database connection configuration

/**
 * call the stored procedure to calculate the breakeven point
 * @param {Object} connection - database connection object
 * @param {Number} strikePrice - strike price
 * @param {Number} premium - premium
 * @returns {Number} - the calculated breakeven point
 */
const calculateBreakeven = async (connection, strategyType, currentPrice, strikePrice, premium) => {
    try {
        const result = await connection.execute(
            `BEGIN :result := transaction_pkg.calculate_breakeven(:strategy_type, :current_price, :strike_price, :premium); END;`,
            {
                strategy_type: strategyType,
                current_price: currentPrice,
                strike_price: strikePrice,
                premium: premium,
                result: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, // output result
            }
        );
        return result.outBinds.result; // return the calculated breakeven point
    } catch (err) {
        console.error(`Error in calculateBreakeven: ${err.message}`);
        throw err;
    }
};

/**
 * call the stored procedure to calculate the risk rate
 * @param {Object} connection - database connection object
 * @param {Number} currentPrice - current price
 * @param {Number} strikePrice - strike price
 * @param {Number} premium - premium
 * @returns {Number} - the calculated risk rate
 */
const calculateRiskRate = async (connection, strategyType, currentPrice, strikePrice, premium) => {
    try {
        const result = await connection.execute(
            `BEGIN :result := transaction_pkg.calculate_risk_rate(:strategy_type, :current_price, :strike_price, :premium); END;`,
            {
                strategy_type: strategyType,
                current_price: currentPrice,
                strike_price: strikePrice,
                premium: premium,
                result: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, // output result
            }
        );
        return result.outBinds.result; // return the calculated risk rate
    } catch (err) {
        console.error(`Error in calculateRiskRate: ${err.message}`);
        throw err;
    }
};

/**
 * use the stored procedure to insert the transaction record
 * @param {Object} connection - database connection object
 * @param {Object} params - the parameters containing the transaction information
 */
const insertTransaction = async (connection, params) => {
   
    const requiredFields = [
        'userId',
        'stockId',
        'strategyType',
        'strikePrice',
        'premium',
        'maturityTime',
        'stockQuantity'
    ];

    for (const field of requiredFields) {
        if (params[field] == null) { 
            throw new Error(`Missing or null value for required field: ${field}`);
        }
    }

    try {
        const result = await connection.execute(
            `BEGIN transaction_pkg.insert_transaction(
            :user_id, :stock_id, :strategy_type, :strike_price,
            :premium, :maturity_time, :stock_quantity, :transaction_id
        ); END;`,
            {
                user_id: params.userId,
                stock_id: params.stockId,
                strategy_type: params.strategyType,
                strike_price: params.strikePrice,
                premium: params.premium,
                maturity_time: params.maturityTime,
                stock_quantity: params.stockQuantity,
                transaction_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, // get the return value
            },
            { autoCommit: true }
        );

        console.log('Transaction record inserted successfully, Transaction ID:', result.outBinds.transaction_id);
        return result.outBinds.transaction_id; // return transaction_id
    } catch (err) {
        console.error(`Error in insertTransaction: ${err.message}`);
        throw err;
    }
};



/**
 * query information
 * @param {Object} connection - database connection object
 * @param {Number} userId - user ID
 */
const getUserTransactions = async (connection, userId) => {
    try {
        const result = await connection.execute(
            `BEGIN transaction_pkg.get_user_transactions(:user_id, :result); END;`,
            {
                user_id: userId,
                result: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
            }
        );

        const resultSet = result.outBinds.result;
        const rows = [];
        let row;

        while ((row = await resultSet.getRow())) {
            rows.push(row); // push each row into the array
        }
        await resultSet.close(); // close the cursor
        console.log('User transaction records queried successfully');
        return rows; // return the array of records
    } catch (err) {
        console.error(`Error in getUserTransactions: ${err.message}`);
        throw err;
    }
};


/**
 * calculate and store the transaction information
 * @param {Object} params - the parameters containing the transaction information
 */
const calculateAndStoreTransaction = async (params) => {
    let connection;
    try {
        connection = await getConnection();
        
        const breakeven = await calculateBreakeven(
            connection,
            params.strategyType,
            params.currentPrice,
            params.strikePrice,
            params.premium
        );
        console.log('Breakeven point:', breakeven);

        // call the stored procedure to calculate the risk rate
        const riskRate = await calculateRiskRate(
            connection,
            params.strategyType,
            params.currentPrice,
            params.strikePrice,
            params.premium
        );
        console.log('Risk rate:', riskRate);

        // use the stored procedure to insert the transaction record
        const transactionId = await insertTransaction(connection, {
            userId: params.userId,
            stockId: params.stockId,
            strategyType: params.strategyType,
            strikePrice: params.strikePrice,
            premium: params.premium,
            maturityTime: params.maturityTime,
            stockQuantity: params.stockQuantity,
        });
        console.log('New transaction ID:', transactionId);

        // query and return the user transaction records
        const userTransactions = await getUserTransactions(connection, params.userId);
        console.log('Query user transaction records:', userTransactions);

        return { breakeven, riskRate, transactionId, userTransactions }; // return the comprehensive result
    } catch (err) {
        console.error(`Error in calculateAndStoreTransaction: ${err.message}`);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error(`Error closing connection: ${closeErr.message}`);
            }
        }
    }
};

/**
 * Set the role for the current user and fetch audit logs
 * @param {Number} userId - The user ID to set the role and fetch logs for
 * @returns {Array} - The fetched audit logs
 */
const setRoleAndGetAuditLogs = async (userId) => {
    let connection;
    try {
        connection = await getConnection();

        userId = Number(userId);
        // Step 1: Fetch the user's role and set it in the global context
        const userRoleResult = await connection.execute(
            `SELECT role FROM users WHERE user_id = :user_id`,
            { user_id: userId }
        );

        if (!userRoleResult.rows || userRoleResult.rows.length === 0) {
            throw new Error(`No user found with ID: ${userId}`);
        }

        const userRole = userRoleResult.rows[0][0]; // Assuming the role is in the first column
        console.log(`User role for user ID ${userId}: ${userRole}`);

        // Step 2: Set the role in the database package (simulating a global variable in PL/SQL)
        await connection.execute(
            `BEGIN transaction_pkg.set_current_user_role(:user_id); END;`,
            { user_id: userId }
        );
        console.log(`Role set in transaction_pkg for user ID ${userId}`);

        // Step 3: Fetch audit logs using the user's role
        const auditLogsResult = await connection.execute(
            `BEGIN transaction_pkg.get_all_audit_logs(:result); END;`,
            {
                result: { dir: oracledb.BIND_OUT, type: oracledb.CURSOR },
            }
        );

        const resultSet = auditLogsResult.outBinds.result;
        const auditLogs = [];
        let row;

        while ((row = await resultSet.getRow())) {
            auditLogs.push(row); // Push each row into the array
        }
        await resultSet.close(); // Close the cursor
        console.log('Audit logs fetched successfully');

        return auditLogs; // Return the array of audit logs
    } catch (err) {
        console.error(`Error in setRoleAndGetAuditLogs: ${err.message}`);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (closeErr) {
                console.error(`Error closing connection: ${closeErr.message}`);
            }
        }
    }
};



export {calculateAndStoreTransaction,setRoleAndGetAuditLogs };
