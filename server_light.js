const express = require('express');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);

    const counterRef = db.collection('counters').doc('lightValues');
    const counterDoc = await counterRef.get();

    let counter = 1; // Default to 1 if counter document doesn't exist
    if (counterDoc.exists) {
        counter = counterDoc.data().count;
        console.log(`Current counter value: ${counter}`); // Debug logging
    } else {
        console.log("Counter document doesn't exist. Starting from 1.");
    }

    const docRef = db.collection('lightValues').doc(`${counter}`); // Explicitly setting document ID
    await docRef.set({
        value: lightValue,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    await counterRef.set({ count: counter + 1 }); // Incrementing counter

    console.log(`New counter value after increment: ${counter + 1}`); // Debug logging

    res.status(200).send(`Light value received and stored in Firebase with ID: ${counter}`);
});


app.get('/light-values', async (req, res) => {
    const snapshot = await db.collection('lightValues').orderBy(admin.firestore.FieldPath.documentId()).get();
    const lightValues = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).json(lightValues);
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/updateLux', async (req, res) => {
    const lux = req.query.lux;
    console.log(`Received Lux value: ${lux}`);

    const docRef = db.collection('luxValues').doc();
    await docRef.set({
        value: lux,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send('Lux value received and stored in Firebase');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});