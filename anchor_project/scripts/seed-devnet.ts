import * as anchor from "@coral-xyz/anchor";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { Hermodoor } from "../target/types/hermodoor";

const REGISTRY_SEED = "REGISTRY_SEED";
const CYCLE_SEED = "CYCLE_SEED";

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Hermodoor as anchor.Program<Hermodoor>;
  const authority = (provider.wallet as any).payer;

  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(REGISTRY_SEED), authority.publicKey.toBuffer()],
    program.programId
  );

  try {
    await program.methods
      .startGame()
      .accountsStrict({
        authority: authority.publicKey,
        registry: registryPda,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    console.log("Registry initialized:", registryPda.toBase58());
  } catch (e) {
    console.log("startGame (maybe already exists):", String(e));
  }

  for (let r = 0; r < 3; r++) {
    const [cyclePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(CYCLE_SEED),
        authority.publicKey.toBuffer(),
        new BN(r).toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );
    try {
      await program.methods
        .nextCycle()
        .accountsStrict({
          authority: authority.publicKey,
          registry: registryPda,
          cycle: cyclePda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`Cycle ${r} created:`, cyclePda.toBase58());
    } catch (e) {
      console.log(`nextCycle ${r} (maybe exists):`, String(e));
    }
  }

  console.log("Done. Save these addresses for the frontend:");
  console.log("Program:", program.programId.toBase58());
  console.log("Registry:", registryPda.toBase58());
}
main();