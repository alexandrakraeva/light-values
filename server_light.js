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

let currentCollectionSuffix = 0; // Default starting suffix

// Function to increment the collection suffix on server start
async function incrementCollectionSuffix() {
    const suffixRef = db.collection('system').doc('collectionSuffix');
    const doc = await suffixRef.get();

    if (doc.exists) {
        currentCollectionSuffix = doc.data().suffix + 1;
    } else {
        currentCollectionSuffix = 1; // Start with 1 if it doesn't exist
    }

    // Update the suffix in Firestore for next server start
    await suffixRef.set({ suffix: currentCollectionSuffix });
}

// Call this function when the server starts
incrementCollectionSuffix().then(() => {
    console.log(`Using collection suffix: ${currentCollectionSuffix}`);
}).catch(console.error);

// Modify your route to use the currentCollectionSuffix
app.post('/send-light-value', async (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);

    // Use the current collection suffix in your document reference
    const docRef = db.collection(`luxValues${currentCollectionSuffix}`).doc();
    await docRef.set({ value: lightValue, timestamp: admin.firestore.FieldValue.serverTimestamp() });

    res.status(200).send('Light value received and stored in Firebase');
});

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});