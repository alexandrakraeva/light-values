﻿
const express = require('express'); // framework to create web server
const admin = require('firebase-admin'); //firebase servises - database

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Array to store the light values
let lightValues = [];

app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);

    // Reference to the counter document
    const counterRef = db.collection('counters').doc('lightValues');
    const counterDoc = await counterRef.get();

    let counter = 0;
    if (counterDoc.exists) {
        counter = counterDoc.data().count;
    }

    // Use the counter as the document ID
    const docRef = db.collection('lightValues').doc(`${counter}`);
    await docRef.set({ value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    // Increment the counter for the next document
    await counterRef.set({ count: counter + 1 });

    res.status(200).send(`Light value received and stored in Firebase with ID: ${counter}`);
});



// GET route to display the stored light values
app.get('/light-values', async (req, res) => {
    const lightValues = [];
    const snapshot = await db.collection('lightValues').orderBy(admin.firestore.FieldPath.documentId()).get();
    snapshot.forEach(doc => {
        lightValues.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(lightValues);
});



// Route to handle GET requests to the root URL path
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Route to handle GET requests to update the Lux value
app.get('/updateLux', async (req, res) => {
    const lux = req.query.lux;
    console.log(`Received Lux value: ${lux}`);

    // Store the received Lux value in Firestore
    const docRef = db.collection('luxValues').doc(); // You can choose to store in the same or a different collection
    await docRef.set({ value: lux, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Lux value received and stored in Firebase');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
