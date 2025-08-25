use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::*;

pub fn finalize_participation(ctx: Context<FinalizeParticipationContext>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let cycle = &ctx.accounts.cycle;
    let part = &mut ctx.accounts.participant;

    require!(matches!(part.status, PartStatus::Pending), GameError::AlreadyClosed);

    if now < cycle.alarm_start {
        part.status = PartStatus::Dismissed;
        part.points = 0;
    } else if now < cycle.cooldown_start {
        let earned = (now - cycle.alarm_start).max(0);
        part.status = PartStatus::Saved;
        part.points = earned as u64;
    }  else {
        part.status = PartStatus::Late;
        part.points = 0;
    }

    part.close_time = now;
    Ok(())
}

#[derive(Accounts)]
pub struct FinalizeParticipationContext<'info> {
    pub user: Signer<'info>,
    pub cycle: Account<'info, Cycle>,
    #[account(
        mut,
        seeds = [PARTICIPANT_SEED.as_bytes(), cycle.key().as_ref(), user.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,
}

