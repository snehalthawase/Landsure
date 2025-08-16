require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      accounts: ["0x601d702ab907d35e150e4d2fecb26bfd9c6d9c4a1e34917be80749e3159f2c1d"]
    }
  }
};