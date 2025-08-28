// C:\EDI PROJECT\LandSure\LandSure-Blockchain\hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
// No dotenv.config() needed here if we only rely on Hardhat's default network and Hardhat's .env.
// If you have other .env variables specifically for hardhat.config.js, you can keep dotenv.config().

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  // Remove the entire 'networks' object, or at least the 'ganache' entry.
  // Hardhat will default to its in-memory network without explicit configuration.
  // networks: {
  //   ganache: {
  //     url: process.env.GANACHE_URL,
  //     accounts: [process.env.PRIVATE_KEY]
  //   }
  // }
};


















// require("@nomicfoundation/hardhat-toolbox");
// // Import dotenv and specify the path to the .env file one level up
// require("dotenv").config({ path: '../.env' }); // <--- IMPORTANT CHANGE HERE

// const GANACHE_URL = process.env.GANACHE_URL;
// const PRIVATE_KEY = process.env.PRIVATE_KEY; // This is the key for your Hardhat/Ganache account

// // Ensure that environment variables are loaded
// if (!GANACHE_URL) {
//   console.error("GANACHE_URL is not set in your .env file.");
//   process.exit(1);
// }
// if (!PRIVATE_KEY) {
//   console.error("PRIVATE_KEY is not set in your .env file.");
//   process.exit(1);
// }


// /** @type import('hardhat/config').HardhatUserConfig */
// module.exports = {
//   solidity: "0.8.24",
//   networks: {
//     ganache: {
//       url: GANACHE_URL, // Use the variable loaded from .env
//       accounts: [PRIVATE_KEY] // Use the variable loaded from .env
//     }
//     // You can add other networks like sepolia here if needed, configured similarly
//   }
// };