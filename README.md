# DAO Governance System Tutorial

Welcome! I'm excited to walk you through our DAO (Decentralized Autonomous Organization) governance system. This document explains how everything works in plain language, so don't worry if you're new to blockchain technology—I'll break it all down step by step.

![Cover](./images/1.jpg)

![Tally Home](./images/screenshot_tally2.png)

## Read More

1. 📢 **LinkedIn announcement**: https://www.linkedin.com/posts/carlos-baeza-negroni_dao-web3-ethereum-activity-7437461284335509504-b4AJ
2. 📖 **Read the article directly on LinkedIn**: https://www.linkedin.com/pulse/building-decentralized-autonomous-organization-guide-baeza-negroni-nb6ve
3. 🐦 **X/Twitter Announcement**: https://x.com/cjbaezilla/status/2031698466359939418
4. 🔍 **Browse the source**:
   [article.md](./article.md)

## Our Token: DAOToken

Let me start by introducing our governance token, which is called DAOToken with the symbol DAOT. This isn't just any token; it's designed specifically to let our community make decisions together. I've built it with several important features that I'll explain.

### Token Basics

When you hold DAOTokens, you're not just holding a digital asset—you're holding voting power. The more tokens you have, the more influence you have in governance decisions. But it's important to understand that your voting power is determined by your token balance at specific moments in time, not necessarily your current balance. This prevents people from gaming the system by buying votes right before a proposal passes.

The token has a fixed name "DAOToken" and symbol "DAOT" that you'll see in wallets and blockchain explorers. These are just human-readable identifiers so everyone knows what they're looking at.

### Token Supply and Decimals

You might wonder how we handle fractions of tokens. Since blockchains work with whole numbers, we use something called "decimals" to represent smaller amounts. Our token uses 18 decimals, which is the same standard used by Ethereum and most ERC-20 tokens. This means that when you see a balance of 1 DAOT in your wallet, the actual number stored on the blockchain is 1 followed by 18 zeros (1,000,000,000,000,000,000). This system lets us represent any fraction of a token while keeping everything mathematically precise.

By default, 18 decimals is what I use because it's the most widely adopted standard, making it compatible with wallets, exchanges, and all kinds of blockchain tools. If someone tells you they're sending you 0.5 DAOT, they're actually sending 500,000,000,000,000,000 in raw units.

### What Makes This Token Special for Governance

Our DAOToken extends several standard ERC-20 features to make it perfect for governance. First, it includes ERC20Votes, which automatically tracks historical token balances. This is crucial because it means your voting power is based on how many tokens you had when a proposal became active, not when you vote. If you bought tokens right before voting, your vote still reflects the earlier snapshot. This protects against last-minute manipulations.

Second, I've included ERC20Burnable, which allows token holders to permanently destroy their tokens if they choose. This can be useful for reducing supply or for certain governance mechanisms where burning tokens might be part of a proposal.

Third, the token has ERC20Pausable functionality, meaning the contract owner can temporarily pause all token transfers in emergency situations. This is a safety feature that I can activate if there's a security vulnerability or an exploit in progress. It's like hitting the emergency brake—transfers stop temporarily until the issue is resolved and tokens are unpaused.

Fourth, I've included ERC20Permit, which lets users approve token spending using signed messages rather than on-chain transactions. This saves gas fees and makes interactions with decentralized applications more efficient. Instead of making an on-chain transaction to approve a spender, you can sign a message off-chain that the application can use.

Fifth, the token implements ERC1363, which allows tokens to be used directly in contract calls without needing to first approve and then call. It's a convenience feature that makes the token more versatile.

Sixth, I've added Ownable, which gives special administrative privileges to the address that deploys the contract. The owner can pause/unpause transfers and mint new tokens. This is important for initial distribution and emergency management.

### Token Distribution and Minting

When the token contract is deployed, I specify an initial owner address. This owner has the power to mint new tokens to any address using the `mint` function. This allows for flexible supply management—tokens can be minted for team allocations, community rewards, treasury funding, or any other purpose the governance decides. The owner can also burn their own tokens, but note that burning is generally available to any token holder through the burnable feature.

