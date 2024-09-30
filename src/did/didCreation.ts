import { Logger } from "tslog";
import { App } from "../utils/app";

import * as dotenv from "dotenv";

import { EthrDID } from "ethr-did";

import { Resolver } from "did-resolver";
import { getResolver } from "ethr-did-resolver";
import { Wallet, ethers, parseUnits } from "ethers";

async function run() {
    dotenv.config();
    const {
        LOG_LEVEL,
        EVM_JSON_RPC_ENDPOINT,
        DID_REGISTRY_CONTRACT,
        DID_CONTROLLER_1_PUBLIC_KEY,
        DID_CONTROLLER_1_PRIVATE_KEY
    } = process.env;

    App.logger = new Logger({
        minLevel: parseInt(LOG_LEVEL ?? "2", 10)
    });

    if (!EVM_JSON_RPC_ENDPOINT) {
        App.LError("Please provide a EVM endpoint");
        process.exit(-1);
    }

    if (!DID_CONTROLLER_1_PUBLIC_KEY) {
        App.LError("Please provide a public key for the new controller");
        process.exit(-1);
    }

    // It's recommended to use the multi-network configuration when using this in production
    // since that allows you to resolve on multiple public and private networks at the same time.

    const keypair = EthrDID.createKeyPair();
    App.LDebug("New DID. Public key:  ", keypair.publicKey);
    App.LDebug("New DID. Private key: ", keypair.privateKey);

    const providerConfig = {
        networks: [
            // { name: "ShimmerEVM", chainId: "0x94", rpcUrl: EVM_JSON_RPC_ENDPOINT, registry: DID_REGISTRY_CONTRACT },
            { name: "EBSI-EVM", chainId: "0x432", rpcUrl: EVM_JSON_RPC_ENDPOINT, registry: DID_REGISTRY_CONTRACT }
        ]
    };

    const ebsiNetwork = providerConfig.networks[0];
    const chainNameOrId = ebsiNetwork.chainId;

    const ethersProvider = new ethers.JsonRpcProvider(EVM_JSON_RPC_ENDPOINT);
    // Txs have to be signed by the owner of the DID, particularly the owner change
    const signer = new Wallet(keypair.privateKey, ethersProvider);

    // Send funds to allow change the owner and other operations that consume gas
    const signerFunds = new Wallet(DID_CONTROLLER_1_PRIVATE_KEY, ethersProvider);
    const tx = await signerFunds.sendTransaction({
        to: keypair.address,
        value: parseUnits("0.001", "ether")
    });
    const txSendResult = await tx.wait();
    App.LDebug(txSendResult);

    const ethrDid = new EthrDID({
        ...keypair,
        chainNameOrId,
        registry: ebsiNetwork.registry,
        provider: ethersProvider,
        txSigner: signer
    });

    App.LDebug(ethrDid.did);

    // getResolver will return an object with a key/value pair of { "ethr": resolver }
    // where resolver is a function used by the generic did resolver.
    const ethrDidResolver = getResolver(providerConfig);
    const didResolver = new Resolver(ethrDidResolver);

    // You can also use ES7 async/await syntax
    const doc = await didResolver.resolve(ethrDid.did);
    App.LDebug(doc);

    /*
    const result = await ethrDid.changeOwner(DID_CONTROLLER_1_PUBLIC_KEY);
    App.LDebug("Change owner result", result);
    */
    const result = await ethrDid.setAttribute("service", "1", 100);
    App.LDebug("Set attribute result", result);

    // const jwt = await ethrDid.signJWT({ hello: "world" }, 3600);
    // App.LDebug(jwt);
    // ethrDid.addDelegate()

    const doc2 = await didResolver.resolve(ethrDid.did);
    App.LDebug(doc2);
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
