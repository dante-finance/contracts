/**
 * Deploy $DUMMYTOKEN
 */

const { ethers } = require("hardhat");

async function main() {
 
    console.log ("deploy wftm zapper...");
    
    const __native = "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";

    const Zapper = await ethers.getContractFactory("Zapper");
    //const Zapper = await ethers.getContractAt ("Zapper", "0xFF9677B81806DbB899b328e8a9fB94d8BC3202B9");
    const zapper = await Zapper.deploy(
        __native
    );
 
    console.log ("zapper address:", zapper.address);
 
    await zapper.setNativeRouter (
        "0xF491e7B69E4244ad4002BC14e878a34207E38c29"
    );

    console.log ("done.");
}
 
main()
     .then(() => process.exit(0))
     .catch((error) => {
     console.error(error);
     process.exit(1);
     });