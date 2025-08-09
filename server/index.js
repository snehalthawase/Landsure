const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');

app.use(cors());
app.use(express.json());

const mockData = JSON.parse(fs.readFileSync('./mock_data.json', 'utf-8'));

app.post('/certificates/verify', (req, res) => {
  const input = req.body;

    // Find a matching entry in mockData
  const match = mockData.find(entry => {
    return Object.keys(input).every(key => {
      if (key === 'verified') {
        return true; // Skip the 'verified' key from the comparison of input keys
      }
      return entry.hasOwnProperty(key) && entry[key] === input[key];
    });
  });

  
  if (match && match.verified) {
    res.json({ verified: true, data: match });
  } else {
    res.json({ verified: false });
  }
});

app.listen(3000, () => {
  console.log('Express server running on port 3000');
});
