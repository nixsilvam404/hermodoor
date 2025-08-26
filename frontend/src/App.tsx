import { useMemo, useState } from "react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import type { Hermodoor } from "./types/hermodoor";
import * as anchor from "@coral-xyz/anchor";
import idl from "./idl/hermodoor.json";

import {
  ConnectionProvider, useAnchorWallet, WalletProvider
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider, WalletMultiButton
} from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import "@solana/wallet-adapter-react-ui/styles.css";

const RPC = import.meta.env.VITE_RPC as string;
const PROGRAM_ID = new PublicKey(import.meta.env.VITE_PROGRAM_ID as string);
// const REGISTRY = new PublicKey(import.meta.env.VITE_REGISTRY as string);
const CYCLES = [
  new PublicKey(import.meta.env.VITE_CYCLE0 as string),
  new PublicKey(import.meta.env.VITE_CYCLE1 as string),
  new PublicKey(import.meta.env.VITE_CYCLE2 as string),
];
const PARTICIPANT_SEED = "PARTICIPANT_SEED";

function AppInner() {
  const [nickname, setNickname] = useState("demo");
  const [cycleIx, setCycleIx] = useState(0);
  const [status, setStatus] = useState<string>("no participation yet");
  const [points, setPoints] = useState<number>(0);

  const wallet = useAnchorWallet();
  const connection = useMemo(() => new Connection(RPC, "confirmed"), []);

  const provider = useMemo(() => {
    if (!wallet) return null;
    return new anchor.AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
  }, [connection, wallet]);

  function createProgram(idl: anchor.Idl, programId: PublicKey, provider: anchor.AnchorProvider): anchor.Program {
    const P: any = anchor.Program as any;
    // try (idl, programId, provider)
    try { return new P(idl, programId as unknown as anchor.Address, provider) as anchor.Program; } catch {}
    // fallback: (idl, provider, programId)
    return new P(idl, provider, programId as unknown as anchor.Address) as anchor.Program;
  }

  const program = useMemo(() => {
    if (!provider) return null;
    return createProgram(idl as anchor.Idl, PROGRAM_ID, provider) as unknown as anchor.Program<Hermodoor>;
  }, [provider]);


  const selectedCycle = CYCLES[cycleIx];

  const findParticipationPda = (cycle: PublicKey, user: PublicKey) =>
    PublicKey.findProgramAddressSync(
      [Buffer.from(PARTICIPANT_SEED), cycle.toBuffer(), user.toBuffer()],
      PROGRAM_ID
    )[0];

  const join = async () => {
    if (!program || !wallet?.publicKey) return;
    const participation = findParticipationPda(selectedCycle, wallet.publicKey);
    await program.methods
      .joinCycle(nickname)
      .accountsStrict({
        user: wallet.publicKey,
        cycle: selectedCycle,
        participant: participation,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    await refresh();
  };

  const closeDoor = async () => {
    if (!program || !wallet?.publicKey) return;
    const participation = findParticipationPda(selectedCycle, wallet.publicKey);
    await program.methods
      .closeDoor()
      .accountsStrict({
        user: wallet.publicKey,
        cycle: selectedCycle,
        participant: participation,
      })
      .rpc();
    await refresh();
  };

  const refresh = async () => {
    if (!program || !wallet?.publicKey) return;
    const participation = findParticipationPda(selectedCycle, wallet.publicKey);
    try {
      const acc = await program.account.participant.fetch(participation);
      setPoints(Number(acc.points));
      setStatus(JSON.stringify(acc.status));
    } catch {
      setPoints(0);
      setStatus("no participation yet");
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "ui-sans-serif" }}>
      <h1>Hermodoor (devnet)</h1>
      <div style={{ marginBottom: 12 }}>
        <label>Round:</label>{" "}
        <select value={cycleIx} onChange={e => setCycleIx(Number(e.target.value))}>
          <option value={0}>Cycle 0</option>
          <option value={1}>Cycle 1</option>
          <option value={2}>Cycle 2</option>
        </select>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>Nickname:</label>{" "}
        <input value={nickname} onChange={e => setNickname(e.target.value)} />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={join} disabled={!wallet}>Join</button>
        <button onClick={closeDoor} disabled={!wallet}>Close Door</button>
        <button onClick={refresh} disabled={!wallet}>Refresh</button>
      </div>

      <div><strong>Status:</strong> {status}</div>
      <div><strong>Points:</strong> {points}</div>
    </div>
  );
}

export default function App() {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <ConnectionProvider endpoint={RPC}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div style={{ display: "flex", justifyContent: "flex-end", padding: 12 }}>
            <WalletMultiButton />
          </div>
          <AppInner />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