### How Voting Power Works

Our token tracks voting power using something called "checkpoints." Every time token balances change (through transfers, minting, or burning), a checkpoint is recorded at the current block number or timestamp. When a governance proposal becomes active, the Governor contract queries these checkpoints to determine how many tokens each address held at that specific moment. Those snapshot values become the voting power used throughout that proposal's lifecycle. This means even if you transfer your tokens after a proposal starts, your voting power for that proposal remains locked to the snapshot value.

The token can operate using either block numbers or timestamps, depending on how the Governor is configured. By default, it uses block numbers, where each checkpoint is associated with a specific block height. This is the traditional approach and works well on Ethereum mainnet where block times are relatively consistent at around 12 seconds. However, I've designed it to support timestamp-based operation as well, which can be better for layer 2 networks where block production might be less predictable.

## Our Governor: DAOGovernor

Now let me explain the Governor contract, which is the brain of our governance system. This is where proposals are created, votes are cast, and decisions get executed. I've configured it with specific parameters that determine how our community makes decisions.

### Governor Construction

The DAOGovernor contract inherits from multiple modules, each providing a specific piece of functionality. When I deploy it, I pass two important parameters: the address of our token contract (DAOToken) and the address of a TimelockController contract. Let me explain what each part does.

First, the token address tells the Governor where to find voting power information. The Governor queries our DAOToken contract to check how many tokens each voter holds at the relevant snapshot times.

Second, the TimelockController address points to a separate contract that adds a waiting period before proposals can be executed. This is a crucial safety feature that gives the community time to exit the DAO if they disagree with a decision before it becomes active.

### Time-Based Parameters

Our Governor uses three primary time parameters that control the proposal lifecycle. I've set them using days and weeks, but under the hood they're stored as either block counts or timestamp seconds depending on the clock mode.

The first parameter is `votingDelay`, which I set to 1 day. This means there's a 24-hour waiting period between when a proposal is first created and when voting actually begins. This delay serves an important purpose: it gives token holders time to review the proposal, discuss it with the community, and make informed decisions. It also prevents someone from creating a surprise proposal and immediately forcing a vote before anyone has had time to react. During this delay period, the snapshot of voting power gets recorded, freezing everyone's voting power based on their token holdings at that moment.

The second parameter is `votingPeriod`, which I set to 1 week. This is the window of time during which token holders can cast their votes on an active proposal. For one full week after voting begins, delegates can vote For, Against, or Abstain. This week-long period ensures that people in different time zones, with different schedules, and with different levels of involvement all have adequate opportunity to participate. It prevents rushed decisions and gives time for community discussion and debate.

Both of these time parameters use the same clock mechanism as the token—either block numbers or timestamps. If we're using block numbers (the default), then "1 day" means enough blocks to roughly equal 24 hours of blockchain time. On Ethereum mainnet with ~12 second block times, that's approximately 7,200 blocks. If we're using timestamps, then it's exactly 86,400 seconds. The important thing is that both the token and governor agree on how to measure time, so they stay synchronized.

### Proposal Threshold

Our Governor has a `proposalThreshold` parameter that I've set to 0. This parameter determines how much voting power you need to create a proposal. A threshold of 0 means anyone, even someone with a single token, can create a proposal. In practice, most governance systems use some threshold to prevent spam proposals from people with minimal stake in the system. I set it to 0 for maximum openness, but if we find we're getting too many low-quality proposals, we could raise this through governance to require, say, 100,000 tokens to create a proposal.

When a threshold is set, any address that wants to create a proposal must have at least that many tokens (based on the snapshot) at the time they call the propose function. This acts as a spam filter while still allowing meaningful participation from anyone with a reasonable stake.

### Quorum and Voting

Our Governor uses GovernorVotesQuorumFraction with a value of 4, which means quorum is set at 4% of the total token supply. Quorum is the minimum participation required for a proposal to be considered valid. In simpler terms, at least 4% of all DAOT tokens need to participate in the vote (by voting For, Against, or Abstaining) for the results to count. This ensures that proposals can't pass with just a handful of voters—it needs broad community participation.

