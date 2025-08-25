use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::*;

pub fn participant_registration(ctx: Context<ParticipantContext>, nickname: String) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let cycle =  &ctx.accounts.cycle;

    require!(nickname.len() < NICKNAME_LENGHT, GameError::NicknameTooLong);
    require!(now < cycle.alarm_start, GameError::RegistrationClosed);

    let part = &mut ctx.accounts.participant;
    part.user = ctx.accounts.user.key();
    part.cycle = cycle.key();
    part.status = PartStatus::Pending;
    part.nickname = nickname;
    part.close_time = 0;
    part.points = 0;
    part.bump = ctx.bumps.participant;

    Ok(())
}

#[derive(Accounts)]
pub struct ParticipantContext<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    pub cycle: Account<'info, Cycle>,
    #[account(
        init,
        payer = user,
        space = 8 + Participant::INIT_SPACE,
        seeds = [PARTICIPANT_SEED.as_bytes(), cycle.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,
    pub system_program: Program<'info, System>,
}