# Project Description

**Deployed Frontend URL:** hermodoor-m3iyqmcye-nixs-projects-bd825b5c.vercel.app

**Solana Program ID:** FrFGfdqsY6pcKianF4rFFQXbmVJXFwrCGDJstfgondJz

## Project Overview

### Description
Hermodoor is a demo timing-based game deployed on Solana Devnet using Anchor.
The game simulates the atmosphere of the Samozbor world: players must “close the hermodoor” at just the right time during a dangerous event.

Each cycle (round) has three phases:

    Quiet – players can safely register and join.

    Alarm – sirens signal the approach of Samozbor; players must close the door. The longer they wait (before Cooldown starts), the more points they earn.

    Cooldown – once this phase begins, the event is over. Any attempt to close the door here is marked Late and yields no points.

The dApp showcases:

    PDA (Program Derived Address) usage for global state, cycles, and participants.

    Time-gated actions on-chain enforced with errors like RegistrationClosed or AlreadyClosed.

    A simple frontend where players connect a wallet, join a cycle, and try to earn points.

This project demonstrates a minimal but complete Solana dApp: smart contract + tests + frontend.

### Key Features

- Cycle-based events: [Authority initializes a Registry and spawns 3 demo Cycles with fixed time windows.]
- Join during Quiet: [Each user creates a Participant PDA with a nickname (up to 32 chars). Late joins after Alarm are rejected.]
- Close the Door during Alarm: [Earn points = seconds waited since Alarm started. Closing too early (Quiet) → Dismissed (0 points). Closing too late (Cooldown) → Late (0 points).]
- On-chain Enforcement: [Errors prevent double-closing, late registration, or overlong nicknames.]
- Frontend on Devnet: [Wallet connection (Phantom). Buttons: Join, Close Door, Refresh. Displays current status and points.]
  
### How to Use the dApp

1. **Connect Wallet**
2. **Choose a Cycle:** In the UI dropdown, select one of the demo rounds (0, 1, or 2).
3. **Join a Cycle (Quiet phase):** Enter a nickname (≤32 chars). Click Join. This creates your Participant PDA on-chain.
4. **Close the Door (Alarm phase):** Wait until the Alarm phase begins (sirens). Click Close Door during Alarm to earn points. Closing too early or too late yields no points.
5. **Refresh:** Click Refresh to see your updated status (Dismissed, Saved, Late) and points.

## Program Architecture
Hermodoor is an Anchor program that models short time-gated game cycles with three phases (Quiet → Alarm → Cooldown). All state is stored on-chain using PDAs:

    Registry — global game state and config (authority, start time t0, round counters).

    Cycle — per-round time windows (quiet/alarm/cooldown boundaries).

    Participant — per (cycle, user) record holding nickname, status, points.

### PDA Usage
PDAs guarantee unique, deterministic addresses without private keys and let the program own/write its state safely.

**PDAs Used:**
- Registry PDA: seeds: ["REGISTRY_SEED", authority]
    One registry per authority (admin). Stable anchor for all cycles.
- Cycle PDA: seeds: ["CYCLE_SEED", authority, round_u64_le]
    Deterministic address per round, easy to fetch/display by index.
- Participant PDA: seeds: ["PARTICIPANT_SEED", cycle_pubkey, user_pubkey]
    Uniquely identifies a user’s participation in a specific cycle.

### Program Instructions

**Instructions Implemented:**
- start_game (init registry): Creates the Registry PDA for the admin (authority). Sets t0 = now, next_round = 0, max_rounds (demo constant), stores authority.
- next_cycle (init next cycle): Uses registry.next_round to compute all timestamps: quiet_start, alarm_start, cooldown_start, cooldown_end. Creates the Cycle PDA for that round and increments next_round. Guard: next_round < max_rounds.
- join_cycle(nickname: String) (participant_registration): Allowed only during Quiet (now < alarm_start). Creates the user’s Participant PDA for the selected cycle with: status = Pending, points = 0, nickname (length-checked). Guard: nickname <= 32 (demo rule); rejects late joins with RegistrationClosed.
- close_door(finalize_participation): Finalizes a Participant (must be Pending). If now < alarm_start → Dismissed (0 pts). If alarm_start ≤ now < cooldown_start → Saved with points = (now - alarm_start) (optionally capped by the alarm window). Else → Late (0 pts). Guard: prevent double close (AlreadyClosed).

