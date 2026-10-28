// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StachOFT — canonical wrapped STACH on a non-home chain
 * @notice Minted only by the LayerZero endpoint when STACH is locked in the
 *         Base adapter; burned to unlock back home. Total supply across all
 *         chains stays 42,000,000.
 */
contract StachOFT is OFT {
    constructor(
        address lzEndpoint,
        address delegate
    ) OFT("Stakechain", "STACH", lzEndpoint, delegate) Ownable(delegate) {}
}
