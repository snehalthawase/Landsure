const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

const artifact = require("../LandSure-Blockchain/artifacts/contracts/LandSure.sol/LandSure.json");

let contract;
let signer;
let isInitialized = false;

const initializationPromise = (async () => {
    try {
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        signer = await provider.getSigner(0);
        console.log("Backend using signer address:", await signer.getAddress());

        const contractAddress = process.env.CONTRACT_ADDRESS;
        if (!contractAddress) {
            throw new Error("CONTRACT_ADDRESS not set in .env (server/contract.js)");
        }

        contract = new ethers.Contract(contractAddress, artifact.abi, signer);
        console.log("Contract initialized with address:", contractAddress);

        console.log(
            "Available contract functions:",
            contract.interface.fragments.map((f) => f.name)
        );

        isInitialized = true;
    } catch (error) {
        console.error("❌ Failed to initialize contract.js:", error);
        process.exit(1);
    }
})();

async function storeCertificate(cert) {
    if (!isInitialized) await initializationPromise;

    try {
        console.log("📌 Registering certificate:", cert);

        const tx = await contract.registerCertificate(
            cert.certificateId,
            cert.mainOwner, 
            cert.totalArea,
            cert.numberOfTokens,
            cert.certificateHash,
        );

        console.log(`Waiting for transaction ${tx.hash} to be confirmed...`);
        await tx.wait(); 
        console.log("✅ Stored on blockchain, tx hash:", tx.hash);

        console.log("Calling getCertificate with:", cert.certificateId);
        const getCertResult = await getCertificate(cert.certificateId);

        if (!getCertResult.success) {
            throw new Error(`Failed to fetch stored certificate: ${getCertResult.error}`);
        }

        return {
            success: true,
            txHash: tx.hash,
            storedCertificate: getCertResult.data,
        };

    } catch (err) {
        console.error("❌ Error in storeCertificate:", err);
        return { success: false, error: err.message || err.reason || String(err) };
    }
}

async function getCertificate(certificateId) {
    if (!isInitialized) await initializationPromise;

    try {
        const cert = await contract.getCertificate(certificateId);

        // For ethers v6, cert is an array
        if (cert[0] === "" || cert[1].toLowerCase() === ethers.ZeroAddress.toLowerCase()) {
            return { success: false, error: "Certificate not found" };
        }

        const formatted = {
            certificateId: cert[0],
            mainOwner: cert[1],
            totalArea: cert[2].toString(),
            numberOfTokens: cert[3].toString(),
            certificateHash: cert[4],
            tokenIds: cert[5].map((t) => t.toString()),
        };

        return { success: true, data: formatted };
    } catch (err) {
        console.error("❌ Error in getCertificate:", err);
        return { success: false, error: err.message || err.reason || String(err) };
    }
}

function formatCertificateHash(cert) {
    if (!cert || !cert.certificateHash) {
        throw new Error("Invalid certificate object");
    }
    return ethers.hexlify(ethers.zeroPadValue(cert.certificateHash, 32));
}

module.exports = {
    initializationPromise,
    storeCertificate,
    getCertificate,
    contract: () => contract,
    signer: () => signer,
    ethers,
    formatCertificateHash,
};