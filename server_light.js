const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
const { Parser } = require('json2csv');
const { v4: uuidv4 } = require('uuid'); // Import UUID to generate unique session IDs

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

let sessionCounters = {};

app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    const deviceId = req.body.deviceId; // Assume the device sends its identifier

    if (!sessionCounters[deviceId]) {
        // If this is the first value from the device, initialize a new session
        sessionCounters[deviceId] = {
            sessionId: uuidv4(), // Generate a unique session ID
            counter: 0 // Initialize counter for the session
        };
    }

    const sessionInfo = sessionCounters[deviceId];
    console.log(`Received light value: ${lightValue} for session: ${sessionInfo.sessionId}`);

    // Use the session ID and counter as the document ID
    const docRef = db.collection('lightValues').doc(`${sessionInfo.sessionId}_${sessionInfo.counter}`);
    await docRef.set({ value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    // Increment the counter for the next document within the same session
    sessionInfo.counter += 1;

    res.status(200).send(`Light value received and stored in Firebase with ID: ${sessionInfo.sessionId}_${sessionInfo.counter}`);
});

app.get('/light-values', async (req, res) => {
    // Remaining routes as before...
});

app.get('/', (req, res) => {
    // Remaining routes as before...
});

app.get('/updateLux', async (req, res) => {
    // Remaining routes as before...
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
