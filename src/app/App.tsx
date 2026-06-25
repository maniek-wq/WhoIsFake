import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { LandingScreen } from "./components/screens/LandingScreen";
import { CreateGameScreen } from "./components/screens/CreateGameScreen";
import { JoinGameScreen } from "./components/screens/JoinGameScreen";
import { LobbyScreen } from "./components/screens/LobbyScreen";
import { RoleRevealScreen } from "./components/screens/RoleRevealScreen";
import { GameScreen } from "./components/screens/GameScreen";
import { VotingScreen } from "./components/screens/VotingScreen";
import { ResultsScreen } from "./components/screens/ResultsScreen";
import { ImpostorGuessScreen } from "./components/screens/ImpostorGuessScreen";
import { EndGameScreen } from "./components/screens/EndGameScreen";
import { GlassCard } from "./components/ui/GlassCard";
import { GameButton } from "./components/ui/GameButton";
import { AccountFab } from "./components/social/AccountFab";
import { SidePanel } from "./components/social/SidePanel";

import { useAuth } from "./context/AuthContext";
import { useToast, toastTypeFromKind } from "./context/ToastContext";
import { useI18n } from "./i18n/LanguageContext";
import { emitAck } from "./lib/socket";
import type { Ack, PlayerView, ServerToast } from "./lib/protocol";
import type { Player } from "./types";

type PreRoute = "landing" | "create" | "join";

