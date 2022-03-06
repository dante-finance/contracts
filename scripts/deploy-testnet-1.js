/**
    (                                                                        
    )\ )                   )        (                                        
    (()/(      )         ( /(   (    )\ )  (             )                (   
    /(_))  ( /(   (     )\()) ))\  (()/(  )\   (     ( /(   (      (    ))\  
    (_))_   )(_))  )\ ) (_))/ /((_)  /(_))((_)  )\ )  )(_))  )\ )   )\  /((_) 
    |   \ ((_)_  _(_/( | |_ (_))   (_) _| (_) _(_/( ((_)_  _(_/(  ((_)(_))   
    | |) |/ _` || ' \))|  _|/ -_)   |  _| | || ' \))/ _` || ' \))/ _| / -_)  
    |___/ \__,_||_||_|  \__|\___|   |_|   |_||_||_| \__,_||_||_| \__| \___|  

    Steps:
      - deploy dante
      - deploy dbond
      - deploy dummy tomb
      - create dante/tomb LP
      - add liquidity (1000/1000) to dante/tomb LP
 */

const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();

    const __dev = "0x323842283489075c5892f7121EE070862c1E7b00";
    const __ftmDummy = "0x7220838A1434a3DD4E434E6984F46A58B483Df69";

    // deploy $DANTE
    const Dante = await ethers.getContractFactory("Dante");
    const dante = await Dante.deploy();

    console.log("dante address:", dante.address);

    // deploy $DBOND
    const DBond = await ethers.getContractFactory("DBond");
    const dbond = await DBond.deploy();

    console.log("dbond address:", dbond.address);

    // deploy $DUMMYTOMB
    const DummyTomb = await ethers.getContractFactory("DummyTomb");
    const tomb = await DummyTomb.deploy();

    console.log("dummy tomb address:", tomb.address);

    console.log("creating dante/tomb LP...");
    const UniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", "0x5D479c2a7FB79E12Ac4eBBAeDB0322B4d5F9Fd02");

    await UniswapV2Factory.createPair(
      dante.address,
      tomb.address);

    await dante.approve(
        "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d",
        dante.address
    );
    await tomb.approve(
        "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d",
        tomb.address
    );

    const UniswapV2Router = await ethers.getContractAt("IUniswapV2Router", "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d");

    // 1000/1000
    console.log("adding liquidity...");
    await UniswapV2Router.addLiquidity(
      dante.address,
      tomb.address,
      "1000000000000000000000",
      "1000000000000000000000",
      "1000000000000000000000",
      "1000000000000000000000",
      __dev,
      (Math.floor(Date.now() / 1000) + 100).toString()
    );

    console.log("creating ftm/tomb LP");
    await UniswapV2Factory.createPair(
      __ftmDummy,
      tomb.address);

    console.log("adding liquidity...");
    await UniswapV2Router.addLiquidity(
      __ftmDummy,
      tomb.address,
      "1000000000000000000",
      "1000000000000000000",
      "1000000000000000000",
      "1000000000000000000",
      __dev,
      (Math.floor(Date.now() / 1000) + 100).toString()
    );

    console.log("done.");
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});