import oracledb from 'oracledb';
import { getConnection } from '../config/db.js'; // import database connection configuration

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


const setStock = async ({ ticker, currentPrice, volatility }) => {
    let connection;
    try {
        connection = await getConnection();

        const result = await connection.execute(
            `BEGIN upsert_stock(:p_ticker, :p_current_price, :p_volatility, :p_stock_id); END;`,
            {
                p_ticker: ticker,
                p_current_price: currentPrice,
                p_volatility: volatility,
                p_stock_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }, // Output parameter
            },
            { autoCommit: true } // Commit after execution
        );

        console.log('Stock upsert successful, Stock ID:', result.outBinds.p_stock_id);
        return result.outBinds.p_stock_id; // Return the stock ID
    } catch (err) {
        console.error(`Error in setStock: ${err.message}`);
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


const insertTransaction = async (params) => {
    let connection;
    try {
        connection = await getConnection();
        
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
        
        const result = await connection.execute(
            `BEGIN 
                transaction_pkg.insert_transaction(
                    :user_id, :stock_id, :strategy_type, :strike_price,
                    :premium, :maturity_time, :stock_quantity, :transaction_id
                ); 
            END;`,
            {
                user_id: params.userId,
                stock_id: params.stockId,
                strategy_type: params.strategyType,
                strike_price: params.strikePrice,
                premium: params.premium,
                maturity_time: params.maturityTime,
                stock_quantity: params.stockQuantity,
                transaction_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } 
            },
            { autoCommit: true }
        );

        console.log('Transaction record inserted successfully, Transaction ID:', result.outBinds.transaction_id);
        return result.outBinds.transaction_id; 

    } catch (err) {
        console.error(`Error in insertTransaction: ${err.message}`);
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


const getUserTransactions = async (userId) => {
    let connection;
    try {
        connection = await getConnection();

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
            rows.push(row); // Push each row into the array
        }
        await resultSet.close(); // Close the cursor
        console.log('User transaction records queried successfully');
        return rows; // Return the array of records
    } catch (err) {
        console.error(`Error in getUserTransactions: ${err.message}`);
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

const getStocks = async () => {
    let connection;
    try {
        connection = await getConnection();
        
        const result = await connection.execute(
            `SELECT * FROM stocks`
        );
        
        const rows = result.rows;

        console.log('Stocks fetched successfully:', rows);
        return rows; 
    } catch (err) {
        console.error(`Error in getStocks: ${err.message}`);
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
        

        return { breakeven, riskRate }; // return the comprehensive result
    } catch (err) {
        console.error(`Error in calculator: ${err.message}`);
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

const getAllStrategyNames = async () => {
    let connection;
    try {
        connection = await getConnection(); 

        const result = await connection.execute(
            `SELECT strategy_name FROM strategies`
        );

        const strategyNames = result.rows.map(row => row[0]); 
        console.log('Strategy names fetched successfully:', strategyNames);
        return strategyNames; 
    } catch (err) {
        console.error(`Error in getAllStrategyNames: ${err.message}`);
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





export {calculateAndStoreTransaction,setRoleAndGetAuditLogs,setStock,insertTransaction,getUserTransactions,getStocks,getAllStrategyNames };
