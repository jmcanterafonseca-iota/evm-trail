import { Logger } from "tslog";
import { App } from "../utils/app";

import * as dotenv from "dotenv";
import { TrailCreationService } from "../services/trailCreationService";
import { ITrailData } from "../models/ITrailData";

import { ethers, Contract } from "ethers";

// @ts-ignore
import abiDefinition from "../contract-definition/trail.json" assert { type: "json" };

async function run() {
    dotenv.config();

    const { LOG_LEVEL, EVM_ENDPOINT, GOVERNOR_PRIVATE_KEY, GOVERNOR_ADDRESS, CONTROLLER_ADDRESS } = process.env;

    App.logger = new Logger({
        minLevel: parseInt(LOG_LEVEL ?? "2", 10)
    });

    if (!EVM_ENDPOINT) {
        App.LError("Please provide a EVM endpoint");
        process.exit(-1);
    }

    if (!GOVERNOR_PRIVATE_KEY || !GOVERNOR_ADDRESS || !CONTROLLER_ADDRESS) {
        App.LError("Please supply the governor's and controller's public and private key");
        process.exit(-1);
    }

    const creationService = new TrailCreationService(EVM_ENDPOINT, GOVERNOR_PRIVATE_KEY);

    const trailData: ITrailData = {
        governorAddress: GOVERNOR_ADDRESS,
        controllerAddress: CONTROLLER_ADDRESS,
        record: {
            hello: "world"
        }
    };

    const smartContract = await creationService.createTrail(trailData);

    App.LDebug("Smart Contract Address", smartContract);

    const provider = new ethers.WebSocketProvider(EVM_ENDPOINT);
    // Now obtaining the Trail ID
    const contract = new Contract(smartContract, abiDefinition, provider);

    const result = await contract.trailID();
    App.LDebug("TrailID", result);

    const trailState = await contract.trailState(0);
    App.LDebug(trailState);
}

run()
    .then(() => {
        App.LDebug("Operation Finished ok");
        process.exit(-1);
    })
    .catch(err => {
        App.LError(JSON.stringify(err));
        process.exit(-1);
    });
