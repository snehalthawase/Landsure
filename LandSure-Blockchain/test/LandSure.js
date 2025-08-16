const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandSure", function () {
  let landSure;
  let owner;
  let otherAccount;

  beforeEach(async function () {
    // Deploy the contract before each test
    [owner, otherAccount] = await ethers.getSigners();
    const LandSure = await ethers.getContractFactory("LandSure");
    landSure = await LandSure.deploy();
  });

  it("Should allow an owner to register a new certificate", async function () {
    const certificateId = 123;
    const ownerName = "John Doe";
    const landLocation = "123 Main Street";
    const landArea = 5000; // in square feet

    // Call the registerCertificate function
    await landSure.registerCertificate(certificateId, ownerName, landLocation, landArea);

    // Verify that the certificate was registered correctly
    const certificate = await landSure.certificates(certificateId);
    expect(certificate.certificateId).to.equal(certificateId);
    expect(certificate.ownerName).to.equal(ownerName);
    expect(certificate.landLocation).to.equal(landLocation);
    expect(certificate.landArea).to.equal(landArea);
  });

  it("Should map the certificate ID to the owner's address", async function () {
    const certificateId = 123;
    const ownerName = "John Doe";
    const landLocation = "123 Main Street";
    const landArea = 5000;

    await landSure.registerCertificate(certificateId, ownerName, landLocation, landArea);

    // Check the ownerToCertificate mapping
    expect(await landSure.ownerToCertificate(owner.address)).to.equal(certificateId);
  });

  it("Should revert if the certificate already exists", async function () {
    // Register the certificate for the first time
    const certificateId = 123;
    await landSure.registerCertificate(certificateId, "John Doe", "Location", 5000);
    
    // Try to register the same certificate again
    await expect(
      landSure.registerCertificate(certificateId, "Jane Doe", "Another Location", 6000)
    ).to.be.revertedWith("Certificate already exists");
  });
});