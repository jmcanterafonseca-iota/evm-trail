const DidRegistry = artifacts.require("EthereumDIDRegistry.sol");

module.exports = function (deployer) {
  deployer.deploy(DidRegistry);
};
