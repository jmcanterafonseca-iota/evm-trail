import { Logger } from "tslog";
import { App } from "../utils/app";

import * as dotenv from "dotenv";
import { TrailResolver } from "../services/trailResolver";

// @ts-ignore
import abiDefinition from "../contract-definition/trail.json" assert { type: "json" };

async function run() {
    dotenv.config();

    const { LOG_LEVEL, EVM_ENDPOINT, TRAIL_ID } = process.env;

    App.logger = new Logger({
        minLevel: parseInt(LOG_LEVEL ?? "2", 10)
    });

    if (!EVM_ENDPOINT) {
        App.LError("Please provide a EVM endpoint");
        process.exit(-1);
    }

    if (!TRAIL_ID) {
        App.LError("Please provide a Trail ID");
        process.exit(-1);
    }

    const resolver = new TrailResolver(EVM_ENDPOINT);

    const trailData = await resolver.resolveTrail(TRAIL_ID);

    App.LDebug("Trail", trailData);
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
