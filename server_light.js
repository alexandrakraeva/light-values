const express = require('express'); // Framework to create web server
const admin = require('firebase-admin'); // Firebase services - database

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
let sessionCounters = {};

app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);

    // Generate new session ID for each connection
    const sessionId = require('uuid').v4();

    // Initialize the counter for this session
    sessionCounters[sessionId] = 0;

    let luxId = sessionCounters[sessionId]++;
    const luxCollection = db.collection(sessionId);
    luxCollection.doc(luxId.toString()).set({
        lightValue, // Assuming you want to store the light value in Firestore. Replace `lightValue` with the actual data object if different
        // Add server-generated timestamp
        timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
        .then(() => console.log('Data was added to Firestore successfully.'))
        .catch((error) => console.error('Error adding document to Firestore:', error));

    // Removed the extra closing brace from here
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
