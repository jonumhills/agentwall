const { ethers } = require('hardhat')

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deploying from:', deployer.address)

  const AgentWallLog = await ethers.getContractFactory('AgentWallLog')
  const contract = await AgentWallLog.deploy()
  await contract.waitForDeployment()

  const address = await contract.getAddress()
  console.log('AgentWallLog deployed to:', address)
  console.log('Update AUDIT_LOG_CONTRACT in .env with:', address)
}

main().catch(console.error)
