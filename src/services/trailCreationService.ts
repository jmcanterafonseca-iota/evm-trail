import { ITrailData } from "../models/ITrailData";

import { App } from "../utils/app";

import { ethers, Wallet, ContractFactory } from "ethers";
// @ts-ignore
import contractDefinition from "../contract-definition/TrailContract.json" assert { type: "json" };
const abiDefinition = contractDefinition.abi;

import * as fs from "node:fs";
import { join, dirname } from "node:path";

import { fileURLToPath } from "url";
/* tslint:disable-next-line */
const filename = fileURLToPath(import.meta.url);
const currentDir = dirname(filename);

let byteCode;
try {
    byteCode = fs.readFileSync(join(currentDir, "../contract-definition/trail.bytecode"), "utf-8");
} catch (e) {
    App.LError(e);
    process.exit(-1);
}

export class TrailCreationService {
    private readonly evmEndpoint: string;
    private readonly governorPrivateKey: string;

    constructor(evmEndpoint: string, governorPrivateKey: string) {
        this.evmEndpoint = evmEndpoint;
        this.governorPrivateKey = governorPrivateKey;
    }

    public async createTrail(data: ITrailData): Promise<string> {
        const provider = new ethers.WebSocketProvider(this.evmEndpoint);
        const signer = new Wallet(this.governorPrivateKey, provider);

        const controller = data.controllerAddress;
        const governor = data.governorAddress;

        const factory = new ContractFactory(abiDefinition, byteCode, signer);
        if (!data.immutable) {
            data.immutable = "";
        }

        const contract = await factory.deploy(
            governor,
            controller,
            JSON.stringify(data.immutable),
            JSON.stringify(data.record),
            ""
        );
        App.LDebug("Waiting for deployment of Trail's SC ...", await contract.getAddress());
        await contract.waitForDeployment();

        return contract.getAddress();
    }
}
