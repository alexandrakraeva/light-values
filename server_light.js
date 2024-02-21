const express = require('express');

const socketIo = require('socket.io'); // websocketing
const admin = require('firebase-admin'); //firebase servises - database
const path = require('path'); // to transform file path
const { Parser } = require('json2csv'); // convert json to csv to save

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const serviceAccount = require('./xref-lux-values-firebase-adminsdk-puayh-d190ccc1e1.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

let sessionCounters = {};

io.on('connection', (socket) => {
    console.log('A user connected');
    // generate new session ID for each connection
    const sessionId = require('uuid').v4();
    socket.emit('sessionInit', { sessionId });
    // Initialize the counter for this session
    sessionCounters[sessionId] = 0;

    // listen for th elocation updates from client side
    socket.on('luxUpdate', (data) => {
        console.log(data);
        // generate a unique location ID for this session
        let luxId = sessionCounters[sessionId]++;
        // reference which collection to save locatations to in firebase
        const luxCollection = db.collection(sessionId);
        // add received location data to firebase, using location ID as document ID
        luxCollection.doc(luxId.toString()).set({
            ...data,
            // add server-generated time-stamp
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        })
            .then(() => console.log('Data was added to Firestore successfully.'))
            .catch((error) => console.error('Error adding document to Firestore:', error));
    });

    // listen for disconnect events
    socket.on('disconnect', () => {
        // Clean up the session counter when the user disconnects
        delete sessionCounters[sessionId];
    });
});

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