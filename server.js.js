const express = require('express');
const fs = require('fs');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

app.post('/save', (req, res) => {
    const data = req.body;
    let currentContent = [];
    if (fs.existsSync('content.json')) {
        currentContent = JSON.parse(fs.readFileSync('content.json', 'utf8'));
    }
    currentContent.push(data);
    fs.writeFileSync('content.json', JSON.stringify(currentContent, null, 2));
    res.sendStatus(200);
});

app.listen(3000, () => console.log('Auto-save engine running on port 3000'));