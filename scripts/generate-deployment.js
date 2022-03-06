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

const fs = require("fs");

fs.writeFileSync(
    "../dantefinance-frontend/src/tomb-finance/deployments/deployments.testing.json",
    JSON.stringify(
        { 
            SeigniorageOracle: {
                "address": "0x00356F11D50E0e59A6576bA5421079DE1826C93b",
                "abi": artifacts.readArtifactSync("Oracle").abi
            },
            Dante: {
                "address": "0xC5c34B7BA55692DDFe30C2D98C7316DF57d24528",
                "abi": artifacts.readArtifactSync("Dante").abi
            },
            Grail: {
                "address": "0x2097eee5a2e374240e29092c2bed67d531432fd9",
                "abi": artifacts.readArtifactSync("Grail").abi
            },
            DBond: {
                "address": "0xa354AecacCc6345EEe79Eb7E6Ca261EA439DdEf4",
                "abi": artifacts.readArtifactSync("DBond").abi
            },
            Treasury: {
                "address": "0x9D9245afCd208aDDd3601ACa6e6C3e3E4e49581d",
                "abi": artifacts.readArtifactSync("Treasury").abi
            },
            Masonry: {
                "address": "0xc56b13c4ddD08177C73bE5E70E1854136c07EAEA",
                "abi": artifacts.readArtifactSync("Eden").abi
            },
            DanteRewardPool: {
                "address": "0xf477FAcac0343823984b3D231f37E342628E5eeD",
                "abi": artifacts.readArtifactSync("DanteGenesisRewardPool").abi
            },
            GrailRewardPool: {
                "address": "0xf54f75C6dfa4C5AdA67927C7c816E563327A3b51",
                "abi": artifacts.readArtifactSync("GrailRewardPool").abi
            }
        }, undefined, 2)
);