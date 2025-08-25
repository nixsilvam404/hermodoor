use::anchor_lang::prelude::*;

use crate::states::*;

pub fn init_registry(ctx: Context<InitRegistryContext>) -> Result<()>{
    let registry = &mut ctx.accounts.registry;

    registry.authority = ctx.accounts.authority.key();
    registry.t0 = Clock::get()?.unix_timestamp;
    registry.next_round = 0;
    registry.max_rounds = DEMO_MAX_ROUNDS;
    registry.bump = ctx.bumps.registry;

    Ok(())
}

#[derive(Accounts)]
pub struct InitRegistryContext <'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Registry::INIT_SPACE,
        seeds = [REGISTRY_SEED.as_bytes(), authority.key().as_ref()],
        bump
    )]
    pub registry: Account<'info, Registry>,
    pub system_program: Program<'info, System>
}