### Account Structure
[TODO: Describe your main account structures and their purposes]

```rust
// Global registry for the admin/authority.
#[account]
pub struct Registry {
    pub authority: Pubkey,   // admin who can create cycles
    pub t0: i64,             // anchor time reference (created at)
    pub next_round: u64,     // next round index to be created
    pub max_rounds: u64,     // demo cap (e.g., 3)
    pub bump: u8,            // PDA bump
}

// A single time-gated round.
#[account]
pub struct Cycle {
    pub authority: Pubkey,   // same authority as registry
    pub round: u64,          // round index
    pub quiet_start: i64,    // unix ts
    pub alarm_start: i64,    // unix ts
    pub cooldown_start: i64, // unix ts
    pub cooldown_end: i64,   // unix ts
    pub bump: u8,            // PDA bump
}

/ Player’s participation in a specific cycle.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub enum PartStatus {
    Pending,     // joined in Quiet, not yet finalized
    Dismissed,   // closed during Quiet (too early)
    Saved,       // closed during Alarm (scored)
    Late,        // tried after Cooldown (too late)
}

#[account]
pub struct Participant {
    pub user: Pubkey,        // player wallet
    pub cycle: Pubkey,       // cycle PDA
    pub nickname: String,    // <= 32 chars (demo)
    pub status: PartStatus,  // Pending/Dismissed/Saved/Late
    pub points: u64,         // earned during Alarm
    pub close_time: i64,     // when close_door was called
    pub bump: u8,            // PDA bump
}

```

## Testing

### Test Coverage
TypeScript tests (Mocha + ts-mocha) exercise mostly common instructions with happy and unhappy paths. Durations in the demo are short so tests can step through Quiet → Alarm → Cooldown within seconds. 

**Happy Path Tests:**
- Initialize Registry: startGame creates the Registry PDA for the authority and stores the correct authority.
- Create Cycles (0, 1, 2): nextCycle runs 3×; each Cycle PDA is created with correct round and phase timestamps.
- Join During Quiet: a player joins in Quiet; Participant PDA is created with status = Pending.
- Close During Alarm (earn points): after waiting until Alarm, closeDoor sets status = Saved and points > 0.

**Unhappy Path Tests:**
- Double Initialize Registry: a second startGame fails (PDA already initialized).
- Round Limit Exceeded: attempting a 4th nextCycle (when max_rounds = 3) fails.
- Late Join After Alarm: joinCycle after Alarm fails with RegistrationClosed.
- Nickname Too Long: joinCycle with nickname > 32 bytes fails with NicknameTooLong.
- Double Close: calling closeDoor twice fails with AlreadyClosed.

### Running Tests
```bash
# from the Anchor workspace root
cd anchor_project

# run the full test suite against the local validator
anchor test
```

### Additional Notes for Evaluators

In the lore of the demo, players are portrayed as scientists studying the dangerous phenomenon of Samozbor. To collect valuable data, they must keep the hermodoor open as long as possible during the Alarm phase. This is risky:

    - If they close too early (during Quiet), their research is dismissed and they gain no points.

    - If they delay too long and fail to close before Cooldown, they “die” — also no points.

    - Only by timing the closure during Alarm can they survive and earn points.

This version is a minimal working prototype:

    - It demonstrates PDA design, time-gated instructions, error handling, and a simple React/Anchor frontend.

    - Time windows are hard-coded and short for testing/demonstration.

Planned improvements for future versions:

    - Randomized or configurable time windows instead of fixed demo durations.

    - Allowing players to stake additional resources beyond account rent.

    - A richer, styled frontend with visuals that better reflect the lore.

    - Deeper integration with the Samozbor setting and expanded mechanics (progression, leaderboards, resource management).

This submission should be viewed as the seed of a larger project, showing the core mechanics and technical design, with clear room for extension and polish.