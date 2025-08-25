use anchor_lang::prelude::*;

#[error_code]
pub enum GameError {
    #[msg("Unauthorized: only the registry authority may perform this action")]
    Unauthorized,
    #[msg("Round limit exceeded: the facility cannot support more cycles")]
    RoundLimitExceeded,
    #[msg("The provided event timings are inconsistent or invalid")]
    BadTime,
    #[msg("Nickname too long")]
    NicknameTooLong,
    #[msg("Registration is closed")]
    RegistrationClosed,
    #[msg("You already closed the hermodoor for this cycle")]
    AlreadyClosed,
}