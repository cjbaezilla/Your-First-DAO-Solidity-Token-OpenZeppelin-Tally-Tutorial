const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const TIMELOCK_MIN_DELAY = 172800; // 2 days in seconds

module.exports = buildModule("DAOModule", (m) => {
    const initialOwner = m.getAccount(0);

    // 1. Deploy DAOToken
    const daoToken = m.contract("DAOToken", [initialOwner], { id: "DAOToken" });

    // 2. Deploy TimelockController
    const timelock = m.contract("TimelockController", [
        TIMELOCK_MIN_DELAY,
        [], // proposers
        ["0x0000000000000000000000000000000000000000"], // executors (anyone)
        initialOwner, // admin
    ], { id: "Timelock" });

    // 3. Deploy DAOGovernor
    const daoGovernor = m.contract("DAOGovernor", [daoToken, timelock], { id: "DAOGovernor" });

    // Roles and ownership
    const PROPOSER_ROLE = "0xb09aa5a07631b0496196ea19357df871407fb90ed499787a718cf233878b668d";
    const EXECUTOR_ROLE = "0xd8aa0f3194971a2a116679f7c2099f6939c8c4e4ade02bbee6cf41771966580f";

    m.call(timelock, "grantRole", [PROPOSER_ROLE, daoGovernor], { id: "GrantProposerRole" });
    m.call(timelock, "grantRole", [EXECUTOR_ROLE, "0x0000000000000000000000000000000000000000"], { id: "GrantExecutorRole" });

    m.call(daoToken, "transferOwnership", [timelock], { id: "TransferTokenOwnership" });

    return { daoToken, timelock, daoGovernor };
});
