use anchor_lang::prelude::*;

pub const NICKNAME_LENGHT: usize = 32;

pub const REGISTRY_SEED: &str = "REGISTRY_SEED";
pub const CYCLE_SEED: &str = "CYCLE_SEED";
pub const PARTICIPANT_SEED: &str = "PARTICIPANT_SEED";

/// ---------------------------------------------------------------------------
/// Demo configuration
///
/// For the alpha/demo build we hard-code short, predictable phase lengths
/// and a small maximum number of rounds. This makes the event cycle
/// quick and repeatable for testing. In a production version both the
/// timings and number of rounds could be randomized or set by the authority.
/// ---------------------------------------------------------------------------
pub const DEMO_MAX_ROUNDS: u64 = 3;
pub const QUIET_DURATION: i64 = 10;
pub const ALARM_DURATION: i64 = 10;
pub const COOLDOWN_DURATION: i64 = 5;

// not for demo
// #[repr(u8)]
// #[derive(AnchorDeserialize, AnchorSerialize, Clone, InitSpace, Default)]
// pub enum CycleStatus {
//     #[default]
//     Quiet = 0,
//     Alarm = 1,
//     Cooldown = 2,
//     Finished = 3,
// }

#[derive(AnchorDeserialize, AnchorSerialize, Clone, InitSpace)]
pub enum PartStatus {
    Pending,
    Dismissed,
    Saved,
    Late,
}

#[account]
#[derive(InitSpace)]
pub struct Registry {
    pub authority : Pubkey,
    pub t0: i64,
    pub next_round: u64,
    pub max_rounds: u64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Cycle {
    pub authority: Pubkey,
    pub round: u64,
    pub quiet_start: i64,
    pub alarm_start: i64,
    pub cooldown_start: i64,
    pub cooldown_end: i64,
    // pub status: CycleStatus,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Participant {
    pub user: Pubkey,
    pub cycle: Pubkey,
    pub status: PartStatus,
    #[max_len(NICKNAME_LENGHT)]
    pub nickname: String,
    pub close_time: i64,
    pub points: u64,
    pub bump: u8,
}

// TODO: Add random to status durations
// TODO: Add  max of participants
// TODO: Add lamports bid system