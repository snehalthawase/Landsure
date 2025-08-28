// server/index.js
const express = require('express');
const app = express();
const fs = require('fs');
const cors = require('cors');
require('dotenv').config({ path: '../.env' }); // Load .env from parent directory

// Import blockchain interaction functions and initialization promise
const {
 initializationPromise, // The promise that resolves when contract.js setup is complete
 storeCertificate,
 getCertificate,
 contract: getContract, // Getter for contract instance
 signer: getSigner,  // Getter for signer instance
 ethers,
 formatCertificateHash 
} = require("./contract");

// Middlewares
app.use(cors());
app.use(express.json());

// Load mock data once at startup
let mockData = [];
try {
 mockData = JSON.parse(fs.readFileSync('./mock_data.json', 'utf-8'));
} catch (err) {
 console.error("❌ Error reading mock_data.json:", err.message);
}

// Verify certificate (existing logic - does not depend on blockchain connection)
app.post('/certificates/verify', (req, res) => {
 const input = req.body;

 if (!input || Object.keys(input).length === 0) {
return res.status(400).json({ error: "No input data provided" });
 }

 const match = mockData.find(entry =>
 Object.keys(input).every(key => {
 if (key === 'verified') return true;
 return entry.hasOwnProperty(key) && entry[key] === input[key];
 })
 );

 if (match && match.verified) {
 res.json({ verified: true, data: match });
 } else {
 res.json({ verified: false });
 }
});


// Debug-only route
app.post("/submit", (req, res) => {
 try {
 const cert = req.body;
 const hashBytes32 = formatCertificateHash(cert);
 res.send({ success: true, hashBytes32 });
 } catch (err) {
 console.error(err);
 res.status(500).send({ error: err.message });
 }
});

// Register certificate to blockchain
app.post("/certificates/register", async (req, res) => {
 try {
 // 1. Wait for blockchain connection initialization
 await initializationPromise; 

 const signerInstance = getSigner();
 if (!signerInstance) { 
 throw new Error("Blockchain signer not available after initialization. Check contract.js setup.");
 }
 const signerAddress = await signerInstance.getAddress();

 // 2. Prepare transaction data (hash calculation)
 const data = req.body; 
 const metadataStr = JSON.stringify(data.metadata); 
 const certificateHash = ethers.keccak256(ethers.toUtf8Bytes(metadataStr)); 

 const certTxData = {
 certificateId: data.certificateId,
mainOwner: signerAddress, 
 totalArea: data.totalArea,
 numberOfTokens: data.numberOfTokens,
 certificateHash: certificateHash 
 };

 console.log("Calling storeCertificate with data:", certTxData);

 // 3. Call storeCertificate and await its result object
 // storeResult now contains { success: boolean, txHash: string, storedCertificate: object } or { success: false, error: string }
 const storeResult = await storeCertificate(certTxData); 

 // 4. Check for transaction failure (handled by contract.js's catch block)
 if (!storeResult.success) {
 throw new Error(storeResult.error);
 }

 // 5. Use the data returned by storeCertificate
 console.log("✅ Stored on blockchain, tx hash:", storeResult.txHash);
 console.log("📦 Data on blockchain:", storeResult.storedCertificate);

 res.json({
 success: true,
 txHash: storeResult.txHash, 
 savedCertificateData: storeResult.storedCertificate 
 });

 } catch (err) {
 console.error("❌ Error registering certificate:", err);
 
 // Use the "Certificate exists" message to return a clean 400 response
 if (err.message && err.message.includes("Certificate exists")) {
 return res.status(400).json({ 
 success: false,
 error: "This certificate is already logged on blockchain." 
 });
 }
    
    // Return a generic 500 error for all other issues
 res.status(500).json({ success: false, error: err.message || "An unknown server error occurred." });
 }
});

// Start server
const PORT = process.env.BACKEND_PORT || 3000;
app.listen(PORT, async () => { 
  console.log(`🚀 Express server running on port ${PORT}`);
});