import 'dotenv/config';
import { Alchemy, Network } from 'alchemy-sdk';
import { ethers } from 'ethers';
import { Utils } from 'alchemy-sdk';
import ContractABI from "./contracts/ABI.json" assert { type: "json" };
import FFCContractABI from './contracts/FFCABI.json' assert { type: 'json' };

const ContractAddress = process.env.CONTRACT_ADDRESS;
const FFCContractAddress = process.env.FFCCONTRACT_ADDRESS;
const alchemyKey = process.env.ALCHEMY_ID;
const walletKey = process.env.WALLET_KEY;
const provider = new ethers.providers.AlchemyProvider('goerli', alchemyKey);
const signer = new ethers.Wallet(walletKey, provider);
const NFTContract = new ethers.Contract(ContractAddress, ContractABI, signer);
const contractInterface = new Utils.Interface(FFCContractABI);
const burnedEventTopic = '0xbb86aac552e7daad54f1c3f5b105fc38f7b8cf42a7a6cd38aed9e9ae938d1693';
const filter = {
  address: FFCContractAddress,
  topics: [burnedEventTopic],
};

const config = {
  apiKey: alchemyKey,
  network: Network.ETH_GOERLI,
};

const alchemy = new Alchemy(config);

function main(){
  alchemy.ws.on(filter, async (log) => {
    try {
      const parsedLog = parseLogs(log, contractInterface);
      const ownerAddress = parsedLog.args[0];
      console.log('🚀 ~ file: index.js:33 ~ alchemy.ws.on ~ ownerAddress:', ownerAddress);
      const tokenId = parsedLog.args[1];
      console.log('🚀 ~ file: index.js:35 ~ alchemy.ws.on ~ tokenId:', tokenId);
      const tier = parsedLog.args[2];
      console.log('🚀 ~ file: index.js:37 ~ alchemy.ws.on ~ tier:', tier);
      const gas = await NFTContract.estimateGas.airdropOnBurn(ownerAddress, tokenId, tier);
      const tx = await NFTContract.airdropOnBurn(ownerAddress, tokenId, tier, {
        gasLimit: gas,
      });
      await tx.wait();
      console.log('🚀 ~ file: index.js:41 ~ alchemy.ws.on ~ tx: NFT Minted Successfully');
    } catch (error) {
      console.log("🚀 ~ file: index.js:34 ~ alchemy.ws.on ~ error:", error)
    }
  });
}

const parseLogs = (log, contractInterface) => {
  return contractInterface.parseLog(log);
};

main()