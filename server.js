const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// ⚠️ PASTE YOUR LIVE FRONTEND RENDER URL HERE (No trailing slash!):
const FRONTEND_URL = 'https://REPLACE-THIS-WITH-YOUR-FRONTEND-URL.onrender.com';

// Middleware (The VIP List for your Frontend)
app.use(cors({
    origin: FRONTEND_URL,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// MySQL Connection Pool using your credentials
const pool = mysql.createPool({
    host: 'sql12.freesqldatabase.com',
    user: 'sql12824242',
    password: process.env.DB_PASSWORD, // 🔒 HIDDEN PASSWORD VARIABLE!
    database: 'sql12824242',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Initialize Database Table
async function initDB() {
    try {
        const connection = await pool.getConnection();
        // Create a table to act as our JSON document store
        await connection.query(`
            CREATE TABLE IF NOT EXISTS app_state (
                id INT PRIMARY KEY,
                state_data LONGTEXT
            )
        `);
        connection.release();
        console.log("✅ MySQL Database connected and table initialized.");
    } catch (err) {
        console.error("❌ Database Initialization Error:", err);
    }
}
initDB();

// GET: Fetch the current game state
app.get('/api/state', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT state_data FROM app_state WHERE id = 1');
        if (rows.length > 0) {
            res.json(JSON.parse(rows[0].state_data));
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error("GET Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// POST: Update the game state
app.post('/api/state', async (req, res) => {
    try {
        const newState = JSON.stringify(req.body);
        
        const [rows] = await pool.query('SELECT id FROM app_state WHERE id = 1');
        if (rows.length > 0) {
            await pool.query('UPDATE app_state SET state_data = ? WHERE id = 1', [newState]);
        } else {
            await pool.query('INSERT INTO app_state (id, state_data) VALUES (1, ?)', [newState]);
        }
        res.json({ success: true });
    } catch (err) {
        console.error("POST Error:", err);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Waiting for frontend connections from ${FRONTEND_URL}...`);
});
