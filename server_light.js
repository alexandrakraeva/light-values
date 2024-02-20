const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON bodies

app.post('/send-light-value', (req, res) => {
    const lightValue = req.body.lightValue;
    console.log(`Received light value: ${lightValue}`);
    // Here you can add the logic to send the value to Firebase

    res.status(200).send('Light value received');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});