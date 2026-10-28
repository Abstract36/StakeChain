// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import { OFTAdapter } from "@layerzerolabs/oft-evm/contracts/OFTAdapter.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StachOFTAdapter — the Base-side lockbox of the STACH bridge
 * @notice Locks existing STACH (0x82c5...7166) and instructs LayerZero to
 *         mint the same amount of canonical wrapped STACH on the target
 *         chain; unlocks on the way back. Exactly one adapter must exist
 *         for the token globally — this is it.
 */
contract StachOFTAdapter is OFTAdapter {
    constructor(
        address token,
        address lzEndpoint,
        address delegate
    ) OFTAdapter(token, lzEndpoint, delegate) Ownable(delegate) {}
}
