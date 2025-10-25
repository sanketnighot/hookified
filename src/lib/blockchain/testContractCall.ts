import { getWriteFunctions, parseABI } from '@/lib/blockchain/abiParser';
import { etherscanService } from '@/services/blockchain/EtherscanService';

// Test ABI fetching and parsing
async function testABIFetching() {
  console.log('Testing ABI fetching...');

  try {
    // Test with USDC contract on Ethereum mainnet
    const usdcAddress = '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C'; // This is a placeholder, use real USDC address
    const chainId = 1;

    console.log(`Fetching ABI for ${usdcAddress} on chain ${chainId}`);

    const abi = await etherscanService.fetchContractABI(usdcAddress, chainId);
    console.log('✅ ABI fetched successfully');
    console.log(`ABI contains ${abi.length} items`);

    const parsedABI = parseABI(abi);
    console.log(`✅ ABI parsed successfully`);
    console.log(`Found ${parsedABI.functions.length} functions`);
    console.log(`Is ERC-20: ${parsedABI.isERC20}`);

    const writeFunctions = getWriteFunctions(abi);
    console.log(`✅ Found ${writeFunctions.length} write functions`);

    writeFunctions.forEach(func => {
      console.log(`- ${func.name}(${func.inputs.map(i => i.type).join(', ')})`);
    });

  } catch (error) {
    console.error('❌ ABI fetching failed:', error);
  }
}

// Test contract info fetching
async function testContractInfo() {
  console.log('\nTesting contract info fetching...');

  try {
    const contractAddress = '0xA0b86a33E6441b8C4C8C0C4C8C0C4C8C0C4C8C0C'; // Placeholder
    const chainId = 1;

    const contractInfo = await etherscanService.getContractInfo(contractAddress, chainId);
    console.log('✅ Contract info fetched successfully');
    console.log('Contract info:', contractInfo);

  } catch (error) {
    console.error('❌ Contract info fetching failed:', error);
  }
}

// Test chain configuration
function testChainConfig() {
  console.log('\nTesting chain configuration...');

  const { SUPPORTED_CHAINS, getChainById, getChainName } = require('@/lib/blockchain/chainConfig');

  console.log(`✅ Found ${SUPPORTED_CHAINS.length} supported chains`);

  SUPPORTED_CHAINS.forEach((chain: any) => {
    console.log(`- ${chain.name} (${chain.id}) - ${chain.testnet ? 'Testnet' : 'Mainnet'}`);
  });

  const ethereumChain = getChainById(1);
  console.log(`✅ Ethereum chain: ${ethereumChain?.name}`);

  const chainName = getChainName(1);
  console.log(`✅ Chain name: ${chainName}`);
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Contract Call Enhancement Tests\n');

  testChainConfig();

  // Only run API tests if API keys are configured
  const { isEtherscanConfigured } = require('@/lib/config');

  if (isEtherscanConfigured()) {
    await testABIFetching();
    await testContractInfo();
  } else {
    console.log('\n⚠️  Skipping API tests - Etherscan API key not configured');
    console.log('Set ETHERSCAN_API_KEY environment variable to test ABI fetching');
  }

  console.log('\n✅ All tests completed!');
}

// Export for use in other files
export { testABIFetching, testChainConfig, testContractInfo };

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}
