import oracledb from 'oracledb';
import dotenv from 'dotenv';
dotenv.config();

const { DB_USER, DB_PASSWORD, DB_CONNECT_STRING } = process.env;

const dbConfig = {
    user: DB_USER,
    password: DB_PASSWORD,
    connectString: DB_CONNECT_STRING,
};

// initialize the connection pool
async function initialize() {
    try {
        await oracledb.createPool({
            user: dbConfig.user,
            password: dbConfig.password,
            connectString: dbConfig.connectString,
            poolMin: 2,
            poolMax: 10,
            poolIncrement: 1,
        });
        console.log('Connection pool started');
    } catch (err) {
        console.error('Error starting connection pool:', err);
        process.exit(1);
    }
}

// get the database connection
async function getConnection() {
    try {
        return await oracledb.getConnection(); // get the connection from the pool
    } catch (err) {
        console.error('Error getting connection from pool:', err);
        throw err;
    }
}

// close the connection pool
async function closePool() {
    try {
        await oracledb.getPool().close(10); // 10s timeout
        console.log('Connection pool closed');
    } catch (err) {
        console.error('Error closing connection pool:', err);
    }
}

export { initialize, getConnection, closePool };