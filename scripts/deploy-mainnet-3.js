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
    const __grailRewardPoolAddress = "0x42B6f465a721262746370F1523f41290be37a67D";
    const __danteTombLp = "0x0cb8b223d3e62140d45a6ed2fa79e9d298e368c1";
    const __grailFtmLp = "0x94c8f3ce7181bc2a24b43fc2ca0b0b9b4587735e";
    const __danteGrailLp = "0xb8c780a89e8f13414a96d13aa13c523f1a5d36bc";

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
    /*await GrailRewardPool.add(
      "7750",
      __danteGrailLp,
      "true",
      "0"
    );*/

    console.log("done.");
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});