const con = require('./db');
const express = require('express');
const bcrypt = require('bcrypt');
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT id, password FROM users WHERE username = ?";
    con.query(sql, [username], function (err, results) {
        if (err) {
            return res.status(500).send("Database server error");
        }
        if (results.length != 1) {
            return res.status(401).send("Wrong username");
        }
        // compare passwords
        bcrypt.compare(password, results[0].password, function (err, same) {
            if (err) {
                return res.status(500).send("Hashing error");
            }
            if (same) {
                return res.status(200).json(results[0].id);
            }
            return res.status(401).send("Wrong password");
        });
    })
});


// // Registration
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 1) Check if username exists
        const checkQuery = "SELECT 1 FROM users WHERE username = ? LIMIT 1";
        const [results] = await con.promise().query(checkQuery, [username]);
        if (results.length > 0) {
            return res.status(401).send('Username already exists');
        }

        // 2) Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3) Insert new user
        const insertQuery = "INSERT INTO users (username, password) VALUES (?, ?)";
        const [insertResult] = await con.promise().query(insertQuery, [username, hashedPassword]);

        if (insertResult.affectedRows !== 1) {
            return res.status(500).send('Register Error');
        }

        res.status(200).send('Insert done');

    } catch (err) {
        console.error(err);
        res.status(500).send('Database Server Error');
    }
});


//  List expenses
app.get('/expense/:id', (req, res) => {
    const id = req.params.id;
    if (id > 0) {
        con.query(`SELECT * FROM expense WHERE users_id =${id}`, (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(200).json(result);
        })
    }
    if (id == 0) {
        con.query(`SELECT * FROM expense`, (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(200).json(result);
        })
    }
})


// Search expenses by keyword
app.get('/expense/search/:keyword', (req, res) => {
     const keyword = req.params.keyword;
    if (!keyword) return res.status(400).send("Keyword is required");

    const sql = "SELECT * FROM expense WHERE item LIKE ?";
    con.query(sql, [`%${keyword}%`], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(200).json(result);
    });

});


// Add expense
app.post('/add', (req, res) => {
    
});


// Delete an expense by id
app.delete('/delete/:id', (req, res) => {
    
});


// ---------- Server starts here ---------
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at ' + PORT);
});
