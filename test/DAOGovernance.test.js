const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("DAO Governance System", function () {
    let daoToken;
    let daoGovernor;
    let timelock;
    let owner;
    let voter1;
    let voter2;

    const VOTING_DELAY = 86400; // 1 day in seconds
    const VOTING_PERIOD = 604800; // 1 week in seconds
    const QUORUM_PERCENTAGE = 4;
    const TIMELOCK_MIN_DELAY = 172800; // 2 days in seconds

    beforeEach(async function () {
        [owner, voter1, voter2] = await ethers.getSigners();

        // 1. Deploy DAOToken
        const DAOToken = await ethers.getContractFactory("DAOToken");
        daoToken = await DAOToken.deploy(owner.address);
        await daoToken.waitForDeployment();

        // 2. Deploy TimelockController
        const Timelock = await ethers.getContractFactory("TimelockController");
        timelock = await Timelock.deploy(
            TIMELOCK_MIN_DELAY,
            [],
            [ethers.ZeroAddress],
            owner.address
        );
        await timelock.waitForDeployment();

        // 3. Deploy DAOGovernor
        const DAOGovernor = await ethers.getContractFactory("DAOGovernor");
        daoGovernor = await DAOGovernor.deploy(await daoToken.getAddress(), await timelock.getAddress());
        await daoGovernor.waitForDeployment();

        // 4. Setup Roles in Timelock
        const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
        const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();

        await timelock.grantRole(PROPOSER_ROLE, await daoGovernor.getAddress());
        await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);

        // 5. Mint tokens and delegate
        await daoToken.mint(voter1.address, ethers.parseEther("100000"));
        await daoToken.mint(voter2.address, ethers.parseEther("50000"));

        await daoToken.connect(voter1).delegate(voter1.address);
        await daoToken.connect(voter2).delegate(voter2.address);
    });

    describe("Deployment", function () {
        it("Should have correct token settings", async function () {
            expect(await daoToken.name()).to.equal("DAOToken");
            expect(await daoToken.symbol()).to.equal("DAOT");
            expect(await daoToken.CLOCK_MODE()).to.equal("mode=timestamp");
        });

        it("Should have correct governor settings", async function () {
            expect(await daoGovernor.name()).to.equal("DAOGovernor");
            expect(await daoGovernor.votingDelay()).to.equal(BigInt(VOTING_DELAY));
            expect(await daoGovernor.votingPeriod()).to.equal(BigInt(VOTING_PERIOD));
            expect(await daoGovernor.quorumNumerator()).to.equal(BigInt(QUORUM_PERCENTAGE));
        });
    });

    describe("Governance Proposal Lifecycle", function () {
        it("Should successfully propose, vote, queue, and execute", async function () {
            const grantAmount = ethers.parseEther("1000");
            const transferCalldata = daoToken.interface.encodeFunctionData("mint", [voter1.address, grantAmount]);

            await daoToken.transferOwnership(await timelock.getAddress());

            const description = "Proposal #1: Give grant to voter1";
            const descriptionHash = ethers.id(description);

            const proposeTx = await daoGovernor.propose(
                [await daoToken.getAddress()],
                [0],
                [transferCalldata],
                description
            );

            const receipt = await proposeTx.wait();
            const event = receipt.logs.find(x => x.fragment && x.fragment.name === 'ProposalCreated');
            const proposalId = event.args[0];

            await time.increase(VOTING_DELAY + 1);

            await daoGovernor.connect(voter1).castVote(proposalId, 1);
            await daoGovernor.connect(voter2).castVote(proposalId, 1);

            await time.increase(VOTING_PERIOD + 1);

            await daoGovernor.queue(
                [await daoToken.getAddress()],
                [0],
                [transferCalldata],
                descriptionHash
            );

            await time.increase(TIMELOCK_MIN_DELAY + 1);

            const initialBalance = await daoToken.balanceOf(voter1.address);
            await daoGovernor.execute(
                [await daoToken.getAddress()],
                [0],
                [transferCalldata],
                descriptionHash
            );

            const finalBalance = await daoToken.balanceOf(voter1.address);
            expect(finalBalance).to.equal(initialBalance + grantAmount);
        });
    });

    describe("Emergency Pause", function () {
        it("Should allow owner to pause and unpause tokens", async function () {
            await daoToken.pause();
            expect(await daoToken.paused()).to.be.true;

            await expect(
                daoToken.connect(voter1).transfer(voter2.address, 100)
            ).to.be.revertedWithCustomError(daoToken, "EnforcedPause");

            await daoToken.unpause();
            expect(await daoToken.paused()).to.be.false;

            await daoToken.connect(voter1).transfer(voter2.address, 100);
        });
    });
});
