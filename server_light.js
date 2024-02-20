const admin = require('firebase-admin');
const express = require('express');
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

app.post('/send-light-value', (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);
    // Store the received light value
    lightValues.push(lightValue);

    const docRef = db.collection('lightValues').doc(); // Creates a new document in the 'lightValues' collection
    await docRef.set({ value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Light value received and stored in Firebase');
});


// GET route to display the stored light values
app.get('/light-values', (req, res) => {
    res.status(200).json(lightValues);

    const lightValues = [];
    const snapshot = await db.collection('lightValues').get();
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
app.get('/updateLux', (req, res) => {
    const lux = req.query.lux; // Extract Lux value from query parameters
    console.log(`Received Lux value: ${lux}`);
    // Store the received Lux value
    lightValues.push(lux);

    res.status(200).send('Lux value received');

    const docRef = db.collection('luxValues').doc(); // You can choose to store in the same or a different collection
    await docRef.set({ value: lux, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Lux value received and stored in Firebase');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
