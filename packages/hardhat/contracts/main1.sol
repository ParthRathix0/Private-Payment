// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "./data_types1.sol";

contract Main_Contract{

    mapping (address => balance_data) private balances;
    address public burn_controller; // ConditionalBurner contract
    address public mint_controller; // ConditionalMinter contract
    address public owner;

    // Set of uint256 values
    mapping(uint256 => bool) private unminted_proofs;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyBurner() {
        require(msg.sender == burn_controller, "Not authorized");
        _;
    }

    modifier onlyMinter() {
        require(msg.sender == mint_controller, "Not authorized");
        _;        
    }

    function getbalance(address user) external view returns (balance_data memory) {
        return balances[user];
    }

    // internal updater used by both the owner and the controller path
    function _setbalance(address user, uint256 pub_balance, uint256 priv_balance) internal {
        balances[user] = balance_data(pub_balance, priv_balance);
    }

    function initialSetbalance(address user, uint256 pub_balance, uint256 priv_balance) external onlyOwner {
        _setbalance(user, pub_balance, priv_balance);
    }

    function burner(address user, uint256 curr_pub_balance, uint256 new_priv_balance, uint256 nullifier) external payable onlyBurner{
        _setbalance(user, curr_pub_balance, new_priv_balance);
        unminted_proofs[nullifier] = true;
    }

    function minter(address user, uint256 curr_pub_balance, uint256 new_priv_balance, uint256 nullifier) external payable onlyMinter{
        require(unminted_proofs[nullifier], "Proof already used");
        _setbalance(user, curr_pub_balance, new_priv_balance);
        unminted_proofs[nullifier] = false;
    }

    // Setter functions for controllers
    function setBurnController(address _controller) external onlyOwner {
        burn_controller = _controller;
    }

    function setMintController(address _controller) external onlyOwner {
        mint_controller = _controller;
    }

    // Transfer ownership to a new address
    function transferOwnership(address newOwner) external {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}