const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

// Array to store the light values
let lightValues = [];

// POST route to receive light values
app.post('/send-light-value', (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);
    // Store the received light value
    lightValues.push(lightValue);

    res.status(200).send('Light value received');
});

// GET route to display the stored light values
app.get('/light-values', (req, res) => {
    res.status(200).json(lightValues);
});

// Route to handle GET requests to the root URL path
app.get('/', (req, res) => {
    res.send('Server is running');
});

// Route to handle GET requests to update the Lux value (optional)
app.get('/updateLux', (req, res) => {
    const lux = req.query.lux; // Extract Lux value from query parameters
    console.log(`Received Lux value: ${lux}`);
    // Store the received Lux value
    lightValues.push(lux);

    res.status(200).send('Lux value received');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
