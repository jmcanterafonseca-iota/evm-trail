import { Logger } from "tslog";
import { App } from "../utils/app";

import * as dotenv from "dotenv";

// @ts-ignore
import abiDefinition from "../contract-definition/trail.json" assert { type: "json" };
import { TrailRecordAddService } from "../services/trailRecordAddService";

async function run() {
    dotenv.config();

    const { LOG_LEVEL, EVM_ENDPOINT, CONTROLLER_PRIVATE_KEY, TRAIL_ID } = process.env;

    App.logger = new Logger({
        minLevel: parseInt(LOG_LEVEL ?? "2", 10)
    });

    if (!EVM_ENDPOINT) {
        App.LError("Please provide a EVM endpoint");
        process.exit(-1);
    }

    if (!CONTROLLER_PRIVATE_KEY) {
        App.LError("Please supply the controller's private key");
        process.exit(-1);
    }

    if (!TRAIL_ID) {
        App.LError("Please provide a Trail ID");
        process.exit(-1);
    }

    const additionService = new TrailRecordAddService(EVM_ENDPOINT, CONTROLLER_PRIVATE_KEY);

    const record = {
        hi: "hello"
    };

    const nextStateIndex = await additionService.addRecordToTrail(TRAIL_ID, record);

    App.LDebug("Trail next state index", nextStateIndex);
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