The 4% value is common in many DAOs because it balances accessibility with legitimacy. If quorum is too high, it becomes very difficult for proposals to pass because too many people need to vote. If it's too low, a small group could make decisions for everyone. Four percent is generally considered a reasonable minimum that encourages participation while not being impossibly high.

When calculating quorum, the Governor looks at the total token supply at the checkpoint established when the voting delay ends. It then calculates 4% of that number. The sum of For votes, Against votes, and Abstain votes must meet or exceed that threshold for the proposal to have quorum.

For the actual vote counting, we use GovernorCountingSimple, which offers three options: For, Against, and Abstain. The proposal passes if the number of For votes exceeds the number of Against votes, AND quorum has been reached. Abstain votes count toward quorum but don't affect the For vs Against comparison. This design gives voters the ability to participate in the quorum calculation while explicitly choosing not to take a position on the proposal.

### Timelock Mechanics

Our Governor is integrated with a TimelockController contract, which adds a crucial delay between when a proposal passes and when it can be executed. This is one of the most important security features in our governance system. I set the TimelockController with specific parameters that control this delay.

When a proposal passes voting, it doesn't execute immediately. Instead, it gets queued in the Timelock contract and must wait for a predetermined delay period before anyone can execute it. Currently, I've configured the Timelock with a delay that matches our governance philosophy—but I'll explain the mechanics generally.

The typical setup has these Timelock parameters: minimum delay (how long proposals must wait), maximum delay (upper bound), and grace period (time after delay when anyone can execute). The delay is measured in seconds (timestamp mode) or blocks, consistent with our clock mode.

During the timelock period, anyone in the community can see exactly what the proposal will do once executed. This transparency is powerful: if token holders disagree with a passing proposal, they have this delay period to exit the DAO by selling their tokens or moving to a different chain. They're not forced to stay locked in. This exit ability is a fundamental protection that makes open participation safer.

The Timelock contract also handles the actual execution. After the delay period has elapsed, anyone can call the `execute` function to trigger all the proposal's actions. The Timelock must be the one holding any funds, ownership rights, or administrative permissions in our system. This means proposals that move treasury funds or change contract configurations must be directed at the Timelock, which then executes them. The Governor itself holds no assets—it's purely an decision-making mechanism.

The Timelock uses AccessControl roles, which I've carefully configured:
- The Governor gets the "proposer" role, allowing it to queue proposals into the Timelock
- The zero address (address 0x000...000) gets the "executor" role, allowing anyone to execute queued proposals after the delay
- The Timelock itself gets the "admin" role, giving it control over role assignments but preventing anyone else from changing the configuration without going through governance

### Proposal Lifecycle

Now let me walk you through the complete journey of a typical proposal:

It starts when someone creates a proposal. The proposer must gather enough voting power to meet the threshold (if any), then call the `propose` function on the Governor, specifying a list of targets (contract addresses to interact with), values (ETH amounts to send), calldata (function calls to execute), and a human-readable description. The Governor validates that the proposer has sufficient threshold, then records the proposal with a unique ID calculated as a hash of all these parameters.

Once created, the proposal enters the "pending" state during the votingDelay period. During this time, nothing happens yet except that the token snapshot gets recorded, freezing everyone's voting power as it stands at the end of this period.

After the votingDelay ends, the proposal becomes "active" and the votingPeriod begins. Now token holders can cast their votes. Voting power used is determined by the snapshot taken at the end of votingDelay. Delegates can vote using `castVote`, `castVoteBySig` (off-chain signatures), or other voting functions. Each token unit equals one vote, so your voting power equals your token balance at the snapshot.

When the votingPeriod ends, the Governor tallies the votes. If quorum (4% of total supply) was achieved AND the For votes exceed Against votes, the proposal is "succeeded." If quorum wasn't met or Against votes are greater, the proposal is "defeated."

