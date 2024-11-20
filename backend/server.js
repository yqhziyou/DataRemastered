import express from 'express';
import { initialize, closePool } from './config/db.js';
import routes from './routes/router.js'; // import the router file
import cors from 'cors';


const app = express();
const PORT = 9999;
app.use(express.json());
app.use(cors());
// initialize the connection pool when the server starts
(async () => {
    try {
        await initialize(); // initialize the connection pool
        console.log('Database connection pool initialized');
    } catch (err) {
        console.error('Failed to initialize database connection pool:', err);
        process.exit(1); // exit the process if the initialization fails
    }
})();

// use the router
app.use('/api', routes);

// listen to the port
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// catch the service shutdown signal (Ctrl+C or Docker stop)
process.on('SIGTERM', async () => {
    console.log('Service shutting down...');
    try {
        await closePool(); // close the connection pool
        console.log('Database connection pool closed');
        server.close(() => {
            console.log('Server stopped');
            process.exit(0);
        });
    } catch (err) {
        console.error('Error shutting down:', err);
        process.exit(1);
    }
});