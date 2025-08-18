require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: process.env.GANACHE_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};