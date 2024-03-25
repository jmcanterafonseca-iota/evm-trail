// @ts-ignore
import abiDefinition from "../contract-definition/trail.json" assert { type: "json" };

import { Contract, ethers } from "ethers";
import { TrailHelper } from "../helpers/trailHelper";
import { TrailResolver } from "./trailResolver";
import { App } from "../utils/app";
import { IInclusionResult } from "../models/IInclusionResult";

export class TrailInclusionService {
    private readonly evmEndpoint: string;

    constructor(evmEndpoint: string) {
        this.evmEndpoint = evmEndpoint;
    }

    public async isIncluded(
        trailID: string,
        record: unknown,
        inState: number,
        immutableData?: unknown
    ): Promise<IInclusionResult> {
        const resolution = new TrailResolver(this.evmEndpoint);
        const trail = await resolution.resolveTrail(trailID);

        if (trail.trail.stateIndex < inState) {
            return { included: false };
        }

        if (immutableData) {
            const toCheck = JSON.stringify(immutableData);
            if (toCheck !== JSON.stringify(trail.trail.immutable)) {
                return { included: false };
            }
        }

        const smartContractAddress = TrailHelper.extractSmartContractAddress(trailID);
        const provider = new ethers.WebSocketProvider(this.evmEndpoint);

        const contract = new Contract(smartContractAddress, abiDefinition, provider);

        const trailState = await contract.trailState(inState);

        // trailState[0] is the hash and trailState[1] is the block number

        // Let's calculate the corresponding hash and compare with the hash of that state
        // The hash is the SC address || controller address || record || stateIndex
        const abiCoder = new ethers.AbiCoder();

        const encodingResult = abiCoder.encode(
            ["address", "address", "string", "uint32"],
            [smartContractAddress, trail.meta.controller, JSON.stringify(record), inState]
        );

        const hash = ethers.keccak256(encodingResult);

        App.LDebug("Hash:", hash, "Trail State: ", trailState[0]);

        const blockDetails = await provider.getBlock(trailState[1]);

        if (hash === trailState[0]) {
            return {
                included: true,
                blockNumber: Number(trailState[1]),
                timestamp: new Date(blockDetails.timestamp * 1000).toISOString()
            };
        }

        return { included: false };
    }
}
