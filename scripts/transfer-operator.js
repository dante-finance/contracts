
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
   
    const __newOperator = "0x8f1e765C979724F2C1538A9e5a83b94E6E49252E";

    const Dante = await ethers.getContractAt("Dante", "0x9579B1A5770EC610c77ba78e4a3aA3d5F00b31F2");
    await Dante.transferOperator(__newOperator);

    const Grail = await ethers.getContractAt("Grail", "0x323dF94fbA3df6dab29b7630E5ef4FcC0dc3b1B1");
    await Grail.transferOperator(__newOperator);

    const DBond = await ethers.getContractAt("DBond", "0x0478191f335BF54Ba5923E82e72E0902786eeE81");
    await DBond.transferOperator(__newOperator);

    const Eden = await ethers.getContractAt("Eden", "0xbBd68d6e14B1aC470cB1D774a9F68cAe2fAB42e7");
    await Eden.setOperator(__newOperator);
 }
   
 main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });