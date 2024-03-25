// @ts-ignore
import contractDefinition from "../contract-definition/TrailContract.json" assert { type: "json" };

import { Contract, ethers } from "ethers";
import { TrailHelper } from "../helpers/trailHelper";
import { TrailResolver } from "./trailResolver";
import { App } from "../utils/app";
import { IInclusionResult } from "../models/IInclusionResult";

const abiDefinition = contractDefinition.abi;

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

        const claims = {
            stateIndex: inState,
            record,
            immutable: immutableData
        };

        if (trail.trail.stateIndex < inState) {
            return { claims, inclusionProofed: false };
        }

        if (immutableData) {
            const toCheck = JSON.stringify(immutableData);
            if (toCheck !== JSON.stringify(trail.trail.immutable)) {
                return { claims, inclusionProofed: false };
            }
        }

        const smartContractAddress = TrailHelper.extractSmartContractAddress(trailID);
        const provider = new ethers.WebSocketProvider(this.evmEndpoint);

        const contract = new Contract(smartContractAddress, abiDefinition, provider);

        // Let's calculate the corresponding hash and compare with the hash of that state
        // The hash is the SC address || controller address || record || stateIndex
        const abiCoder = new ethers.AbiCoder();

        const encodingResult = abiCoder.encode(
            ["address", "address", "string", "uint32"],
            [smartContractAddress, trail.meta.controller, JSON.stringify(record), inState]
        );
        const hash = ethers.keccak256(encodingResult);
        App.LDebug("Hash:", hash);

        // Here we need to query the contract's log so that it is found the corresponding entry
        const filter = await contract.filters.TrailRecordAdded(null, null, hash).getTopicFilter();

        const logs = await provider.getLogs({
            fromBlock: trail.meta.firstInclusionBlock,
            toBlock: "latest",
            address: smartContractAddress,
            topics: filter
        });

        if (logs.length === 0) {
            return { claims, inclusionProofed: false };
        }

        const logEntry = logs[0];

        const blockDetails = await logEntry.getBlock();

        return {
            claims,
            inclusionProofed: true,
            proof: {
                type: "IotaSmartContractChainProofOfInclusion2024",
                transactionHash: logEntry.transactionHash,
                transactionIndex: logEntry.transactionIndex,
                blockNumber: Number(blockDetails.number),
                timestamp: new Date(blockDetails.timestamp * 1000).toISOString()
            }
        };
    }
}
