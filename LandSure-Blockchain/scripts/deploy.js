// scripts/deploy.js
const hre = require("hardhat");

async function main() {
  const LandSure = await hre.ethers.getContractFactory("LandSure");
  const contract = await LandSure.deploy();
  // ethers v6 style:
  if (contract.waitForDeployment) {
    await contract.waitForDeployment();
    console.log("LandSure deployed to:", await contract.getAddress());
  } else {
    // fallback for ethers v5
    await contract.deployed();
    console.log("LandSure deployed to:", contract.address);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
