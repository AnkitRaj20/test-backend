import express from 'express';
import mysql from 'mysql2';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import fs from 'fs';
// import path from 'path'

// Create express app
const app = express();

// Setup MySQL connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'Ankit@mysql',
//   database: 'taskdb',
// });
const uri = 'mysql://avnadmin:AVNS_mgVP36Jq6ds2fJuLI3U@mysql-3a638694-iamsushmita005-5988.c.aivencloud.com:11221/defaultdb?ssl-mode=REQUIRED';
// const caCertificatePath = `-----BEGIN CERTIFICATE-----
// MIIEQTCCAqmgAwIBAgIUaJm0lz5JdXKHEC++aq+o79t8D/YwDQYJKoZIhvcNAQEM
// BQAwOjE4MDYGA1UEAwwvYjBhZGZlMDgtZjcyYy00NmQ4LWJlYzktYjRlODYzNDg0
// ZDMwIFByb2plY3QgQ0EwHhcNMjUwMTE0MTYxODM2WhcNMzUwMTEyMTYxODM2WjA6
// MTgwNgYDVQQDDC9iMGFkZmUwOC1mNzJjLTQ2ZDgtYmVjOS1iNGU4NjM0ODRkMzAg
// UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBALgjU/wj
// oU4chCHLtYLpzHBt8teHKy+UvmooHIkYhhcuDmgxNz6SQO/Bda/WDz5S62Im3s8w
// awS0QuaRZNeLuo2ChQoJ0eLX7BZB1ahMS6Gm98P0dtpx4/Ji7LLi/EzVqqszn0OT
// UDsTRTwVls4Sb7uXd+y3O1fzT0MmYg+Autxlh8PRKgxRoRAaxxOFfUWW9mOKzKlZ
// 5VjH7HwdUSHhj7cnhfx23l/lS9iXonRNrvniL1HQrc8CRgNnr7a0M3lWzoy62YSE
// 0qX/aao80kJFKpkcTZpzbMX7NJaViFAtCGi0zfnEBGhmLQXqWNGb2riJMJwiEIKo
// opwumphIdFApnCJAT6oEbeeqIZCwTuaIRuE06mPQB3DX0jlM7Z9KXiq/8rDyn8PL
// /NamBgZ8Q1/68C/D+CSZcdqzIN6XtQL/ccbej4WHlwqVO1WT72/oxb3JjS0xT2t+
// PlzIAzBy+pBgKCdxgeQ7TWBEhD1cHz/D2FIvXLugbaWmxp4nWacHIDpRGQIDAQAB
// oz8wPTAdBgNVHQ4EFgQUMUVHzgeVo7CrgwZC8DiYnGWDWMMwDwYDVR0TBAgwBgEB
// /wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBABRMaHt/vNAxff6S
// cn9BqQKv1TaUYQY1focy6ffYTih6NDwyTShoB80j4xoXj2hkrQLtN0wUonfRdk3G
// FS+t3Q5HjiT5+TN7cV4h5BKzhIGbUkIwulJuGIEsBiqfsaR2o10674RlmUdM3084
// E608SnuI1fpUGd0/QZZtRA1MgZzZFypfW0Fq8AdM+mCBzrrLW4YgwWtOg4D6Sm0f
// Kq+p+vFdETmxyPQAbCCnuCXUMkpnkWDz5yuX9EBUFs4gb0fLRCiigGMY6boSQavC
// 7cGZqbACHe/gLqIFLbRnptSsnquEEZkeCx6KYUpQX+nOIkDUw1XUH868Cgk39sn0
// RVHPawJyhipDZjZOizYWXzd5GwLbQ8wDrPEk+wk557+C7099iV2qltFXxHsyluPQ
// A27DugIMq3ck0Dfy1EsRQ4fJ/b3pMTUaBJDlZ8FQZpJhdJ5t6N020jH+ntUOvFDv
// UL7PfAvBTwGPqmrKTM1Z+HOsJnFtnzzaSgYQv0ED0/KuNRej/Q==
// -----END CERTIFICATE-----`; // Update with the actual path to your CA certificate

// Parse the URI manually

// Get the current directory name from the module URL
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const caCertificatePath = './ca (3).pem'

const match = uri.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)\?ssl-mode=REQUIRED/);
const config = {
  host: match[3],
  user: match[1],
  password: match[2],
  database: match[5],
  port: parseInt(match[4]),
  ssl: {
    ca: fs.readFileSync(caCertificatePath),  // CA certificate file
    // ca: caCertificatePath,
    rejectUnauthorized: true  // SSL verification is enabled
  }
};

const db = mysql.createConnection(config);

// Create HTTP server and integrate with Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins or specify allowed origins
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Track connected clients
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// API to fetch all tasks
app.get('/tasks', (req, res) => {
  db.query('SELECT * FROM tasks', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// API to add a new task
app.post('/tasks', (req, res) => {
  const { name, status } = req.body;
  db.query(
    'INSERT INTO tasks (name, status) VALUES (?, ?)',
    [name, status],
    (err, result) => {
      if (err) throw err;
      const newTask = { id: result.insertId, name, status, created_at: new Date(), message: "Task Added Successfully" };
      io.emit('taskAdded', newTask); // Emit new task event
      res.status(201).json(newTask);
    }
  );
});

// API to update a task's status
app.put('/tasks/:id', (req, res) => {
  const { name, status } = req.body;
  db.query(
    'UPDATE tasks SET name = ?, status = ? WHERE id = ?',
    [name, status, req.params.id],
    (err) => {
      if (err) throw err;
      const updatedTask = { id: req.params.id, name, status, message: "Task Updated Successfully" };
      io.emit('taskUpdated', updatedTask); // Emit updated task event
      res.status(200).json(updatedTask);
    }
  );
});

// API to delete a task
app.delete('/tasks/:id', (req, res) => {
  db.query('DELETE FROM tasks WHERE id = ?', [req.params.id], (err) => {
    if (err) throw err;
    let data = {
      id: req.params.id,
      message: "Task Deleted Successfully"
    }
    io.emit('taskDeleted',data); // Emit task deletion event
    res.status(200).send('Task deleted');
  });
});

// Start the server and Socket.IO
server.listen(5000, () => {
  console.log('Server running on port 5000');
});
