
const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
   
    const __newOperator = "0xDaFd26A4F5F946e06a7e002931f0081dE8f54aAd";

    const Dante = await ethers.getContractAt("Dante", "0xad380729f1cb6b2a8c0584ffa728550941a692bf");
    await Dante.transferOperator(__newOperator);

    const Grail = await ethers.getContractAt("Grail", "0x7d2Ff5CCa24081cd7A5b2502b46F80B766E9bCB7");
    await Grail.transferOperator(__newOperator);

    const DBond = await ethers.getContractAt("DBond", "0xa210bF39137a51A4E82B998Ec00b38644EE0dbFb");
    await DBond.transferOperator(__newOperator);

    const Eden = await ethers.getContractAt("Eden", "0x183077f975c5B0924694cD70E236BD418B42726e");
    await Eden.setOperator(__newOperator);
 }
   
 main()
     .then(() => process.exit(0))
     .catch((error) => {
       console.error(error);
       process.exit(1);
     });