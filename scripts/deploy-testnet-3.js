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

    const __grailRewardPoolAddress = "0x90D37022c22a55228e476443312Dc165bC77F917";
    const __danteTombLp = "0x9ac3796cfe6b12d6665a32c3800492d6761fe28f";
    const __grailFtmLp = "0x78c7fe92dd16392232a45dd3c5a930f2bd580418";
    const __danteGrailLp = "0x521bbc668698999ac18d631002665c66daabef5a";

    const GrailRewardPool = await ethers.getContractAt("GrailRewardPool", __grailRewardPoolAddress);

    // add banks
    await GrailRewardPool.add(
      "29750",
      __danteTombLp,
      "true",
      "0"
      );
    await GrailRewardPool.add(
      "22000",
      __grailFtmLp,
      "true",
      "0"
    );
    await GrailRewardPool.add(
      "7750",
      __danteGrailLp,
      "true",
      "0"
    );

    console.log("done.");
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});