For succeeded proposals, they must now be queued into the Timelock. The Governor (which has proposer role) calls the Timelock's `queue` function, which schedules the proposal's actions to become executable after the timelock delay. During this delay, the proposal is in the "queued" state.

After the timelock delay expires, the proposal moves to "ready" state, meaning it can be executed. Anyone can call the Governor's `execute` function (or the Timelock's execute directly), which will carry out all the specified actions: calling functions on target contracts, transferring ETH, etc. Once executed, the proposal reaches "executed" final state.

If at any point a proposal gets canceled (by the Governor in certain circumstances) or expires without meeting quorum, it reaches a failed or canceled terminal state.

### Important Notes About Execution

It's worth understanding that the Governor doesn't store the full proposal data on-chain to save gas. Instead, it computes a proposal ID as a hash of the parameters and stores minimal state. The full target addresses, values, calldata arrays, and description hash must be provided again when queuing and executing. These can always be retrieved from the events emitted during proposal creation, so frontends and indexing services can reconstruct the complete proposal details.

Also, the proposal ID itself is not a sequential number but rather a hash (specifically keccak256 hash of the proposal parameters). This design reduces storage needs and keeps data off-chain where it belongs, while still providing a unique identifier.

### Timestamp vs Block Number Operation

Our Governor automatically detects whether the token uses block numbers or timestamps. This detection happens through the ERC6372 interface that our token implements. If the token's `clock()` function returns block numbers, then all time parameters (votingDelay, votingPeriod) are interpreted as block counts. If the token returns timestamps, they're interpreted as seconds.

I've written the token to default to block numbers, which is the traditional and most compatible approach. But we have the option to switch to timestamps if desired. The main advantage of timestamps is that they're less variable than block times—block production can be inconsistent depending on network conditions, whereas timestamps are precise and predictable. Timestamps also aren't affected by blockchain upgrades that change block time parameters.

The tradeoff is that all governance tooling must support the ERC6372 standard to correctly interpret timestamps. Some frontends and indexers might not yet fully support timestamp-based governance, so they could show incorrect deadlines. The on-chain logic itself works perfectly fine regardless; it's just the external tools that need to be updated.

If we ever want to switch to timestamp mode, we would need to update both the token contract (override `clock()` and `CLOCK_MODE()`) and ensure the Governor version we're using supports it (any version 4.9 or above does). The Governor automatically adapts, so no changes needed there.

### Interaction with Tally and Other UIs

![DAO Creation Tally](./images/screenshot_tally1.png)

Our Governor is fully compatible with Tally, which is a popular governance interface. Token holders can use Tally's website to view proposals, delegate their voting power to others, cast votes, and execute passed proposals without needing to interact directly with the contracts. Tally automatically detects our Governor's parameters and displays voting periods, quorum requirements, and other information correctly.

