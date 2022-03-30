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
      - create dante/tomb LP
 */

const { ethers } = require("hardhat");

async function main() {
    const __factory = "0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3";
    const __tomb = "0x6c021ae822bea943b2e66552bde1d2696a53fbb7";
    
    // deploy $DANTE
    const Dante = await ethers.getContractFactory("Dante");
    const dante = await Dante.deploy();

    console.log("dante address:", dante.address);

    // deploy $DBOND
    const DBond = await ethers.getContractFactory("DBond");
    const dbond = await DBond.deploy();

    console.log("dbond address:", dbond.address);

    console.log("creating dante/tomb LP...");
    const UniswapV2Factory = await ethers.getContractAt("IUniswapV2Factory", __factory);

    await UniswapV2Factory.createPair(__tomb,dante.address);

    console.log("done.");
}
  
main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});