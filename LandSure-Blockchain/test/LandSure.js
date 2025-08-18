const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LandSure", function () {
  let landSure;
  let owner;
  let otherAccount;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const LandSure = await ethers.getContractFactory("LandSure");
    landSure = await LandSure.deploy();
    await landSure.waitForDeployment();
  });

  it("Should allow an owner to register a new certificate", async function () {
    const certId = "SHAIK2109C-119-11";
    const totalArea = "5000 sqft";
    const numTokens = 2;
    const hash = ethers.keccak256(ethers.toUtf8Bytes("dummy metadata"));

    // Call the transaction
    const tx = await landSure.registerCertificate(
      certId,
      owner.address,
      totalArea,
      numTokens,
      hash
    );

    // Wait for the transaction to be mined
    await tx.wait();

    // Fetch the certificate details using the getCertificate view function
    const [id, mainOwner, area, tokensCount, certHash, tokenIds] =
      await landSure.getCertificate(certId);

    // Assertions
    expect(id).to.equal(certId);
    expect(mainOwner).to.equal(owner.address);
    expect(area).to.equal(totalArea);
    expect(tokensCount).to.equal(numTokens);
    expect(certHash).to.equal(hash);
    expect(tokenIds.length).to.equal(numTokens);
  });

  it("Should map tokens to owner correctly", async function () {
    const certId = "CERT-123";
    const totalArea = "123 Main Street";
    const numTokens = 1;
    const hash = ethers.keccak256(ethers.toUtf8Bytes("something"));

    // Call the transaction to register and mint tokens
    const tx = await landSure.registerCertificate(
      certId,
      owner.address,
      totalArea,
      numTokens,
      hash
    );
    await tx.wait();
    
    // Fetch the certificate to get the minted token IDs
    const [,,, , , tokenIds] = await landSure.getCertificate(certId);

    // Assuming at least one token was minted, get the first one
    const firstTokenId = tokenIds[0];

    // Grab the token using the getToken view function
    const [id, cert, currentOwner, burned] = await landSure.getToken(firstTokenId);

    // Assertions
    expect(cert).to.equal(certId);
    expect(currentOwner).to.equal(owner.address);
    expect(burned).to.equal(false);
  });

  it("Should revert if certificate already exists", async function () {
    const certId = "CERT-999";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("meta"));
    await landSure.registerCertificate(certId, owner.address, "area", 1, hash);

    await expect(
      landSure.registerCertificate(certId, owner.address, "area", 1, hash)
    ).to.be.revertedWith("Certificate exists");
  });
});