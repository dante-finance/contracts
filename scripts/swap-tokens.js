
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
   
    const UniswapV2Router = await ethers.getContractAt("IUniswapV2Router", "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d");

    // dante 0x9579B1A5770EC610c77ba78e4a3aA3d5F00b31F2
    // tomb 0x04F62d3Fe06802069e814880d6E1Dcd186183825
    const amountIn =  "10000000000000000000";
    const amountOut = "8000000000000000000";
    const path = [  "0x04F62d3Fe06802069e814880d6E1Dcd186183825", 
                    "0x9579B1A5770EC610c77ba78e4a3aA3d5F00b31F2"];
    const to = "0xEc41b6233C080C591443473cc83C7e3F50bC1f9E";
    const deadline = (Math.floor(Date.now() / 1000) + 1000).toString();

    await UniswapV2Router.swapExactTokensForTokens(
        amountIn,
        amountOut,
        path,
        to,
        deadline
    );
 }
   
 main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });