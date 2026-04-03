// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AgentWallLog {
    address public owner;

    event TransactionApproved(
        string indexed agentId,
        address to,
        uint256 value,
        string intent,
        uint256 timestamp
    );

    event TransactionBlocked(
        string indexed agentId,
        address to,
        uint256 value,
        string rule,
        string reason,
        uint256 timestamp
    );

    event AgentRevoked(
        string indexed agentId,
        string reason,
        uint256 timestamp
    );

    event FundsSwept(
        string indexed agentId,
        address to,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function logApproved(
        string calldata agentId,
        address to,
        uint256 value,
        string calldata intent
    ) external onlyOwner {
        emit TransactionApproved(agentId, to, value, intent, block.timestamp);
    }

    function logBlocked(
        string calldata agentId,
        address to,
        uint256 value,
        string calldata rule,
        string calldata reason
    ) external onlyOwner {
        emit TransactionBlocked(agentId, to, value, rule, reason, block.timestamp);
    }

    function logRevoked(
        string calldata agentId,
        string calldata reason
    ) external onlyOwner {
        emit AgentRevoked(agentId, reason, block.timestamp);
    }

    function logSwept(
        string calldata agentId,
        address to
    ) external onlyOwner {
        emit FundsSwept(agentId, to, block.timestamp);
    }
}
