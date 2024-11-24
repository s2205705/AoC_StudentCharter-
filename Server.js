const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // For serving static files like CSS, JS, etc.

// Initialize SQLite3 database
const dbFile = 'signed_colleges.db';
const db = new sqlite3.Database(dbFile);

function initDb() {
    db.run(`
        CREATE TABLE IF NOT EXISTS signed_colleges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            college_name TEXT NOT NULL,
            principal_name TEXT NOT NULL,
            evidence_of_principalship TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error initializing database:', err.message);
        } else {
            console.log('Database initialized.');
        }
    });
}

// Route to display the form (Home page)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Serve `index.html` from root directory
});

// Handle form submission
app.post('/', (req, res) => {
    const { college_name, principal_name, evidence_of_principalship } = req.body;

    db.run(`
        INSERT INTO signed_colleges (college_name, principal_name, evidence_of_principalship)
        VALUES (?, ?, ?)
    `, [college_name, principal_name, evidence_of_principalship], (err) => {
        if (err) {
            console.error('Error saving to database:', err.message);
        }
        res.redirect('/');
    });
});

// Route to display only college names
app.get('/signed_colleges', (req, res) => {
    db.all('SELECT college_name FROM signed_colleges', (err, rows) => {
        if (err) {
            console.error('Error fetching colleges:', err.message);
            return res.status(500).send('Database error');
        }
        const colleges = rows.map(row => row.college_name);
        let html = `<h1>Signed Colleges</h1><ul>`;
        colleges.forEach(college => {
            html += `<li>${college}</li>`;
        });
        html += `</ul><a href="/">Back to Home</a>`;
        res.send(html);
    });
});

// Contact page
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html')); // Serve `contact.html` from root directory
});

// Charter page
app.get('/charter', (req, res) => {
    res.sendFile(path.join(__dirname, 'charter.html')); // Serve `charter.html` from root directory
});

// Route to dynamically serve files
app.get('/files/:filename', (req, res) => {
    const filename = req.params.filename;

    // Search for the file in the current directory and subdirectories
    const filePath = findFile(filename, __dirname);
    if (filePath) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

// Helper function to find files
function findFile(filename, directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        const fullPath = path.join(directory, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            const found = findFile(filename, fullPath);
            if (found) return found;
        } else if (file === filename) {
            return fullPath;
        }
    }
    return null;
}

// Start the server and initialize the database
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    initDb();
});
