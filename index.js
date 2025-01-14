/* eslint-disable no-undef */
import express from 'express';
import mysql from 'mysql2';
import { Server } from 'socket.io';
import http from 'http';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv'

dotenv.config()

// Create express app
const app = express();


const uri = process.env.MYSQL_URI
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
