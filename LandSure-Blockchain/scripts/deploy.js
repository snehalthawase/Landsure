// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
  const LandSure = await ethers.getContractFactory("LandSure");
  const landsure = await LandSure.deploy();
  await landsure.waitForDeployment();

  console.log("LandSure deployed to:", await landsure.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
