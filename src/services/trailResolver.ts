// @ts-ignore
import abiDefinition from "../contract-definition/trail.json" assert { type: "json" };

import { ethers, Contract } from "ethers";
import { ITrail } from "../models/ITrail";
import { App } from "../utils/app";

export class TrailResolver {
    private readonly evmEndpoint: string;

    constructor(evmEndpoint: string) {
        this.evmEndpoint = evmEndpoint;
    }

    public async resolveTrail(trailID: string): Promise<ITrail> {
        new URL(trailID);
        const components = trailID.split(":");
        const smartContractAdress = components[components.length - 1];

        const provider = new ethers.WebSocketProvider(this.evmEndpoint);

        const contract = new Contract(smartContractAdress, abiDefinition, provider);

        const trailData = await contract.trail();

        App.LDebug(trailData);

        let immutable = JSON.parse(trailData[0]);
        if (!immutable) {
            immutable = undefined;
        }

        const record = JSON.parse(trailData[1]);
        const stateIndex = trailData[2] as number;

        const governor = await contract.governorAddress();
        const controller = await contract.controllerAddress();

        const created = new Date(Number(trailData[3]) * 1000).toISOString();
        const updated = new Date(Number(trailData[4]) * 1000).toISOString();

        const lastTrailState = await contract.lastTrailState();
        App.LDebug(lastTrailState);

        return {
            trail: {
                id: trailID,
                record,
                immutable,
                stateIndex
            },
            meta: {
                created,
                updated,
                governor,
                controller,
                lastTrailState
            }
        };
    }
}
