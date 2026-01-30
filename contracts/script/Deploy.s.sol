// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/PLSToken.sol";
import "../src/PrivateStaking.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address stakingAsset = vm.envAddress("STAKING_ASSET");
        
        vm.startBroadcast(deployerPrivateKey);

        // Deploy PLS Token
        PLSToken plsToken = new PLSToken();
        console.log("PLSToken deployed at:", address(plsToken));

        // Deploy PrivateStaking
        PrivateStaking privateStaking = new PrivateStaking(
            stakingAsset,
            address(plsToken)
        );
        console.log("PrivateStaking deployed at:", address(privateStaking));

        // Set staking contract on PLS token
        plsToken.setStakingContract(address(privateStaking));
        console.log("Staking contract set on PLSToken");

        vm.stopBroadcast();
    }
}
