import { Logger } from "tslog";
import { App } from "../utils/app";

import * as dotenv from "dotenv";

import { Resolver } from "did-resolver";
import { getResolver } from "ethr-did-resolver";

async function run() {
    dotenv.config();
    const { LOG_LEVEL, EVM_JSON_RPC_ENDPOINT, DID_REGISTRY_CONTRACT, DID } = process.env;

    App.logger = new Logger({
        minLevel: parseInt(LOG_LEVEL ?? "2", 10)
    });

    if (!EVM_JSON_RPC_ENDPOINT) {
        App.LError("Please provide a EVM endpoint");
        process.exit(-1);
    }

    if (!DID) {
        App.LError("Please provide a DID");
        process.exit(-1);
    }

    // While experimenting, you can set a rpc endpoint to be used by the web3 provider
    // You can also set the address for your own ethr-did-registry contract
    const providerConfig = {
        networks: [
            // { name: "ShimmerEVM", chainId: "0x94", rpcUrl: EVM_JSON_RPC_ENDPOINT, registry: DID_REGISTRY_CONTRACT },
            { name: "EBSI-EVM", chainId: "0x432", rpcUrl: EVM_JSON_RPC_ENDPOINT, registry: DID_REGISTRY_CONTRACT }
        ]
    };

    // It's recommended to use the multi-network configuration when using this in production
    // since that allows you to resolve on multiple public and private networks at the same time.

    // getResolver will return an object with a key/value pair of { "ethr": resolver } where resolver is a function used by the generic did resolver.
    const ethrDidResolver = getResolver(providerConfig);
    const didResolver = new Resolver(ethrDidResolver);

    // You can also use ES7 async/await syntax
    const doc = await didResolver.resolve(DID);
    App.LDebug(doc);
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