export default function App() {
  const { socket, ensureIdentity, user } = useAuth();
  const { addToast } = useToast();
  const { ts } = useI18n();

  const [route, setRoute] = useState<PreRoute>("landing");
  const [view, setView] = useState<PlayerView | null>(null);
  const [guessing, setGuessing] = useState(false);

  // subscribe to server pushes
  useEffect(() => {
    if (!socket) return;
    const onState = (v: PlayerView | null) => {
      setView(v);
      if (!v) setRoute("landing");
    };
    const onToast = (msg: ServerToast) => addToast(toastTypeFromKind(msg.kind), ts(msg.message));
    socket.on("state", onState);
    socket.on("toast", onToast);
    return () => {
      socket.off("state", onState);
      socket.off("toast", onToast);
    };
  }, [socket, addToast, ts]);

  // leaving the clue phase closes the guess overlay
  useEffect(() => {
    if (view?.status !== "playing") setGuessing(false);
  }, [view?.status]);

  // ── pre-room handlers ──────────────────────────────────────────────────────
  const handleGameCreated = async (
    roomCode: string,
    nickname: string,
    maxPlayers: number,
    mode: PlayerView["mode"]
  ) => {
    try {
      await ensureIdentity(nickname);
      const res = await emitAck<Ack<{ code: string }>>("room:create", {
        maxPlayers,
        code: roomCode,
        mode,
      });
      if (!res.ok) addToast("error", ts(res.error));
    } catch {
      addToast("error", ts("Could not reach the server"));
    }
  };

  const handleJoined = async (roomCode: string, nickname: string) => {
    try {
      await ensureIdentity(nickname);
      const res = await emitAck<Ack<{ code: string }>>("room:join", { code: roomCode });
      if (!res.ok) addToast("error", ts(res.error));
    } catch {
      addToast("error", ts("Could not reach the server"));
    }
  };

  // ── in-room actions (fire-and-forget; server pushes new state) ──────────────
  const emit = (event: string, payload?: unknown) => socket?.emit(event, payload ?? {});

  const handleGuessSubmit = async (guess: string) => {
    try {
      await emitAck<Ack<{ correct: boolean }>>("impostor:guess", { guess });
    } catch {
      /* server pushes the outcome */
    }
    setGuessing(false);
  };

  const goHome = () => {
    emit("room:leave");
    setView(null);
    setRoute("landing");
  };

  // ── derived ─────────────────────────────────────────────────────────────────
  const players = (view?.players ?? []) as unknown as Player[];
  const you = view?.players.find((p) => p.id === view.you.id);
  const youName = you?.name ?? user?.username ?? "Player";

  const screen = !view
    ? route
    : view.status === "reveal"
    ? "role-reveal"
    : view.status === "playing"
    ? guessing
      ? "impostor-guess"
      : "game"
    : view.status; // lobby | voting | results | ended

  const overlay = (
    <>
      <AccountFab />
      <SidePanel />
    </>
  );

  return (
    <div className="size-full min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait">
        {screen === "landing" && (
          <LandingScreen
            key="landing"
            onCreateGame={() => setRoute("create")}
            onJoinGame={() => setRoute("join")}
          />
        )}

        {screen === "create" && (
          <CreateGameScreen
            key="create"
            onBack={() => setRoute("landing")}
            onGameCreated={handleGameCreated}
          />
        )}

        {screen === "join" && (
          <JoinGameScreen key="join" onBack={() => setRoute("landing")} onJoined={handleJoined} />
        )}

        {view && screen === "lobby" && (
          <LobbyScreen
            key="lobby"
            roomCode={view.roomCode}
            players={players}
            currentPlayerId={view.you.id}
            isHost={view.you.isHost}
            maxPlayers={view.maxPlayers}
            mode={view.mode}
            onStartGame={() => emit("game:start")}
            onToggleReady={() => emit("player:ready", { ready: !view.you.isReady })}
            onChangeMode={(mode) => emit("room:mode", { mode })}
            onLeave={goHome}
          />
        )}

        {view && screen === "role-reveal" && (
          <RoleRevealScreen
            key="role-reveal"
            isImpostor={view.you.isImpostor}
            secretWord={view.secretWord ?? ""}
            category={view.category ?? ""}
            hint={view.hint ?? ""}
            playerName={youName}
            onReady={() => emit("reveal:ack")}
          />
        )}

        {view && screen === "game" && (
          <GameScreen
            key={`game-${view.round}`}
            round={view.round}
            mode={view.mode}
            players={players}
            currentPlayerId={view.you.id}
            isImpostor={view.you.isImpostor}
            secretWord={view.secretWord ?? ""}
            category={view.category ?? ""}
            hint={view.hint ?? ""}
            clueHistory={view.clueHistory}
            hasSubmittedThisRound={view.you.hasSubmittedThisRound}
            currentTurnId={view.currentTurnId}
            turnOrder={view.turnOrder}
            onSubmitClue={(content) => emit("clue:submit", content)}
            onStartVote={() => emit("vote:start")}
            onGuessWord={() => setGuessing(true)}
          />
        )}

        {view && screen === "voting" && (
          <VotingScreen
            key="voting"
            players={players}
            currentPlayerId={view.you.id}
            clueHistory={view.clueHistory}
            round={view.round}
            deadline={view.vote?.deadline ?? 0}
            onVote={(targetId) => emit("vote:cast", { targetId })}
            onTimerEnd={() => {
              /* server resolves on its own deadline */
            }}
          />
        )}

        {view && screen === "impostor-guess" && (
          <ImpostorGuessScreen
            key="impostor-guess"
            hint={view.hint ?? ""}
            category={view.category ?? ""}
            onGuess={handleGuessSubmit}
            onCancel={() => setGuessing(false)}
          />
        )}

        {view && screen === "results" && view.result && !view.result.tie && view.result.eliminatedId && (
          <ResultsScreen
            key="results"
            eliminatedPlayer={
              {
                ...(players.find((p) => p.id === view.result!.eliminatedId) as Player),
                isImpostor: view.result.wasImpostor,
              } as Player
            }
            eliminatedIndex={players.findIndex((p) => p.id === view.result!.eliminatedId)}
            wasImpostor={view.result.wasImpostor}
            remainingPlayers={players.filter((p) => !p.isEliminated)}
            secretWord={view.secretWord ?? ""}
            onContinue={() => emit("game:continue")}
          />
        )}

        {view && screen === "results" && view.result?.tie && (
          <TieScreen
            key="tie"
            isHost={view.you.isHost}
            onContinue={() => emit("game:continue")}
          />
        )}

        {view && screen === "ended" && view.end && (
          <EndGameScreen
            key="end-game"
            impostorWon={view.end.impostorWon}
            impostorName={view.end.impostorName}
            impostorIndex={players.findIndex((p) => p.id === view.end!.impostorId)}
            secretWord={view.secretWord ?? ""}
            players={players}
            winReason={view.end.winReason}
            onPlayAgain={() => emit("game:again")}
            onGoHome={goHome}
          />
        )}
      </AnimatePresence>

      {overlay}
    </div>
  );
}

function TieScreen({ isHost, onContinue }: { isHost: boolean; onContinue: () => void }) {
  const { t } = useI18n();
  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md text-center"
      >
        <GlassCard className="p-8">
          <div className="text-6xl mb-4">🤝</div>
          <h2
            className="text-white mb-2"
            style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "2rem", fontWeight: 700 }}
          >
            {t("results.tie")}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {t("results.tieDesc")}
          </p>
          {isHost ? (
            <GameButton variant="primary" size="lg" fullWidth onClick={onContinue}>
              {t("common.continue")}
            </GameButton>
          ) : (
            <p className="text-slate-500 text-sm">{t("results.tieWait")}</p>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
