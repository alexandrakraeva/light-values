const express = require('express');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Initialize the counter document if it doesn't exist
const initializeCounter = async () => {
    const counterRef = db.collection('counters').doc('lightValues');
    const doc = await counterRef.get();
    if (!doc.exists) {
        await counterRef.set({ count: 0 });
    }
};

// Call the function to ensure the counter document is initialized
initializeCounter();

app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);

    // Use a transaction to read and increment the counter atomically
    try {
        const newDocId = await db.runTransaction(async (transaction) => {
            const counterRef = db.collection('counters').doc('lightValues');
            const counterDoc = await transaction.get(counterRef);

            let counter = 0;
            if (counterDoc.exists) {
                counter = counterDoc.data().count;
            }

            // Increment the counter
            transaction.update(counterRef, { count: counter + 1 });

            // Use the current counter value as the document ID
            const docRef = db.collection('lightValues').doc(`${counter}`);
            transaction.set(docRef, { value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

            return counter; // Return the ID of the new document
        });

        res.status(200).send(`Light value received and stored in Firebase with ID: ${newDocId}`);
    } catch (error) {
        console.error("Transaction failed: ", error);
        res.status(500).send('Failed to store light value');
    }
});

app.get('/light-values', async (req, res) => {
    const lightValues = [];
    const snapshot = await db.collection('lightValues').orderBy(admin.firestore.FieldPath.documentId()).get();
    snapshot.forEach(doc => {
        lightValues.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(lightValues);
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/updateLux', async (req, res) => {
    const lux = req.query.lux;
    console.log(`Received Lux value: ${lux}`);

    const docRef = db.collection('luxValues').doc();
    await docRef.set({ value: lux, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Lux value received and stored in Firebase');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