You can interact with our DAO governance system using Tally:
- [DAO Home Page](https://www.tally.xyz/gov/dao-tutorial)
- [Proposals Page](https://www.tally.xyz/gov/dao-tutorial/proposals)
- [Example Test Proposal](https://www.tally.xyz/gov/dao-tutorial/proposal/55668039265640376542534466764247011469981353354712600333202966157762151218731)

When using Tally or similar interfaces, you typically connect your wallet, see the current active proposals, and either vote directly or delegate to someone else whose judgment you trust. Delegation is important because not everyone has time to vote on every proposal; through delegation, you can assign your voting power to representatives who will vote on your behalf according to their own analysis.

## Access Control and Security

I've designed the system with clear separation of responsibilities:

The DAOToken's owner can mint new tokens and pause transfers. This gives flexibility for supply adjustments and emergency response, but it's centralized power. In a fully decentralized system, these powers might be transferred to the Timelock or to governance itself. For now, I retain ownership for bootstrapping and safety.

![DAO Creation Proposal Tally](./images/screenshot_tally4.png)

The Timelock holds all contract permissions—it should be the keeper of treasury funds, ownership roles, and any other sensitive permissions. This ensures that no single entity can unilaterally move funds or change the system; all changes must flow through the governance proposal process and then wait out the timelock.

The Governor itself has no special permissions—it merely proposes and executes, but only through the Timelock. The Governor can only call functions that it has been explicitly granted permission to call on the Timelock.

![DAO Creation Proposal Finish Tally](./images/screenshot_tally5.png)

There's also a potential for delegation of governance power. Token holders can delegate their voting power to others using the `delegate` function on the token. The delegate doesn't gain any access to the tokens themselves—they can't transfer or spend them—they only gain the ability to cast votes with that power in governance proposals. This is a read-only representation of voting weight.

![DAO Creation Addresses Tally](./images/screenshot_tally3.png)

## Future Considerations

This system is designed to be flexible and upgradeable through governance. If we find that our parameters need adjustment—say we want longer voting periods, higher quorum, or different timelock delays—we can create a governance proposal to change these values. Many of these parameters are defined in the GovernorSettings extension and can be updated if the contract is designed with setter functions that are themselves governable.

The modular architecture means I can easily add new features or swap out components. For example, if we want different voting mechanisms like quadratic voting or conviction voting, we could create new modules that replace GovernorCountingSimple. If we want to integrate with different token standards or add vesting schedules, the token itself can be extended.

I'm excited about the possibilities this system enables for our community to govern itself in a transparent, inclusive, and secure way. All proposals are public on the blockchain, all votes are recorded permanently, and all execution is automatic and trustless. No one can secretly change the rules or spend treasury funds without going through the established process.

If you have questions or suggestions about how we can improve our governance system, please join our community discussions. Governance is a collective effort, and I'm committed to making this system serve our community's needs as we evolve together.

## Verification and Testing

I've put a lot of care into making sure our DAO governance system works reliably and exactly as intended. Testing isn't just a box to check for me—it's how I build confidence that every part of the system functions properly and that token holders can trust the governance process. I want to walk you through what I've tested and how it all works, in plain language.

First, I want to be transparent about what I'm testing and why each piece matters. I've created automated tests that simulate real-world scenarios, checking everything from basic contract deployment to the complete lifecycle of a governance proposal. These tests run in a controlled environment, allowing me to verify that all the moving parts work together seamlessly without risking actual funds.

Let me tell you about the contract deployment tests. When I deploy a DAO, three main contracts come to life: our DAOToken, the TimelockController, and the DAOGovernor. I've written tests that verify each contract gets deployed with the correct settings. For the token, I check that its name appears as "DAOToken" and its symbol shows as "DAOT" just as we expect. I also make sure the token uses the right clock mode, which determines how time is measured on the blockchain. For the governor, I confirm that the voting delay is set to one day, the voting period lasts one week, and the quorum requirement sits at four percent of the total token supply. Getting these initial parameters right is essential because they define how our governance operates from day one.

Next, I've thoroughly tested the governor configuration. This means I verify that the governor understands and enforces all the rules we've set. I check that the voting delay of one day creates the proper waiting period between proposal creation and when voting begins. I confirm that the voting period of one week gives community members adequate time to cast their votes. And I make sure the quorum of four percent accurately calculates the minimum participation needed for a proposal to be valid. These parameters are the heartbeat of our governance system, and my tests ensure they're all functioning exactly as designed.

The most extensive testing I've done covers the complete governance proposal lifecycle. This is where I simulate what happens when someone actually proposes a change and the community votes on it. I create a proposal that would mint new tokens to a specific address—a realistic governance action that could happen in our DAO. I then walk through every single step: I wait for the voting delay to pass, I cast votes from multiple token holders, I verify that enough participation occurred to meet quorum, I queue the proposal into the timelock, wait for the timelock period to expire, and finally execute the proposal. At the end, I check that the tokens were actually minted to the intended recipient. This full-cycle test gives me confidence that the entire process works from start to finish, with no missing pieces or unexpected failures.

I've also tested the emergency pause functionality because safety is paramount. Our token includes a critical security feature that allows the contract owner to pause all token transfers during emergencies. In my tests, I verify that the owner can successfully activate the pause, that transfers get blocked while paused, and that the pause can be lifted when the emergency has passed. This feature acts as an emergency brake—if there's ever a security vulnerability or an exploit in progress, we can temporarily halt token movements to protect the community. My tests make sure this safety mechanism works reliably.

Running these tests is straightforward. I use Hardhat, a popular development environment for Ethereum projects. To execute the test suite on your own machine, simply open your terminal in the project directory and type `npx hardhat test`. Hardhat will compile the contracts, set up a local blockchain environment, and run through all the test scenarios I've written. You'll see output showing each test and whether it passed or failed. If all tests pass, that's a good sign that the system is working correctly in the testing environment.

I should mention that while my tests cover the core functionality, they're not exhaustive security audits. I've focused on the happy paths and the most common workflows, plus a few edge cases. There may be scenarios I haven't thought to test, and there could be subtle vulnerabilities that only professional auditors would catch. That's why I include the disclaimer about this being educational—I want to be clear about what I've validated and what remains untested.

If you're new to blockchain development, you might wonder why we need all these tests. The reason is simple: once contracts are deployed on a real blockchain, we can't easily fix them. Transactions are permanent, and bugs can lead to lost funds or broken governance. Testing lets us find and fix problems while we're still in development, before any real value is at stake. It's like practicing a safety drill—we hope we never need it, but we're glad we did it if something goes wrong.

I'm proud of the test coverage I've built because it demonstrates that the system follows a logical, predictable flow. Token holders can have confidence that when they vote on a proposal, the process will work as intended, their votes will be counted correctly, and passed proposals will execute properly after the timelock period. That predictability is essential for building trust in decentralized governance.

If you'd like to explore the tests yourself, they're located in the `test/DAOGovernance.test.js` file. I've written them using JavaScript and Hardhat's testing framework. The tests are organized into descriptive sections, each focusing on a specific aspect of the system. Feel free to read through them to understand exactly what scenarios I'm validating and how the tests interact with the contracts.

| Test Category | Description | Status |
| :--- | :--- | :--- |
| **Contract Deployment** | Verifies that `DAOToken`, `TimelockController`, and `DAOGovernor` are deployed with the correct initial parameters (name, symbol, clock mode). | ✅ Passed |
| **Governor Configuration** | Validates that voting delay (1 day), voting period (1 week), and quorum (4%) are correctly set in the governor contract. | ✅ Passed |
| **Governance Lifecycle** | Simulates a full proposal flow: creating a proposal (to mint tokens), casting votes, reaching quorum, queueing in the timelock, and final execution. | ✅ Passed |
| **Security & Safety** | Confirms that the `onlyOwner` functions (like `pause` and `unpause`) work correctly and prevent unauthorized transfers during an emergency. | ✅ Passed |

To run these tests locally, you can use the following command:
```bash
npx hardhat test
```
## Sepolia Deployment & Verification

I have successfully deployed and verified the DAO governance system on the **Sepolia Testnet**. This deployment follows the architectural patterns described above, ensuring a secure and decentralized governance flow.

### 📍 Deployment Addresses

| Contract | Address | Explorer Link | Creation Transaction |
| :--- | :--- | :--- | :--- |
| **DAOToken** | `0x66CdB0c60E5b40290cD16a00916Be34453939a48` | [Etherscan](https://sepolia.etherscan.io/address/0x66CdB0c60E5b40290cD16a00916Be34453939a48#code) | [0xe24b...1405](https://sepolia.etherscan.io/tx/0xe24b012e00cd82ea05c3dae0628c89caab7e0767ec77081ea8c9ecb2d6f31405) |
| **TimelockController** | `0x3Df2d32fe95EB42daEb4Dc81c1981C52b5aF25D2` | [Etherscan](https://sepolia.etherscan.io/address/0x3Df2d32fe95EB42daEb4Dc81c1981C52b5aF25D2#code) | [0x04c2...5e8b](https://sepolia.etherscan.io/tx/0x04c222cf8ed585cd346008eb9d36f4918eca985737e63555bb0ef1daae955e8b) |
| **DAOGovernor** | `0xF34Bf4a2e4cc6819d025410625775e16ba4728a0` | [Etherscan](https://sepolia.etherscan.io/address/0xF34Bf4a2e4cc6819d025410625775e16ba4728a0#code) | [0x8cd2...4cfa](https://sepolia.etherscan.io/tx/0x8cd2f0d22ba59c5e41ad53cf5b463f71a1736bdb533470a83749f20907a2c4fa) |

---

### ⚙️ Constructor Configuration Parameters

The following parameters were used during the deployment to ensure the governance rules are enforced as intended:

| Contract | Parameter | Value | Purpose |
| :--- | :--- | :--- | :--- |
| **DAOToken** | `initialOwner` | `Deployer` | Initial administrative rights (transferred to Timelock after deployment). |
| **TimelockController** | `minDelay` | `172800` (2 days) | Minimum "cool-off" period before a passed proposal can be executed. |
| **TimelockController** | `proposers` | `[]` | No initial proposers (added via `grantRole` after deployment). |
| **TimelockController** | `executors` | `["0x0...0"]` | Open execution: anyone can trigger a proposal after the timelock. |
| **TimelockController** | `admin` | `Deployer` | Initial role admin (renounced/managed by Timelock eventually). |
| **DAOGovernor** | `_token` | `0x66Cd...9a48` | Connects the Governor to our voting token. |
| **DAOGovernor** | `_timelock` | `0x3Df2...25D2` | Connects the Governor to the execution time-lock. |

---

### 🔐 Roles & Permission Handover

To achieve a truly decentralized state, I performed the following automated setup steps immediately after deployment:

1.  **Governor as Proposer**: The `DAOGovernor` contract was granted the `PROPOSER_ROLE` on the `TimelockController`. This ensures only passed governance proposals can enter the queue. ([Transaction](https://sepolia.etherscan.io/tx/0xea56688b4a2acac4d5a2b847d4c46750d7187d91332ee3a78027827b75dbbcc1))
2.  **Public Execution**: The Zero Address (`0x0...0`) was granted the `EXECUTOR_ROLE`, allowing any community member to execute a proposal once its timelock expires. ([Transaction](https://sepolia.etherscan.io/tx/0xabd279f2cabad804d51c7be6d05f7bcf7aaf75b08e607a168c2b4d449970b799))
3.  **Governance Ownership**: Ownership of the `DAOToken` was transferred to the `TimelockController`. This means that administrative functions like `mint`, `pause`, and `unpause` can **only** be triggered by an official governance vote. ([Transaction](https://sepolia.etherscan.io/tx/0x27a579830d0f456f2a209552b78436f1841d813b1654d9b245227b6823bacc00))

---

### 🚀 How to Verify the Verification

All contracts are fully verified on Etherscan. This means you can:
- Read the **Source Code** directly on the blockchain.
- Review the **ABI** for integration.
- Interact with the contracts using the **"Write Contract"** feature on Etherscan (e.g., to delegate or vote).

To run a deployment yourself, you can use the Hardhat Ignition module I developed:
```bash
npx hardhat ignition deploy ./ignition/modules/DAOModule.js --network sepolia --verify
```

---

## Disclaimer

I want to be completely clear: **all code in this repository is for tutorial and educational purposes only**. This is meant to help you understand how DAO governance systems work conceptually. The code has not been audited, may contain security vulnerabilities, and should not be used in production environments with real assets.

If you're considering deploying a governance system for actual use, please:
- Work with professional security auditors
- Use well-audited, battle-tested contracts from reputable sources
- Start with small amounts and thoroughly test everything
- Consider your specific requirements carefully
- **Never use .env files in production environments** - use proper secret management solutions like HashiCorp Vault, AWS Secrets Manager, Azure Key Vault, or dedicated hardware security modules (HSMs)

Learning is the first step, but production deployment requires much more rigorous engineering and security practices than what we can demonstrate in a tutorial setting.