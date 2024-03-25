import { Logger } from "tslog";
import { App } from "../utils/app";

import * as dotenv from "dotenv";

// @ts-ignore
import abiDefinition from "../contract-definition/trail.json" assert { type: "json" };
import { TrailInclusionService } from "../services/trailInclusion";

async function run() {
    dotenv.config();

    const { LOG_LEVEL, EVM_ENDPOINT, TRAIL_ID, INCLUSION_DETAILS } = process.env;

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

    if (!INCLUSION_DETAILS) {
        App.LError("Please provide inclusion details");
        process.exit(-1);
    }

    App.LDebug(INCLUSION_DETAILS);
    const inclusionDetails = JSON.parse(INCLUSION_DETAILS);

    const inclusionService = new TrailInclusionService(EVM_ENDPOINT);

    const record = inclusionDetails.record;
    const immutable = inclusionDetails.immutable;
    const stateIndex = inclusionDetails.stateIndex;

    App.LDebug(record, immutable, stateIndex);

    const inclusionResult = await inclusionService.isIncluded(TRAIL_ID, record, stateIndex, immutable);

    App.LDebug("Inclusion result", inclusionResult);
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
