use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::*;

pub fn init_next_cycle(ctx: Context<InitCycleContext>) -> Result<()> {
    let registry = &mut ctx.accounts.registry;
    let cycle = &mut ctx.accounts.cycle;
    let t0 = registry.t0;
    let round = registry.next_round;
    let cycle_duration = QUIET_DURATION + ALARM_DURATION + COOLDOWN_DURATION;

    cycle.authority = ctx.accounts.authority.key();
    cycle.quiet_start    = t0 + (round as i64) * cycle_duration;
    cycle.alarm_start    = cycle.quiet_start + QUIET_DURATION;
    cycle.cooldown_start = cycle.alarm_start + ALARM_DURATION;
    cycle.cooldown_end   = cycle.cooldown_start + COOLDOWN_DURATION;
    cycle.round = round;
    cycle.bump = ctx.bumps.cycle;

    require!(
        cycle.quiet_start < cycle.alarm_start
        && cycle.alarm_start < cycle.cooldown_start
        && cycle.cooldown_start < cycle.cooldown_end,
        GameError::BadTime
    );

    registry.next_round += 1;

    Ok(())

}


#[derive(Accounts)]
pub struct InitCycleContext<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        seeds = [REGISTRY_SEED.as_bytes(), authority.key().as_ref()],
        bump,
        constraint = registry.authority == authority.key() @ GameError::Unauthorized,
        constraint = registry.next_round < registry.max_rounds @ GameError::RoundLimitExceeded
    )]
    pub registry: Account<'info, Registry>,
    #[account(
        init,
        payer = authority,
        space = 8 + Cycle::INIT_SPACE,
        seeds = [CYCLE_SEED.as_bytes(), authority.key().as_ref(), &registry.next_round.to_le_bytes()],
        bump,
    )]
    pub cycle: Account<'info, Cycle>,
    pub system_program: Program<'info, System>,
}
