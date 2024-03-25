// @ts-ignore
import contractDefinition from "../contract-definition/TrailContract.json" assert { type: "json" };

import { ethers, Contract } from "ethers";
import { ITrail } from "../models/ITrail";
import { App } from "../utils/app";
import { TrailHelper } from "../helpers/trailHelper";

const abiDefinition = contractDefinition.abi;

export class TrailResolver {
    private readonly evmEndpoint: string;

    constructor(evmEndpoint: string) {
        this.evmEndpoint = evmEndpoint;
    }

    public async resolveTrail(trailID: string): Promise<ITrail> {
        const smartContractAddress = TrailHelper.extractSmartContractAddress(trailID);

        const provider = new ethers.WebSocketProvider(this.evmEndpoint);

        const contract = new Contract(smartContractAddress, abiDefinition, provider);

        const trailData = await contract.trail();

        App.LDebug(trailData);

        let immutable = JSON.parse(trailData[0]);
        if (!immutable) {
            immutable = undefined;
        }

        const record = JSON.parse(trailData[1]);
        const stateIndex = Number(trailData[2]);

        const governor = await contract.governorAddress();
        const controller = await contract.controllerAddress();

        const created = new Date(Number(trailData[3]) * 1000).toISOString();
        const updated = new Date(Number(trailData[4]) * 1000).toISOString();

        const lastTrailStateHash = await contract.lastTrailStateHash();
        App.LDebug("Last trail State Hash", lastTrailStateHash);

        const firstTrailState = await contract.getTrailState(0);
        const lastTrailState = await contract.getTrailState(stateIndex);

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
                lastTrailStateHash,
                firstInclusionBlock: Number(firstTrailState[1]),
                lastInclusionBlock: Number(lastTrailState[1])
            }
        };
    }
}
