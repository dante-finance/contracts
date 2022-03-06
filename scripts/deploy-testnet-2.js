/**
    (                                                                        
    )\ )                   )        (                                        
    (()/(      )         ( /(   (    )\ )  (             )                (   
    /(_))  ( /(   (     )\()) ))\  (()/(  )\   (     ( /(   (      (    ))\  
    (_))_   )(_))  )\ ) (_))/ /((_)  /(_))((_)  )\ )  )(_))  )\ )   )\  /((_) 
    |   \ ((_)_  _(_/( | |_ (_))   (_) _| (_) _(_/( ((_)_  _(_/(  ((_)(_))   
    | |) |/ _` || ' \))|  _|/ -_)   |  _| | || ' \))/ _` || ' \))/ _| / -_)  
    |___/ \__,_||_||_|  \__|\___|   |_|   |_||_||_| \__,_||_||_| \__| \___|  

 */

const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
  
    const __dev = "0x323842283489075c5892f7121EE070862c1E7b00";
    const __dao = "0x698d286d660B298511E49dA24799d16C74b5640D";
    //const __startTime = (Math.floor(Date.now() / 1000) + 1000).toString();
    const __startTime = 1646157600;

    
    const __danteTombLpAddress = "0x9ac3796cfe6b12d6665a32c3800492d6761fe28f";
    const __dante = "0x9579B1A5770EC610c77ba78e4a3aA3d5F00b31F2";
    const __dbond = "0x0478191f335BF54Ba5923E82e72E0902786eeE81";

    const __dummyFtm =  "0x7220838A1434a3DD4E434E6984F46A58B483Df69";
    const __dummyTomb = "0x04F62d3Fe06802069e814880d6E1Dcd186183825";
    const __dummyUSDC = "0x592B22834f4CB9F756D629E56Cfaf79E6dBe1Ee8";

    // Treasury
    console.log("deploying treasury..");
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy();
      
    console.log("treasury address:", treasury.address);

    // DanteGenesisRewardPool
    console.log("deploying genesis reward pool...");
    const DanteGenesisRewardPool = await ethers.getContractFactory("DanteGenesisRewardPool");
    const danteGenesisRewardPool = await DanteGenesisRewardPool.deploy(
        __dante,
        __dao,
        __startTime.toString()
    );
    
    console.log("adding banks...");
    await danteGenesisRewardPool.add(
        "4000",
        __dummyFtm,                                     // WFTM
        "true",
        "0"
    );
    await danteGenesisRewardPool.add(
        "4000",
        __dummyUSDC,                                    // USDC
        "true",
        "0"
    );
    await danteGenesisRewardPool.add(
        "2000",
        __dummyTomb,                                    // TOMB
        "true",
        "0"
    );
    await danteGenesisRewardPool.add(
        "10000",                                        
        __danteTombLpAddress,                           // DANTE/TOMB LP
        "true",
        "0"
    );

    console.log("dante genesis reward pool address:", danteGenesisRewardPool.address);

    console.log("deploying eden...");
    const Eden = await ethers.getContractFactory("Eden");
    const eden = await Eden.deploy();
        
    console.log("eden address:", eden.address);

    // start grail reward pool after genesis ends
    const grailRewardStartTime = (await danteGenesisRewardPool.poolEndTime()).toString();

    // deploy tshare
    console.log("deploying grail...");
    const Grail = await ethers.getContractFactory("Grail");
    const grail = await Grail.deploy(
        grailRewardStartTime,       // START TIME 
        __dao,                      // TREASURY
        __dev);                     // DEV FUND

    console.log("grail address:", grail.address);

    // deploy grail reward pool
    console.log("deploy grail reward pool..")
    const GrailRewardPool = await ethers.getContractFactory("GrailRewardPool");
    const grailRewardPool = await GrailRewardPool.deploy(
        grail.address,              // $GRAIL
        grailRewardStartTime        // START TIME
    );
    console.log("grail reward pool address: ", grailRewardPool.address);
    console.log("distributing rewards to grail reward pool...");
    await grail.distributeReward(grailRewardPool.address);
    console.log(await grail.rewardPoolDistributed());


    // start treasury 1 hour after grail reward pool
    const treasuryStartTime = (Number(await grailRewardPool.poolStartTime()) + 60 * 60).toString();
    console.log("treasury start time: " + treasuryStartTime);

    // deploy oracle
    console.log("deploying oracle...");
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy(
        __danteTombLpAddress,       // LP TOKEN
        21600,                      // HOW LONG IS EPOCH (6 HOURS)
        treasuryStartTime           // START TIME
    );

    console.log("oracle address", oracle.address);

    console.log("initializing treasury...");
    await treasury.initialize (
        __dante,                    // $DANTE
        __dbond,                    // $DBOND
        grail.address,              // $TSHARE
        oracle.address,             // ORACLE
        eden.address,               // MASONRY
        treasuryStartTime           // START TIME
    );

    await treasury.addExclusionFromTokenSupply(
        danteGenesisRewardPool.address
    );

    await treasury.setExtraFunds(
        __dao,                      // DAO WALLET
        "500",                      // DAO PERCENT
        __dev,                      // DEV WALLET
        "500"                       // DEV PERCENT
    );

    console.log("initializing masonry...");
    await eden.initialize (
        __dante,                    // $DANTE
        grail.address,              // $TSHARE
        treasury.address            // TREASURY
    );

    // distribute rewards
    console.log("distribute rewards to genesis pool...");
    const DanteContract = await ethers.getContractAt("Dante", __dante);
    await DanteContract.distributeReward(danteGenesisRewardPool.address);
    console.log(await DanteContract.rewardPoolDistributed());

    // create $GRAIL/$FTM LP
    console.log("creating $GRAIL/$FTM LP...");
    const ftm = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", __dummyFtm);

    const UniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", "0x5D479c2a7FB79E12Ac4eBBAeDB0322B4d5F9Fd02");
    const UniswapV2Router = await ethers.getContractAt("IUniswapV2Router", "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d");

    await UniswapV2Factory.createPair(
        grail.address,
        ftm.address);

    await grail.approve(
        "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d",
        grail.address
    );
    await ftm.approve(
        "0xcCAFCf876caB8f9542d6972f87B5D62e1182767d",
        ftm.address
    );
    
    console.log("adding liquidity...");
    // add liquidity 1 GRAIL / 10 FTM
    const result = await UniswapV2Router.addLiquidity(
        grail.address,
        ftm.address,
        "1000000000000000000",   
        "10000000000000000000",
        "1000000000000000000",
        "10000000000000000000",
        __dev,
        (Math.floor(Date.now() / 1000) + 100).toString()
    );

    // create DANTE/GRAIL LP
    console.log("creating $GRAIL/$DANTE LP...");
    await UniswapV2Factory.createPair(
        grail.address,
        __dante);

    console.log("adding liquidity...");
    // add liquidity 10 GRAIL / 10 DANTE
    await UniswapV2Router.addLiquidity(
        grail.address,
        __dante,
        "10000000000000000000",   
        "10000000000000000000",
        "10000000000000000000",
        "10000000000000000000",
        __dev,
        (Math.floor(Date.now() / 1000) + 100).toString()
    );    
    
    console.log("done.");

    const fs = require("fs");

    fs.writeFileSync(
        "../dantefinance-frontend/src/tomb-finance/deployments/deployments.testing.json",
        JSON.stringify(
            { 
                Dante: {
                    "address": __dante,
                    "abi": artifacts.readArtifactSync("Dante").abi
                },
                DBond: {
                    "address": __dbond,
                    "abi": artifacts.readArtifactSync("DBond").abi
                },
                Grail: {
                    "address": grail.address,
                    "abi": artifacts.readArtifactSync("Grail").abi
                },
                DanteRewardPool: {
                    "address": danteGenesisRewardPool.address,
                    "abi": artifacts.readArtifactSync("DanteGenesisRewardPool").abi
                },
                GrailRewardPool: {
                    "address": grailRewardPool.address,
                    "abi": artifacts.readArtifactSync("GrailRewardPool").abi
                },
                Masonry: {
                    "address": eden.address,
                    "abi": artifacts.readArtifactSync("Eden").abi
                },
                Treasury: {
                    "address": treasury.address,
                    "abi": artifacts.readArtifactSync("Treasury").abi
                },
                SeigniorageOracle: {
                    "address": oracle.address,
                    "abi": artifacts.readArtifactSync("Oracle").abi
                }
            }, undefined, 2)
    );
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });