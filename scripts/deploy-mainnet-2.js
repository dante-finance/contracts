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
  
    // WALLETS
    const __dev =                   "0x323842283489075c5892f7121EE070862c1E7b00";
    const __dao =                   "0x698d286d660B298511E49dA24799d16C74b5640D";
    
    // START TIME
    const __genesisStartTime =      "1648735200";   // Thu Mar 31 2022 14:00:00 GMT+0000
    const __purgatoryStartTime =    "1648908000";   // Sat Apr 02 2022 14:00:00 GMT+0000
    const __edenStartTime =         "1648929600";   // Sat Apr 02 2022 20:00:00 GMT+0000

    // PROTOCOL TOKENS
    const __danteTombLpAddress =    "0x588af2b627076c831e63fd2aca10b6f1e2732582";
    const __dante =                 "0xa26a9b052c18532c2e24a34bc25842e2491faec9";
    const __dbond =                 "0x3bb94cc7ab568f9550995dfee59a33454e3de16b";

    // LIVE TOKENS
    const __liveFtm =               "0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83";
    const __liveTomb =              "0x6c021ae822bea943b2e66552bde1d2696a53fbb7";
    const __liveUSDC =              "0x04068da6c83afcfa0e13ba15a6696662335d5b75";
    const __liveFame =              "0x904f51a2E7eEaf76aaF0418cbAF0B71149686f4A";
    
    // Treasury
    console.log("deploying treasury..");
    const Treasury = await ethers.getContractFactory("Treasury");
    const treasury = await Treasury.deploy();
      
    console.log("treasury address:", treasury.address);

    // DanteGenesisRewardPool
    console.log("deploying genesis reward pool...");
    console.log("cstr args:");
    console.log(__dante);
    console.log(__dao);
    console.log(__genesisStartTime);
    const DanteGenesisRewardPool = await ethers.getContractFactory("DanteGenesisRewardPool");
    const danteGenesisRewardPool = await DanteGenesisRewardPool.deploy(__dante,__dao,__genesisStartTime);
    
    console.log("adding banks...");
    await danteGenesisRewardPool.add("3750",__liveFtm,"true","0");
    await danteGenesisRewardPool.add("3750",__liveUSDC,"true","0");
    await danteGenesisRewardPool.add("1500",__liveTomb,"true","0");
    await danteGenesisRewardPool.add("10000",__danteTombLpAddress,"true","0");
    await danteGenesisRewardPool.add("1010",__liveFame,"true","0");

    console.log("dante genesis reward pool address:", danteGenesisRewardPool.address);

    console.log("deploying eden...");
    const Eden = await ethers.getContractFactory("Eden");
    const eden = await Eden.deploy();
        
    console.log("eden address:", eden.address);

    console.log("deploying grail...");
    console.log("cstr args:");
    console.log(__purgatoryStartTime);
    console.log(__dao);
    console.log(__dev);
    const Grail = await ethers.getContractFactory("Grail");
    const grail = await Grail.deploy(__purgatoryStartTime,__dao,__dev);

    console.log("grail address:", grail.address);

    // deploy grail reward pool
    console.log("deploy grail reward pool..");
    console.log("cstr args:");
    console.log(grail.address);
    console.log(__purgatoryStartTime);
    const GrailRewardPool = await ethers.getContractFactory("GrailRewardPool");
    const grailRewardPool = await GrailRewardPool.deploy(grail.address,__purgatoryStartTime);
    console.log("grail reward pool address: ", grailRewardPool.address);

    // distribute grail rewards
    console.log("distributing rewards to grail reward pool...");
    await grail.distributeReward(grailRewardPool.address);
        
    // deploy oracle
    // needs liquidity in LP before deployment
    console.log("deploying oracle...");
    console.log("cstr args:");
    console.log(__danteTombLpAddress);
    console.log("21600");
    console.log(__edenStartTime);
    const Oracle = await ethers.getContractFactory("Oracle");
    const oracle = await Oracle.deploy(__danteTombLpAddress,"21600",__edenStartTime);

    console.log("oracle address", oracle.address);

    console.log("initializing treasury...");
    await treasury.initialize (__dante,__dbond,grail.address,oracle.address,eden.address,__edenStartTime);

    console.log ("excluding dante genesis pool..");
    await treasury.addExclusionFromTokenSupply(danteGenesisRewardPool.address);

    console.log ("setting extra funds...");
    await treasury.setExtraFunds(__dao,"1800",__dev,"200");

    console.log("initializing masonry...");
    await eden.initialize (__dante,grail.address,treasury.address);

    // distribute rewards
    console.log("distribute rewards to dante genesis pool...");
    const DanteContract = await ethers.getContractAt("Dante", __dante);
    await DanteContract.distributeReward(danteGenesisRewardPool.address);

    const UniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3");     // MAINNET

    // create $GRAIL/$FTM LP
    console.log("creating $GRAIL/$FTM LP...");
    await UniswapV2Factory.createPair(__liveFtm,grail.address);    

    console.log("done.");
    
    const fs = require("fs");

    fs.writeFileSync(
        "../../dante-finance/app/src/tomb-finance/deployments/deployments.mainnet.json",
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
            }, undefined, 2),
            {
                flag: "w+"
            }
    );
}
  
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });