import { App } from "../utils/app";

import { ethers, Wallet, Contract, TransactionResponse } from "ethers";
// @ts-ignore
import abiDefinition from "../contract-definition/trail.json" assert { type: "json" };

import { TrailResolver } from "./trailResolver";

export class TrailRecordAddService {
    private readonly evmEndpoint: string;
    private readonly controllerPrivateKey: string;

    constructor(evmEndpoint: string, controllerPrivateKey: string) {
        this.evmEndpoint = evmEndpoint;
        this.controllerPrivateKey = controllerPrivateKey;
    }

    public async addRecordToTrail(trailId: string, record: unknown): Promise<number> {
        const resolver = new TrailResolver(this.evmEndpoint);

        const trailData = await resolver.resolveTrail(trailId);

        const lastTrailState = trailData.meta.lastTrailState;

        const provider = new ethers.WebSocketProvider(this.evmEndpoint);
        const signer = new Wallet(this.controllerPrivateKey, provider);

        const components = trailId.split(":");
        const smartContractAdress = components[components.length - 1];
        const contract = new Contract(smartContractAdress, abiDefinition, signer);

        const txResponse: TransactionResponse = await contract.addRecord(JSON.stringify(record), lastTrailState);
        const receipt = await txResponse.wait();
        App.LDebug("Transaction: ", txResponse.hash, receipt.blockNumber);

        return ++trailData.trail.stateIndex;
    }
}
