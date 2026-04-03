require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config({ path: '../../.env' })

module.exports = {
  solidity: '0.8.20',
  networks: {
    sepolia: {
      url: process.env.RPC_URL || 'https://rpc.sepolia.org',
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
    }
  }
}
