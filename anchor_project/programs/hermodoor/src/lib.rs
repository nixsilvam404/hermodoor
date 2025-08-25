#![allow(unexpected_cfgs)]

use crate::instructions::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod states;

declare_id!("TheTH6YXTse8ANedTw17cjJaV23HgAf84a9NKpvmLe8");

#[program]
pub mod hermodoor {
    use super::*;

    pub fn start_game(ctx: Context<InitRegistryContext>) -> Result<()> {
        init_registry(ctx)
    }

    pub fn next_cycle(ctx: Context<InitCycleContext>) -> Result<()> {
        init_next_cycle(ctx)
    }

    pub fn join_cycle(ctx: Context<ParticipantContext>, nickname: String) -> Result<()> {
        participant_registration(ctx, nickname)
    }

    pub fn close_door(ctx: Context<FinalizeParticipationContext>) -> Result<()> {
        finalize_participation(ctx)
    }
}

