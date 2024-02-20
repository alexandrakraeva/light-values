const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies


const admin = require('firebase-admin');

// Initialize Firebase Admin with service account
const serviceAccount = require('xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();


// Array to store the light values
let lightValues = [];

app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    const datetime = new Date().toISOString(); // Current timestamp in ISO format
    console.log(`Received light value: ${lightValue} at ${datetime}`);

    // Create a document in Firestore
    const docRef = db.collection('lightValues').doc();
    await docRef.set({
        lightValue: lightValue,
        datetime: datetime
    });

    res.status(200).send('Light value received and stored in Firestore');
});








// GET route to display the stored light values
app.get('/light-values', (req, res) => {
    res.status(200).json(lightValues);
});






// Route to handle GET requests to the root URL path
app.get('/', (req, res) => {
    res.send('Server is running');
});








// Route to handle GET requests to update the Lux value
app.get('/updateLux', async (req, res) => {
    const lux = req.query.lux; // Extract Lux value from query parameters
    const datetime = new Date().toISOString(); // Current timestamp in ISO format
    console.log(`Received Lux value: ${lux} at ${datetime}`);

    // Create a document in Firestore
    const docRef = db.collection('luxValues').doc();
    await docRef.set({
        luxValue: lux,
        datetime: datetime
    });

    res.status(200).send('Lux value received and stored in Firestore');
});






app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
