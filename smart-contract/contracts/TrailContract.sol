// SPDX-License-Identifier: MIT

pragma solidity >=0.4.16 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

/**
  * Trails Smart Contracrt 
  */
contract TrailContract {
    // Address which funded the Trail
    address public immutableIssuerAddress;

    address public governorAddress;
    address public controllerAddress;

    struct Trail {
        string immutableData;
        string recordData;
        uint32 stateIndex;
    }

    struct TrailMeta {
        uint created;
        uint updated;
        string[] trailType;
    }

    Trail public trail;
    TrailMeta public meta;

    TrailState public firstTrailState;
    TrailState public lastTrailState;

    struct TrailState {
        bytes32 state;
        uint blockNumber;
    }

    modifier onlyGovernor {
        require(msg.sender == governorAddress, "Only the Trail Governor can call this function");
        _;
    }

    modifier onlyController {
        require(msg.sender == controllerAddress, "Only the Trail Controller can call this function");
        _;
    }

    event TrailRecordAdded(address indexed controller, uint32 stateIndex, bytes32 indexed stateHash);

    // Constructor is a special function which runs automatically on deployment.
    constructor(address governor, address controller, string memory immutableData, string memory recordData, string memory trailType) {
        immutableIssuerAddress = msg.sender;

        governorAddress = governor;
        controllerAddress = controller;

        meta.trailType.push("TRAIL:1.0");
        bytes memory trailTypeBytes = bytes(trailType);
        if (trailTypeBytes.length > 0) {
            meta.trailType.push(trailType);
        }
        
        trail.stateIndex = 0;

        trail.immutableData = immutableData;
        trail.recordData = recordData;

        meta.created = block.timestamp;
        meta.updated = block.timestamp;

        lastTrailState = TrailState(calculateLastState(), block.number);
        firstTrailState = lastTrailState;

        emit TrailRecordAdded(controllerAddress, trail.stateIndex, lastTrailState.state);
    }

    /**
     *.  Last record of a Trail.
     */
    function lastRecord() external view returns(string memory) {
        return trail.recordData;
    }

    /** 
     *. Immutable record of a Trail.
     */
    function immutableRecord() external view returns(string memory) {
        return trail.immutableData;
    }

    function addRecord(string calldata recordData, bytes32 fromStateHash) external onlyController {
        if (lastTrailState.state != fromStateHash) {
            revert("Invalid state");
        }

        trail.recordData = recordData;
        trail.stateIndex = trail.stateIndex + 1;

        meta.updated = block.timestamp;

         lastTrailState = TrailState(calculateLastState(), block.number);

         emit TrailRecordAdded(controllerAddress, trail.stateIndex, lastTrailState.state);
    }

    function changeController(address newController) external onlyGovernor {
        controllerAddress = newController;
    }

    function changeGovernor(address newGovernor) external onlyGovernor {
        governorAddress = newGovernor;
    }
    
    function trailID() external view returns (string memory) {
        return calculateTrailID();
    }

    function calculateTrailID() internal view returns (string memory) {
        uint256 chainID = getChainID();

        return string.concat("urn:trail:iota:evm:", Strings.toString(chainID),":", Strings.toHexString(address(this)));
    }


    function getChainID() internal view returns (uint256) {
       return block.chainid;
    }

    function calculateLastState() internal view returns(bytes32) {
        return keccak256(abi.encode(address(this), controllerAddress, trail.recordData, trail.stateIndex));
    }
}
