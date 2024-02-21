const express = require('express');
const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid'); // For generating unique session IDs

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Middleware to generate or retrieve session ID
app.use((req, res, next) => {
    let sessionId = req.headers['x-session-id'];
    if (!sessionId) {
        sessionId = uuidv4(); // Generate a new session ID if not provided
        res.setHeader('X-Session-ID', sessionId);
    }
    req.sessionId = sessionId; // Attach the session ID to the request object
    next();
});

app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    const sessionId = req.sessionId; // Retrieve the session ID from the request
    console.log(`Received light value: ${lightValue} for session: ${sessionId}`);

    const docRef = db.collection('sessions').doc(sessionId).collection('lightValues').doc();
    await docRef.set({ value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Light value received and stored in Firebase');
});

// Additional endpoints should also use the session ID to store/retrieve data

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
