// SPDX-License-Identifier: MIT

pragma solidity >=0.4.16 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

/**
  * Trails Smart Contracrt 
  */
contract TraiContract {
    address public immutableIssuerAddress;

    address public governorAddress;
    address public controllerAddress;

    string[] public trailType;

    struct Trail {
        string immutableData;
        string recordData;
        uint32 stateIndex;
        uint created;
        uint updated;
    }

    Trail public trail;

    bytes32 public lastTrailState;

    struct TrailState {
        bytes32 state;
        uint blockNumber;
    }

    TrailState[] trailStates;

    modifier onlyGovernor {
        require(msg.sender == governorAddress, "Only the Trail Governor can call this function");
        _;
    }

    modifier onlyController {
        require(msg.sender == controllerAddress, "Only the Trail Controller can call this function");
        _;
    }

    // Constructor is a special function which runs automatically on deployment.
    constructor(address governor, address controller, string memory immutableData, string memory recordData) {
        immutableIssuerAddress = msg.sender;

        governorAddress = governor;
        controllerAddress = controller;
        trailType.push("TRAIL:1.0");
        trail.stateIndex = 0;

        trail.immutableData = immutableData;
        trail.recordData = recordData;

        trail.created = block.timestamp;
        trail.updated = block.timestamp;

        lastTrailState = calculateLastState();
        trailStates.push(TrailState(lastTrailState, block.number));
    }

    /**
     *. Returns the Trail State at a particular state Index.
     */
    function trailState(uint32 _stateIndex) external view returns (TrailState memory) {
        if (_stateIndex > trail.stateIndex) {
            revert("Invalid state index");
        }
        return trailStates[_stateIndex];
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

    function addRecord(string calldata recordData, bytes32 fromState) external onlyController {
        if (lastTrailState != fromState) {
            revert("Invalid state");
        }

        trail.recordData = recordData;
        trail.stateIndex = trail.stateIndex + 1;

        trail.updated = block.timestamp;

         lastTrailState = calculateLastState();
         trailStates.push(TrailState(lastTrailState, block.number));
    }

    function changeController(address newController) external onlyGovernor {
        controllerAddress = newController;
    }

    function changeGovernor(address newGovernor) external onlyGovernor {
        governorAddress = newGovernor;
    }
    
    function trailID() external view returns (string memory) {
        uint256 chainID = getChainID();

        return string.concat("urn:trail:iota:evm:", Strings.toString(chainID),":", Strings.toHexString(address(this)));
    }

    function getChainID() internal view returns (uint256) {
       return block.chainid;
    }

    function calculateLastState() internal view returns(bytes32) {
        return keccak256(abi.encode(address(this), trail.recordData, trail.stateIndex));
    }
}
