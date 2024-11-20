import bcrypt from 'bcrypt';
import oracledb from 'oracledb';
import { getConnection } from '../config/db.js'; // Oracle DB connection module

// register user and encrypt password
const register = async (user_id, password) => {
    try {
        const connection = await getConnection(); // get the database connection

        // check if the user ID already exists
        const checkUserQuery = `SELECT COUNT(*) AS count FROM USERS WHERE USER_ID = :user_id`;
        const result = await connection.execute(checkUserQuery, { user_id });
        const userExists = result.rows[0].COUNT > 0;

        if (userExists) {
            return { success: false, message: 'User ID already exists.' };
        }

        // encrypt the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // insert the new user into the database
        const insertUserQuery = `
            INSERT INTO USERS (USER_ID, PASSWORD) 
            VALUES (:user_id, :password)
        `;
        await connection.execute(insertUserQuery, { user_id, password: hashedPassword }, { autoCommit: true });

        return { success: true, message: 'User registered successfully.' };
    } catch (error) {
        console.error('Error during registration:', error.message);
        return { success: false, message: 'Error during registration.', error: error.message };
    }
};

// user login and verify password
const login = async (user_id, password) => {
    try {
        const connection = await getConnection(); // get the database connection

        // query the user ID and encrypted password
        const getUserQuery = `SELECT password FROM USERS WHERE USER_ID = :user_id`;
        const result = await connection.execute(getUserQuery, { user_id });

        console.log("Query result:", result.rows[0]); // print the full result

        if (result.rows.length === 0) {
            return { success: false, message: 'User ID not found.' };
        }

        // access the first item in the query result
        const hashedPassword = result.rows[0][0]; // access the first element of the array
        console.log("Hashed password from DB:", hashedPassword);

        // verify the password
        const passwordMatch = await bcrypt.compare(password, hashedPassword);
        if (!passwordMatch) {
            return { success: false, message: 'Invalid password.' };
        }

        return { success: true, message: 'Login successful.' };
    } catch (error) {
        console.error('Error during login:', error.message);
        return { success: false, message: 'Error during login.', error: error.message };
    }
};




export { register, login };
