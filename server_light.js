const admin = require('firebase-admin');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize Firebase Admin with service account credentials
const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// Initialize Firestore database
const db = admin.firestore();

// POST endpoint to receive and store light values with a unique counter ID
app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);

    // Reference to the counter document for light values
    const counterRef = db.collection('counters').doc('lightValues');
    const counterDoc = await counterRef.get();

    // Retrieve or initialize the counter
    let counter = 0;
    if (counterDoc.exists) {
        counter = counterDoc.data().count;
    }

    // Store the light value with the counter as the document ID
    const docRef = db.collection('lightValues').doc(`${counter}`);
    await docRef.set({ value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    // Increment and update the counter
    await counterRef.set({ count: counter + 1 });

    res.status(200).send(`Light value received and stored in Firebase with ID: ${counter}`);
});

// GET endpoint to retrieve all stored light values
app.get('/light-values', async (req, res) => {
    const snapshot = await db.collection('lightValues').orderBy(admin.firestore.FieldPath.documentId()).get();
    const lightValues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

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

    // Store the received Lux value in Firestore with an auto-generated document ID
    const docRef = db.collection('luxValues').doc();
    await docRef.set({ value: lux, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Lux value received and stored in Firebase');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
