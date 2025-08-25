import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import { SystemProgram, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Hermodoor } from "../target/types/hermodoor";

import chai from "chai";
import chaiAsPromised from "chai-as-promised";
chai.use(chaiAsPromised);
const { expect } = chai;

const REGISTRY_SEED = "REGISTRY_SEED";
const CYCLE_SEED = "CYCLE_SEED";
const PARTICIPANT_SEED = "PARTICIPANT_SEED";

//TODO: There are a lot of repeated code blocks, it will be like this for demo, SORRY!
// I had to be hurry, I promise to refactor it, but I still have to deploy and 
// fronted...
//TODO: NEED MORE TESTS FOR FUTURE ALPHA
describe("hermodoor", () => {
  const provider = AnchorProvider.env();
  anchor.setProvider(provider);
  const { connection } = provider;
  const program = anchor.workspace.Hermodoor as Program<Hermodoor>;
  const authority = anchor.web3.Keypair.generate();

  const airdrop = async () => {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    const sig = await connection.requestAirdrop(authority.publicKey, 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction(
      { signature: sig, blockhash, lastValidBlockHeight },
      "confirmed"
    );
  };

  const [registryPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(REGISTRY_SEED), authority.publicKey.toBuffer()],
    program.programId
  );

  let cyclePdas: PublicKey[] = [];

  const airdropTo = async (kp: anchor.web3.Keypair, sol = 2) => {
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    const sig = await connection.requestAirdrop(kp.publicKey, sol = 2 * LAMPORTS_PER_SOL);
    await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, "confirmed");
  };

  const alice = anchor.web3.Keypair.generate();
  const bob = anchor.web3.Keypair.generate();
  const charlie = anchor.web3.Keypair.generate();
  const ivan = anchor.web3.Keypair.generate();
  const maya = anchor.web3.Keypair.generate();

  it("Initialize game", async () => {
    await airdrop();

    console.log("authority:", authority.publicKey.toBase58());
    console.log("registryPda (client):", registryPda.toBase58());

    await program.methods
      .startGame()
      .accountsStrict({
        authority: authority.publicKey,
        registry: registryPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([authority])
      .rpc();

      const reg = await program.account.registry.fetch(registryPda);
      console.log("registry stored authority:", reg.authority.toBase58());
  });

  it ("Fails to initalize the registry twice", async() => {
    await expect(
      program.methods
        .startGame()
        .accountsStrict({
          authority: authority.publicKey,
          registry: registryPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc()
    ).to.be.rejectedWith(/already in use/i)
  });

  it("Creates three cycles (rounds 0, 1, 2)", async () => {
    for (let i = 0; i < 3; i++) {
      const registryAcc = await program.account.registry.fetch(registryPda);
      console.log("nextRound (before):", registryAcc.nextRound.toNumber());

      const [cyclePda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from(CYCLE_SEED),
          authority.publicKey.toBuffer(),
          new BN(i).toArrayLike(Buffer, "le", 8),
        ],
        program.programId
      );

      await program.methods
        .nextCycle()
        .accountsStrict({
          authority: authority.publicKey,
          registry: registryPda,
          cycle: cyclePda,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      cyclePdas[i] = cyclePda;
      console.log("Cycle Pdas:", {
        cycle0: cyclePdas[0],
        cycle1: cyclePdas[1],
        cycle2: cyclePdas[2],
      });
      
      const cycleAcc = await program.account.cycle.fetch(cyclePda);
      console.log("cycle account:", {
        round: cycleAcc.round.toNumber(),
        quiet: cycleAcc.quietStart.toNumber(),
        alarm: cycleAcc.alarmStart.toNumber(),
        cooldown: cycleAcc.cooldownStart.toNumber(),
        end: cycleAcc.cooldownEnd.toNumber(),
      });
    }
  });

  it("Fails when trying to create a 4th cycle", async () => {
    const registryAcc = await program.account.registry.fetch(registryPda);
    console.log("nextRound (before):", registryAcc.nextRound.toNumber());

    const [cyclePda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from(CYCLE_SEED),
        authority.publicKey.toBuffer(),
        new BN(registryAcc.nextRound).toArrayLike(Buffer, "le", 8),
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
        .signers([authority])
        .rpc();
      throw new Error("Should have thrown Constraint error but did not!");
      } catch (err: any) {
        console.log("Expected error:", err.toString());
      }
  });

  it("Join Cycle: Alice joins in Quiet (happy), Bob fails after Alarm (unhappy), Charlie fails with long nickname (unhappy)", async () => {
    await Promise.all([airdropTo(alice), airdropTo(bob), airdropTo(charlie)]);

    // ---- Round 0 accounts ----
    let cycle0Pda = cyclePdas[0];
    const cycle0 = await program.account.cycle.fetch(cycle0Pda);
    const alicePart0 = PublicKey.findProgramAddressSync(
      [
        Buffer.from(PARTICIPANT_SEED), cycle0Pda.toBuffer(), alice.publicKey.toBuffer()
      ],
      program.programId
    )[0];
    const bobPart0 = PublicKey.findProgramAddressSync(
      [
        Buffer.from(PARTICIPANT_SEED), cycle0Pda.toBuffer(), bob.publicKey.toBuffer()
      ],
      program.programId
    )[0];

    // --- Happy: Alice joins during Quiet ---
    // (Require now < alarm_start)
    const now = Math.floor(Date.now() / 1000);
    if (now >= cycle0.alarmStart.toNumber()) {
      throw new Error("Test assumes we are still in Quiet for round 0. Lower demo durations or create a fresh round.");
    }

    await program.methods
      .joinCycle("alice")
      .accountsStrict({
        user: alice.publicKey,
        cycle: cycle0Pda,
        participant: alicePart0,
        systemProgram: SystemProgram.programId,
      })
      .signers([alice])
      .rpc();

    // --- Unhappy: Bob tries to join after Alarm ---
    // Sleep until just after alarm_start
    const msToAlarm = (cycle0.alarmStart.toNumber() - Math.floor(Date.now() / 1000) + 1) * 1000;
    if (msToAlarm > 0) await new Promise(r => setTimeout(r, msToAlarm));
    
    try {
      await program.methods
        .joinCycle("bob")
        .accountsStrict({
          user: bob.publicKey,
          cycle: cycle0Pda,
          participant: bobPart0,
          systemProgram: SystemProgram.programId,
        })
        .signers([bob])
        .rpc();
      
      throw new Error("Expected RegistrationClosed error");  
    } catch (e: any) {
      const msg = String(e);
      if (!/RegistrationClosed|Registration is closed/i.test(msg)) {
        throw e;
      }
    }

    // --- Unhappy: Nickname too long (fresh Quiet window on round 1) ---
    const cycle1Pda = cyclePdas[1];
    const charliePart1 = PublicKey.findProgramAddressSync(
      [Buffer.from(PARTICIPANT_SEED), cycle1Pda.toBuffer(), charlie.publicKey.toBuffer()],
      program.programId
    )[0];

    const tooLongNick = "x".repeat(40); // assuming max 32
    try {
      await program.methods
        .joinCycle(tooLongNick)
        .accountsStrict({
          user: charlie.publicKey,
          cycle: cycle1Pda,
          participant: charliePart1,
          systemProgram: SystemProgram.programId,
        })
        .signers([charlie])
        .rpc();

      throw new Error("Expected NicknameTooLong");
    } catch (e: any) {
      const msg = String(e);
      if (!/NicknameTooLong|Nickname too long/i.test(msg)) {
        throw e;
      }
    }
  });

  it("Ivan can close once in Alarm, but not twice (unhappy)", async () => {
    await airdropTo(ivan);

    // pick the first cycle that is still in Quiet
    let cyclePda: PublicKey | null = null;
    let cycleAcc: any = null;
    for (const pda of cyclePdas) {
      const acc = await program.account.cycle.fetch(pda);
      const now = Math.floor(Date.now() / 1000);
      if (now < acc.alarmStart.toNumber()) {
        cyclePda = pda;
        cycleAcc = acc;
        break;
      }
    }
    if (!cyclePda) throw new Error("No cycle in Quiet right now – re-run quickly or shorten demo durations");

    const partPda = PublicKey.findProgramAddressSync(
      [Buffer.from(PARTICIPANT_SEED), cyclePda.toBuffer(), ivan.publicKey.toBuffer()],
      program.programId
    )[0];

    await program.methods
      .joinCycle("ivan")
      .accountsStrict({
        user: ivan.publicKey,
        cycle: cyclePda,
        participant: partPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([ivan])
      .rpc()

    // Wait until Alarm
    const msToAlarm = Math.max(
      0,
      (cycleAcc.alarmStart.toNumber() - Math.floor(Date.now() / 1000) + 1) * 1000
    );
    if (msToAlarm > 0) await new Promise(r => setTimeout(r, msToAlarm));

    // closed first time
    await program.methods
      .closeDoor()
      .accountsStrict({
        user: ivan.publicKey,
        cycle: cyclePda,
        participant: partPda,
      })
      .signers([ivan])
      .rpc();

    const part = await program.account.participant.fetch(partPda);
    console.log("Ivan points:", part.points.toNumber(), "status:", part.status);
    
    // closed second time
    try {
      await program.methods
        .closeDoor()
        .accountsStrict({
          user: ivan.publicKey,
          cycle: cyclePda,
          participant: partPda,
        })
        .signers([ivan])
        .rpc();
      throw new Error("Expected AlreadyClosed error");
    } catch (e: any) {
      const msg = String(e);
      console.log("double close error:", msg);
      if (!/AlreadyClosed|already/i.test(msg)) throw e;
    }
  });

  it("Maya closes in Alarm and earns points (happy)", async () => {
    await airdropTo(maya);

    // pick the first cycle that is still in Quiet
    let cyclePda: PublicKey | null = null;
    let cycleAcc: any = null;
    for (const pda of cyclePdas) {
      const acc = await program.account.cycle.fetch(pda);
      const now = Math.floor(Date.now() / 1000);
      if (now < acc.alarmStart.toNumber()) {
        cyclePda = pda;
        cycleAcc = acc;
        break;
      }
    }
    if (!cyclePda) throw new Error("No cycle in Quiet right now – re-run quickly or shorten demo durations");

    const partPda = PublicKey.findProgramAddressSync(
      [Buffer.from(PARTICIPANT_SEED), cyclePda.toBuffer(), maya.publicKey.toBuffer()],
      program.programId
    )[0];

    await program.methods
      .joinCycle("maya")
      .accountsStrict({
        user: maya.publicKey,
        cycle: cyclePda,
        participant: partPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([maya])
      .rpc();
    
    // Wait until alarm starts and extra 1500ms for earning points
    const msToAlarm = Math.max(
      0,
      (cycleAcc.alarmStart.toNumber() - Math.floor(Date.now() / 1000) + 1) * 1000
    );
    if (msToAlarm > 0) await new Promise(r => setTimeout(r, msToAlarm));
    await new Promise(r => setTimeout(r, 1500));

    // Close during alarm (happy)
    await program.methods
      .closeDoor()
      .accountsStrict({
        user: maya.publicKey,
        cycle: cyclePda,
        participant: partPda,
      })
      .signers([maya])
      .rpc();
    
    const part = await program.account.participant.fetch(partPda);
    console.log("Maya points:", part.points.toNumber(), "status:", part.status);

    if (part.points.toNumber() <= 0) {
      throw new Error("Expected Maya to earn > 0 points when closing during Alarm");
    }
  });
});
