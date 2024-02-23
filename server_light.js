const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const admin = require('firebase-admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// Initialize Firebase Admin with your service account
const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// WebSocket connection handler
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// POST route to receive and store light values, then emit to all WebSocket clients
app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);

    const counterRef = db.collection('counters').doc('lightValues');
    const counterDoc = await counterRef.get();

    let counter = 0;
    if (counterDoc.exists) {
        counter = counterDoc.data().count;
    }

    const docRef = db.collection('lightValues').doc(`${counter}`);
    await docRef.set({ value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    await counterRef.set({ count: counter + 1 });

    // Emit the new light value to all connected WebSocket clients
    io.emit('light-value-update', { id: `${counter}`, value: lightValue });

    res.status(200).send(`Light value received and stored in Firebase with ID: ${counter}`);
});

// GET route to display stored light values
app.get('/light-values', async (req, res) => {
    const lightValues = [];
    const snapshot = await db.collection('lightValues').orderBy(admin.firestore.FieldPath.documentId()).get();
    snapshot.forEach(doc => {
        lightValues.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(lightValues);
});

// Root route
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Route to update Lux value
app.get('/updateLux', async (req, res) => {
    const lux = req.query.lux;
    console.log(`Received Lux value: ${lux}`);

    const docRef = db.collection('luxValues').doc();
    await docRef.set({ value: lux, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Lux value received and stored in Firebase');
});

// Start the server and WebSocket server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
