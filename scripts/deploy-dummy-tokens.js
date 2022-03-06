/**
 * Deploy $DUMMYTOKEN
 */

const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    const __dev = "0x65d3c08aB4acC7FDe49b982CC511296b44dF308D";

    // Dummy WFTM
    const DummyFtm = await ethers.getContractFactory("DummyFtm");
    const dummyFtm = await DummyFtm.deploy();

    console.log("dummy ftm address:", dummyFtm.address);

    // Dummy USDC
    const DummyUSDC = await ethers.getContractFactory("DummyUSDC");
    const dummyUSDC = await DummyUSDC.deploy();

    console.log("dummy usdc address:", dummyUSDC.address);

    const UniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", "0x5D479c2a7FB79E12Ac4eBBAeDB0322B4d5F9Fd02");

    await UniswapV2Factory.createPair(
      dummyFtm.address,
      dummyUSDC.address);

    await dummyFtm.approve(
        "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d",
        dummyFtm.address
    );
    await dummyUSDC.approve(
        "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d",
        dummyUSDC.address
    );

    const UniswapV2Router = await ethers.getContractAt("IUniswapV2Router", "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d");

    const result = await UniswapV2Router.addLiquidity(
        dummyFtm.address,
        dummyUSDC.address,
        "1000000000000000000",
        "2100000000000000000",
        "1000000000000000000000",
        "2100000000000000000",
        __dev,
        (Math.floor(Date.now() / 1000) + 100).toString()
    );
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error(error);
    process.exit(1);
    });