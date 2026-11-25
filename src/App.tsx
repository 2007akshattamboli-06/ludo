import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, RotateCcw, Users, Volume2, VolumeX } from 'lucide-react';
import {
  GameMode,
  Particle,
  PlayerColor,
  PlayerConfig,
  Token,
  TurnPhase,
} from './types/game';
import { UserProfile } from './types/auth';
import {
  FriendProfile,
  FriendRequestRecord,
  GameInvitePayload,
} from './types/friends';
import {
  DiceRolledPayload,
  OnlineRoomState,
  PlayerReactionPayload,
  TokenMovedPayload,
} from './types/multiplayer';
import { authService } from './services/authService';
import { friendService } from './services/friendService';
import { socketService } from './services/socketService';
import { HOME_GOAL_STEPS, PLAYER_THEMES } from './game/constants/boardConstants';
import {
  createInitialTokens,
  evaluateMove,
  getNextActivePlayerColor,
  getTokenGridCoords,
  getValidMoves,
  hasPlayerWon,
} from './game/rules/ludoRules';
import { rotateGridCoords } from './game/board/boardRenderer';
import { chooseAIMove } from './game/ai/botEngine';
import { soundEngine } from './audio/soundEngine';
import { LudoBoardCanvas } from './components/board/LudoBoardCanvas';
import { Dice3D } from './components/dice/Dice3D';
import { PlayerPod } from './components/hud/PlayerPod';
import { InMatchChatMessage, QuickChatBar } from './components/hud/QuickChatBar';
import { LobbyModal } from './components/screens/LobbyModal';
import { LoginScreen } from './components/screens/LoginScreen';
import { FriendsModal } from './components/friends/FriendsModal';
import { GameLoadingScreen } from './components/screens/GameLoadingScreen';
import {
  MatchParticipant,
  MatchResultModal,
} from './components/screens/MatchResultModal';

type CoordMap = Map<string, [number, number]>;

const SETTINGS_KEY = 'ludo_sastra_settings';

const readStoredSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
  } catch {
    return {};
  }
};

const getGameSpeedDelays = () => {
  const saved = readStoredSettings();
  if (saved.gameSpeed === 'turbo') return { diceMs: 300, moveStepMs: 80 };
  if (saved.gameSpeed === 'fast') return { diceMs: 550, moveStepMs: 150 };
  return { diceMs: 900, moveStepMs: 250 };
};

const triggerHaptic = (pattern: number | number[]) => {
  const saved = readStoredSettings();
  if (saved.vibration === false) return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // ignore unsupported environments
  }
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const [players, setPlayers] = useState<PlayerConfig[] | null>(null);
  const [offlineMode, setOfflineMode] = useState<GameMode>('vs-ai');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [turnColor, setTurnColor] = useState<PlayerColor>('red');
  const [phase, setPhase] = useState<TurnPhase>('ROLL');
  const [diceValue, setDiceValue] = useState<number>(6);
  const [consecutiveSixes, setConsecutiveSixes] = useState<number>(0);
  const [validTokens, setValidTokens] = useState<Token[]>([]);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [statusBanner, setStatusBanner] = useState<string>('Roll the dice to begin!');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = readStoredSettings();
    const initial = saved.soundEffects !== false;
    soundEngine.enabled = initial;
    return initial;
  });

  const [serverConnected, setServerConnected] = useState<boolean>(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [searchingMatch, setSearchingMatch] = useState<boolean>(false);
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoomState | null>(null);
  const [mpError, setMpError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [reactions, setReactions] = useState<Record<string, PlayerReactionPayload | null>>({});
  const [matchChatMessages, setMatchChatMessages] = useState<InMatchChatMessage[]>([]);

  // Friends & Social State
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestRecord[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestRecord[]>([]);
  const [presenceMap, setPresenceMap] = useState<
    Record<string, { online: boolean; inGame: boolean }>
  >({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [pendingInvite, setPendingInvite] = useState<GameInvitePayload | null>(null);
  const [pendingInviteTargetUid, setPendingInviteTargetUid] = useState<string | null>(null);
  const [inGameFriendsOpen, setInGameFriendsOpen] = useState<boolean>(false);

  const [animatedCoords, setAnimatedCoords] = useState<CoordMap>(() => new Map());
  const [particles, setParticles] = useState<Particle[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const recordedRoomRef = useRef<string | null>(null);
  const activeChatFriendUidRef = useRef<string | null>(null);
  const onlineRoomRef = useRef<OnlineRoomState | null>(null);
  const playersRef = useRef<PlayerConfig[] | null>(null);

  useEffect(() => {
    onlineRoomRef.current = onlineRoom;
  }, [onlineRoom]);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const getPlayerNameByColor = useCallback((color: PlayerColor): string => {
    const room = onlineRoomRef.current;
    if (room && (room.status === 'PLAYING' || room.status === 'FINISHED')) {
      const found = room.players.find((p) => p.color === color);
      if (found?.username) return found.username;
    }
    const localPlayers = playersRef.current;
    if (localPlayers) {
      const found = localPlayers.find((p) => p.color === color);
      if (found?.name) return found.name;
    }
    return PLAYER_THEMES[color].name;
  }, []);

  useEffect(() => {
    const onSettingsChanged = (e: Event) => {
      const detail = (e as CustomEvent).detail || readStoredSettings();
      const nextSound = detail.soundEffects !== false;
      soundEngine.enabled = nextSound;
      setSoundEnabled(nextSound);
    };
    window.addEventListener('sastra-settings-changed', onSettingsChanged);
    return () =>
      window.removeEventListener('sastra-settings-changed', onSettingsChanged);
  }, []);

  useEffect(() => {
    const unsubscribe = authService.subscribeToAuth((profile) => {
      setUser(profile);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to Firestore Friends & Requests
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
      setUnreadCounts({});
      return;
    }
    const unsub = friendService.subscribeToSocial(user.uid, (data) => {
      setFriends(data.friends);
      setIncomingRequests(data.incomingRequests);
      setOutgoingRequests(data.outgoingRequests);
    });
    return () => unsub();
  }, [user]);

  // Subscribe to Unread Messages & Trigger Chat Sound Alerts
  useEffect(() => {
    if (!user) return;
    const unsub = friendService.subscribeToUnreadMessages(
      user.uid,
      friends,
      (counts, newIncoming) => {
        setUnreadCounts(counts);
        const saved = readStoredSettings();
        if (
          newIncoming &&
          saved.chatAlerts !== false &&
          activeChatFriendUidRef.current !== newIncoming.friendUid
        ) {
          soundEngine.playChatPing();
        }
      }
    );
    return () => unsub();
  }, [friends, user]);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (particlesRef.current.length > 0) {
        particlesRef.current = particlesRef.current
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.08,
            alpha: p.alpha - p.decay,
          }))
          .filter((p) => p.alpha > 0);
        setParticles([...particlesRef.current]);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const isOnlinePlaying = Boolean(
    onlineRoom && (onlineRoom.status === 'PLAYING' || onlineRoom.status === 'FINISHED')
  );

  useEffect(() => {
    if (!user) return;
    socketService.getSocket()?.emit('set_in_game', {
      inGame: Boolean(players || isOnlinePlaying),
    });
  }, [isOnlinePlaying, players, user]);

  const myPerspective: PlayerColor =
    isOnlinePlaying && user
      ? onlineRoom!.players.find((p) => p.uid === user.uid)?.color || 'red'
      : 'red';

  const spawnBurst = useCallback(
    (gridX: number, gridY: number, color: string) => {
      const [rx, ry] = rotateGridCoords([gridX, gridY], myPerspective);
      const px = ((rx + 0.5) / 15) * 540;
      const py = ((ry + 0.5) / 15) * 540;
      const next: Particle[] = [];
      for (let i = 0; i < 22; i++) {
        const angle = (Math.PI * 2 * i) / 22 + Math.random() * 0.2;
        const speed = 1.5 + Math.random() * 3.5;
        next.push({
          x: px,
          y: py,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          color,
          size: 3 + Math.random() * 3.5,
          alpha: 1,
          decay: 0.025 + Math.random() * 0.015,
        });
      }
      particlesRef.current = [...particlesRef.current, ...next];
    },
    [myPerspective]
  );

  useEffect(() => {
    if (!user) return;
    const socket = socketService.connect();

    const register = () => {
      setServerConnected(true);
      socket.emit('register_user', { user });
    };

    if (socket.connected) {
      register();
    }

    const onDisconnect = () => setServerConnected(false);
    const onOnlineCount = ({ count }: { count: number }) => setOnlineCount(count);
    const onPresenceSnapshot = ({
      users,
    }: {
      users: Record<string, { online: boolean; inGame: boolean }>;
    }) => {
      setPresenceMap(users || {});
    };
    const onGameInvite = (invite: GameInvitePayload) => {
      setPendingInvite(invite);
    };
    const onMatchmakingStatus = ({ searching }: { searching: boolean }) => {
      setSearchingMatch(searching);
      setMpError(null);
    };
    const onMpError = ({ message }: { message: string }) => {
      setMpError(message);
      setSearchingMatch(false);
    };

    const onRoomUpdated = (room: OnlineRoomState) => {
      setMpError(null);
      setSearchingMatch(false);
      setOnlineRoom(room);

      if (room.status === 'PLAYING') {
        recordedRoomRef.current = null;
      }

      if (room.status === 'PLAYING' || room.status === 'FINISHED') {
        setTokens(room.tokens);
        setTurnColor(room.turnColor);
        setPhase(room.phase);
        setDiceValue(room.diceValue);
        setWinner(room.winner);
        setValidTokens(room.tokens.filter((t) => room.validTokenIds.includes(t.id)));

        const turnPlayer = room.players.find((p) => p.color === room.turnColor);
        if (room.status === 'FINISHED' && room.winner) {
          const winPlayer = room.players.find((p) => p.color === room.winner);
          setStatusBanner(`${winPlayer?.username || PLAYER_THEMES[room.winner].name} Wins!`);
          const mySeat = room.players.find((p) => p.uid === user.uid);
          if (mySeat && recordedRoomRef.current !== room.code) {
            recordedRoomRef.current = room.code;
            authService
              .recordMatchResult(
                user.uid,
                room.winner === mySeat.color,
                room.isPrivate ? 'Private Room' : 'Online Match'
              )
              .then((updated) => updated && setUser(updated));
          }
        } else if (room.phase === 'SELECT_TOKEN') {
          setStatusBanner(
            turnPlayer?.uid === user.uid
              ? `Rolled ${room.diceValue} — Select a highlighted token`
              : `${turnPlayer?.username || 'Opponent'} is choosing a token...`
          );
        } else {
          setStatusBanner(
            turnPlayer?.uid === user.uid
              ? 'Your Turn — Roll the Dice!'
              : `${turnPlayer?.username || 'Opponent'}'s Turn`
          );
        }
      }
    };

    const onDiceRolled = ({ color, value, tripleSix }: DiceRolledPayload) => {
      const { diceMs } = getGameSpeedDelays();
      const rollerName = getPlayerNameByColor(color);
      setDiceValue(value);
      setPhase('ANIMATING_ROLL');
      soundEngine.playDiceRoll();
      triggerHaptic(30);
      setTimeout(() => {
        if (tripleSix) {
          setStatusBanner('Three 6s in a row! Turn forfeited.');
        } else {
          setStatusBanner(`${rollerName} rolled ${value}`);
        }
      }, diceMs);
    };

    const onTokenMoved = async (payload: TokenMovedPayload) => {
      setPhase('MOVING');
      setValidTokens([]);

      const stepSequence: number[] = [];
      if (payload.fromSteps === -1 && payload.toSteps === 0) {
        stepSequence.push(0);
      } else {
        for (let s = payload.fromSteps + 1; s <= payload.toSteps; s++) {
          stepSequence.push(s);
        }
      }

      for (let i = 0; i < stepSequence.length; i++) {
        const tempToken: Token = {
          id: payload.tokenId,
          color: payload.color,
          index: 0,
          steps: stepSequence[i],
        };
        const coords = getTokenGridCoords(tempToken);
        setAnimatedCoords((prev) => {
          const next = new Map(prev);
          next.set(payload.tokenId, coords);
          return next;
        });
        soundEngine.playStep(i);
        await new Promise((r) => setTimeout(r, getGameSpeedDelays().moveStepMs));
      }

      setAnimatedCoords((prev) => {
        const next = new Map(prev);
        next.delete(payload.tokenId);
        return next;
      });

      if (payload.capturedIds.length > 0) {
        soundEngine.playCapture();
        triggerHaptic([40, 30, 60]);
        const dest = getTokenGridCoords({
          id: payload.tokenId,
          color: payload.color,
          index: 0,
          steps: payload.toSteps,
        });
        spawnBurst(dest[0], dest[1], '#EF4444');
      } else if (payload.reachesHome) {
        soundEngine.playHome();
        triggerHaptic([30, 40, 30]);
        const dest = getTokenGridCoords({
          id: payload.tokenId,
          color: payload.color,
          index: 0,
          steps: HOME_GOAL_STEPS,
        });
        spawnBurst(dest[0], dest[1], '#FBBF24');
      }

      if (payload.room.status === 'FINISHED') {
        soundEngine.playWin();
      }

      onRoomUpdated(payload.room);
    };

    const onReaction = (reaction: PlayerReactionPayload) => {
      setReactions((prev) => ({ ...prev, [reaction.color]: reaction }));
      const senderName = getPlayerNameByColor(reaction.color);
      setMatchChatMessages((prev) => {
        if (prev.some((m) => m.id === reaction.id)) return prev;
        return [
          ...prev.slice(-24),
          {
            id: reaction.id || `${Date.now()}-${Math.random()}`,
            senderName,
            color: reaction.color,
            emoji: reaction.emoji,
            text: reaction.text || reaction.emoji || '',
          },
        ];
      });
      setTimeout(() => {
        setReactions((prev) =>
          prev[reaction.color]?.id === reaction.id ? { ...prev, [reaction.color]: null } : prev
        );
      }, 3000);
    };

    socket.on('connect', register);
    socket.on('disconnect', onDisconnect);
    socket.on('online_count', onOnlineCount);
    socket.on('presence_snapshot', onPresenceSnapshot);
    socket.on('game_invite', onGameInvite);
    socket.on('matchmaking_status', onMatchmakingStatus);
    socket.on('mp_error', onMpError);
    socket.on('room_updated', onRoomUpdated);
    socket.on('dice_rolled', onDiceRolled);
    socket.on('token_moved', onTokenMoved);
    socket.on('player_reaction', onReaction);

    return () => {
      socket.off('connect', register);
      socket.off('disconnect', onDisconnect);
      socket.off('online_count', onOnlineCount);
      socket.off('presence_snapshot', onPresenceSnapshot);
      socket.off('game_invite', onGameInvite);
      socket.off('matchmaking_status', onMatchmakingStatus);
      socket.off('mp_error', onMpError);
      socket.off('room_updated', onRoomUpdated);
      socket.off('dice_rolled', onDiceRolled);
      socket.off('token_moved', onTokenMoved);
      socket.off('player_reaction', onReaction);
    };
  }, [getPlayerNameByColor, spawnBurst, user]);

  useEffect(() => {
    if (
      user &&
      pendingInviteTargetUid &&
      onlineRoom &&
      onlineRoom.status === 'WAITING'
    ) {
      socketService.getSocket()?.emit('invite_friend', {
        fromUser: user,
        toUid: pendingInviteTargetUid,
        roomCode: onlineRoom.code,
      });
      setPendingInviteTargetUid(null);
    }
  }, [onlineRoom, pendingInviteTargetUid, user]);

  useEffect(() => {
    if (!onlineRoom || onlineRoom.status !== 'PLAYING' || !onlineRoom.turnDeadline) {
      setSecondsLeft(null);
      return;
    }
    const interval = setInterval(() => {
      const rem = Math.max(0, Math.ceil((onlineRoom.turnDeadline! - Date.now()) / 1000));
      setSecondsLeft(rem);
    }, 300);
    return () => clearInterval(interval);
  }, [onlineRoom]);

  const handleActiveChatChange = useCallback((friendUid: string | null) => {
    activeChatFriendUidRef.current = friendUid;
  }, []);

  const handleInviteFriend = (friend: FriendProfile) => {
    if (!user) return;
    if (onlineRoom && onlineRoom.status === 'WAITING') {
      socketService.getSocket()?.emit('invite_friend', {
        fromUser: user,
        toUid: friend.uid,
        roomCode: onlineRoom.code,
      });
    } else {
      setPendingInviteTargetUid(friend.uid);
      socketService.getSocket()?.emit('create_room', { user, maxPlayers: 2 });
    }
  };

  const handleAcceptInvite = (invite: GameInvitePayload) => {
    if (!user) return;
    setPendingInvite(null);
    setPlayers(null);
    setWinner(null);
    setMatchChatMessages([]);
    socketService.getSocket()?.emit('join_room', { user, code: invite.roomCode });
  };

  const handleLogout = async () => {
    socketService.disconnect();
    await authService.logout();
    setOnlineRoom(null);
    setPlayers(null);
    setMatchChatMessages([]);
    setUser(null);
  };

  const handleReturnToLobby = () => {
    if (onlineRoom) {
      socketService.getSocket()?.emit('leave_room');
      setOnlineRoom(null);
    }
    setPlayers(null);
    setWinner(null);
    setMatchChatMessages([]);
    setInGameFriendsOpen(false);
  };

  const startOfflineGame = (configs: PlayerConfig[], mode: GameMode) => {
    const firstPlayer = configs.find((p) => p.active);
    const firstActive = firstPlayer?.color ?? 'red';
    const firstName = firstPlayer?.name || PLAYER_THEMES[firstActive].name;
    setOnlineRoom(null);
    setOfflineMode(mode);
    setPlayers(configs);
    setTokens(createInitialTokens(configs));
    setTurnColor(firstActive);
    setPhase('ROLL');
    setDiceValue(6);
    setConsecutiveSixes(0);
    setValidTokens([]);
    setWinner(null);
    setMatchChatMessages([]);
    setAnimatedCoords(new Map());
    setStatusBanner(`${firstName}'s turn — Roll!`);
  };

  const advanceOfflineTurn = useCallback(
    (currentTokens: Token[], activePlayers: PlayerConfig[], grantBonusTurn: boolean) => {
      if (grantBonusTurn) {
        const currentName =
          activePlayers.find((p) => p.color === turnColor)?.name ||
          PLAYER_THEMES[turnColor].name;
        setValidTokens([]);
        setPhase('ROLL');
        setStatusBanner(`Bonus roll for ${currentName}!`);
        return;
      }
      const nextColor = getNextActivePlayerColor(turnColor, activePlayers, currentTokens);
      const nextName =
        activePlayers.find((p) => p.color === nextColor)?.name ||
        PLAYER_THEMES[nextColor].name;
      setTurnColor(nextColor);
      setConsecutiveSixes(0);
      setValidTokens([]);
      setPhase('ROLL');
      setStatusBanner(`${nextName}'s turn`);
    },
    [turnColor]
  );

  const executeOfflineMove = useCallback(
    async (selectedToken: Token, rollVal: number) => {
      if (!players) return;
      setPhase('MOVING');
      setValidTokens([]);

      const evaluation = evaluateMove(selectedToken, rollVal, tokens);
      const stepSequence: number[] = [];
      if (evaluation.isDeploy) {
        stepSequence.push(0);
      } else {
        for (let s = evaluation.fromSteps + 1; s <= evaluation.toSteps; s++) {
          stepSequence.push(s);
        }
      }

      for (let i = 0; i < stepSequence.length; i++) {
        const tempToken: Token = { ...selectedToken, steps: stepSequence[i] };
        const coords = getTokenGridCoords(tempToken);
        setAnimatedCoords((prev) => {
          const next = new Map(prev);
          next.set(selectedToken.id, coords);
          return next;
        });
        soundEngine.playStep(i);
        await new Promise((r) => setTimeout(r, getGameSpeedDelays().moveStepMs));
      }

      const capturedIds = new Set(evaluation.captures.map((c) => c.id));
      const updatedTokens = tokens.map((t) => {
        if (t.id === selectedToken.id) return { ...t, steps: evaluation.toSteps };
        if (capturedIds.has(t.id)) return { ...t, steps: -1 };
        return t;
      });

      setAnimatedCoords((prev) => {
        const next = new Map(prev);
        next.delete(selectedToken.id);
        return next;
      });
      setTokens(updatedTokens);

      if (evaluation.captures.length > 0) {
        soundEngine.playCapture();
        triggerHaptic([40, 30, 60]);
        const destCoords = getTokenGridCoords({ ...selectedToken, steps: evaluation.toSteps });
        spawnBurst(destCoords[0], destCoords[1], '#EF4444');
      } else if (evaluation.reachesHome) {
        soundEngine.playHome();
        triggerHaptic([30, 40, 30]);
        const destCoords = getTokenGridCoords({ ...selectedToken, steps: HOME_GOAL_STEPS });
        spawnBurst(destCoords[0], destCoords[1], '#FBBF24');
      }

      if (hasPlayerWon(updatedTokens, turnColor)) {
        const winnerName =
          players.find((p) => p.color === turnColor)?.name ||
          PLAYER_THEMES[turnColor].name;
        soundEngine.playWin();
        setWinner(turnColor);
        setPhase('GAME_OVER');
        setStatusBanner(`${winnerName} Wins the Crown!`);
        if (user) {
          const modeLabel = offlineMode === 'local' ? 'Pass & Play' : 'Vs Smart AI';
          const updatedUser = await authService.recordMatchResult(
            user.uid,
            turnColor === 'red',
            modeLabel
          );
          if (updatedUser) setUser(updatedUser);
        }
        return;
      }

      const bonusTurn =
        rollVal === 6 || evaluation.captures.length > 0 || evaluation.reachesHome;
      advanceOfflineTurn(updatedTokens, players, bonusTurn);
    },
    [advanceOfflineTurn, offlineMode, players, spawnBurst, tokens, turnColor, user]
  );

  const handleRollDice = useCallback(() => {
    if (onlineRoom && onlineRoom.status === 'PLAYING') {
      socketService.getSocket()?.emit('roll_dice');
      return;
    }

    if (phase !== 'ROLL' || !players) return;
    const { diceMs } = getGameSpeedDelays();
    const rolled = Math.floor(Math.random() * 6) + 1;

    setDiceValue(rolled);
    setPhase('ANIMATING_ROLL');
    soundEngine.playDiceRoll();
    triggerHaptic(30);

    setTimeout(() => {
      const nextSixes = rolled === 6 ? consecutiveSixes + 1 : 0;
      setConsecutiveSixes(nextSixes);

      if (nextSixes >= 3) {
        setStatusBanner('Three 6s in a row! Turn forfeited.');
        setTimeout(() => advanceOfflineTurn(tokens, players, false), 750);
        return;
      }

      const moves = getValidMoves(tokens, turnColor, rolled);
      if (moves.length === 0) {
        setStatusBanner(`Rolled ${rolled} — No valid moves`);
        setTimeout(() => advanceOfflineTurn(tokens, players, false), 650);
        return;
      }

      const currentPlayer = players.find((p) => p.color === turnColor);
      if (moves.length === 1 || currentPlayer?.isAI) {
        const chosen = currentPlayer?.isAI
          ? chooseAIMove(moves, tokens, rolled, currentPlayer.difficulty)
          : moves[0];
        executeOfflineMove(chosen, rolled);
      } else {
        setValidTokens(moves);
        setPhase('SELECT_TOKEN');
        setStatusBanner(`Rolled ${rolled} — Select a highlighted token`);
      }
    }, diceMs);
  }, [
    advanceOfflineTurn,
    consecutiveSixes,
    executeOfflineMove,
    onlineRoom,
    phase,
    players,
    tokens,
    turnColor,
  ]);

  const handleSelectToken = (token: Token) => {
    if (onlineRoom && onlineRoom.status === 'PLAYING') {
      socketService.getSocket()?.emit('move_token', { tokenId: token.id });
      return;
    }
    executeOfflineMove(token, diceValue);
  };

  const handleLocalMatchChat = (emoji: string, text: string) => {
    const senderColor: PlayerColor = isOnlinePlaying ? myPerspective : 'red';
    const senderName = user?.username || getPlayerNameByColor(senderColor);
    const localId = `local-${Date.now()}-${Math.random()}`;

    if (!isOnlinePlaying) {
      const localReaction = {
        id: localId,
        color: senderColor,
        username: senderName,
        emoji,
        text,
      } as PlayerReactionPayload;

      setReactions((prev) => ({ ...prev, [senderColor]: localReaction }));
      setTimeout(() => {
        setReactions((prev) =>
          prev[senderColor]?.id === localId
            ? { ...prev, [senderColor]: null }
            : prev
        );
      }, 3000);
    }

    setMatchChatMessages((prev) => [
      ...prev.slice(-24),
      {
        id: localId,
        senderName,
        color: senderColor,
        emoji,
        text: text || emoji,
      },
    ]);
  };

  useEffect(() => {
    if (onlineRoom || !players || phase !== 'ROLL') return;
    const activePlayer = players.find((p) => p.color === turnColor);
    if (activePlayer?.isAI) {
      const timer = setTimeout(() => handleRollDice(), 550);
      return () => clearTimeout(timer);
    }
  }, [handleRollDice, onlineRoom, phase, players, turnColor]);

  const toggleSound = () => {
    const next = !soundEnabled;
    soundEngine.enabled = next;
    setSoundEnabled(next);
    try {
      const saved = readStoredSettings();
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ ...saved, soundEffects: next })
      );
    } catch {
      // ignore storage errors
    }
  };

  if (authLoading) {
    return <GameLoadingScreen />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_#1E293B_0%,_#0B0E17_75%)]">
        <LoginScreen onAuthenticated={setUser} />
      </div>
    );
  }

  if (!players && !isOnlinePlaying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_#1E293B_0%,_#0B0E17_75%)]">
        <LobbyModal
          user={user}
          onlineCount={onlineCount}
          serverConnected={serverConnected}
          searchingMatch={searchingMatch}
          waitingRoom={onlineRoom}
          mpError={mpError}
          friends={friends}
          incomingRequests={incomingRequests}
          outgoingRequests={outgoingRequests}
          presenceMap={presenceMap}
          unreadCounts={unreadCounts}
          pendingInvite={pendingInvite}
          onActiveChatChange={handleActiveChatChange}
          onAcceptInvite={handleAcceptInvite}
          onDismissInvite={() => setPendingInvite(null)}
          onInviteFriend={handleInviteFriend}
          onUserUpdated={setUser}
          onLogout={handleLogout}
          onStartOfflineGame={startOfflineGame}
          onFindQuickMatch={(maxPlayers) =>
            socketService.getSocket()?.emit('find_match', { user, maxPlayers })
          }
          onCancelQuickMatch={() => socketService.getSocket()?.emit('cancel_matchmaking')}
          onCreatePrivateRoom={(maxPlayers) =>
            socketService.getSocket()?.emit('create_room', { user, maxPlayers })
          }
          onJoinPrivateRoom={(code) =>
            socketService.getSocket()?.emit('join_room', { user, code })
          }
          onStartPrivateRoom={(code) =>
            socketService.getSocket()?.emit('start_private_room', { code })
          }
          onLeaveRoom={handleReturnToLobby}
        />
      </div>
    );
  }

  const totalUnread = Object.values(unreadCounts).reduce((sum, n) => sum + n, 0);
  const totalSocialBadge = incomingRequests.length + totalUnread;

  const displayPlayers: (PlayerConfig & {
    uid?: string;
    isMe?: boolean;
    disconnected?: boolean;
  })[] =
    isOnlinePlaying && onlineRoom
      ? onlineRoom.players
          .map((op) => ({
            uid: op.uid,
            color: op.color,
            name: op.username,
            isAI: false,
            active: true,
            isMe: op.uid === user.uid,
            disconnected: !op.connected,
          }))
          .sort((a, b) => Number(Boolean(b.isMe)) - Number(Boolean(a.isMe)))
      : (players ?? [])
          .filter((p) => p.active)
          .map((p, idx) => ({
            ...p,
            uid: idx === 0 ? user.uid : undefined,
            isMe: idx === 0,
          }));

  const matchParticipants: MatchParticipant[] = displayPlayers.map((p) => ({
    uid: p.uid,
    color: p.color,
    name: p.name,
    isAI: p.isAI,
    isMe: p.isMe,
  }));

  const canHumanRoll = isOnlinePlaying
    ? phase === 'ROLL' && turnColor === myPerspective
    : phase === 'ROLL' && !players?.find((p) => p.color === turnColor)?.isAI;

  const selectableTokens = isOnlinePlaying
    ? turnColor === myPerspective
      ? validTokens
      : []
    : validTokens;

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-5 bg-[radial-gradient(ellipse_at_top,_#1E293B_0%,_#0B0E17_80%)]">
      {/* Victory Reward Animation + Actual Winner Name + Add Friend Modal */}
      {winner && (
        <MatchResultModal
          winnerColor={winner}
          participants={matchParticipants}
          currentUser={user}
          isOnlineMatch={isOnlinePlaying}
          friends={friends}
          outgoingRequests={outgoingRequests}
          onBackToLobby={handleReturnToLobby}
        />
      )}

      {/* In-Game Friends & Direct Chat Overlay */}
      {inGameFriendsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <FriendsModal
            user={user}
            friends={friends}
            incomingRequests={incomingRequests}
            outgoingRequests={outgoingRequests}
            presenceMap={presenceMap}
            unreadCounts={unreadCounts}
            onActiveChatChange={handleActiveChatChange}
            onClose={() => setInGameFriendsOpen(false)}
            onInviteFriend={(friend) => {
              setInGameFriendsOpen(false);
              handleReturnToLobby();
              setTimeout(() => handleInviteFriend(friend), 150);
            }}
          />
        </div>
      )}

      <header className="max-w-4xl w-full mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleReturnToLobby}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Lobby
        </button>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900/90 border border-amber-400/30 text-xs sm:text-sm font-bold text-amber-300 shadow">
          <span>{statusBanner}</span>
          {secondsLeft !== null && !winner && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-[11px] text-slate-200">
              <Clock className="w-3 h-3 text-amber-400" /> {secondsLeft}s
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setInGameFriendsOpen(true)}
            aria-label="Friends & Chat"
            className="relative p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-amber-400 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            {totalSocialBadge > 0 && (
              <span
                className={`absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-black flex items-center justify-center ${
                  incomingRequests.length > 0
                    ? 'bg-rose-500 text-white'
                    : 'bg-sky-400 text-slate-950'
                }`}
              >
                {totalSocialBadge > 9 ? '9+' : totalSocialBadge}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl w-full mx-auto my-auto py-3 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-center">
        <LudoBoardCanvas
          tokens={tokens}
          validTokens={selectableTokens}
          animatedCoords={animatedCoords}
          particles={particles}
          perspective={myPerspective}
          onSelectToken={handleSelectToken}
        />

        <div className="flex flex-col gap-3 w-full lg:w-64">
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
            {displayPlayers.map((p) => (
              <PlayerPod
                key={p.color}
                player={p}
                tokens={tokens}
                isTurn={turnColor === p.color && !winner}
                isWinner={winner === p.color}
                isMe={p.isMe}
                disconnected={p.disconnected}
                reaction={reactions[p.color]}
              />
            ))}
          </div>

          <div className="flex items-center justify-center py-3 rounded-3xl bg-slate-900/75 border border-slate-800">
            <Dice3D
              value={diceValue}
              rolling={phase === 'ANIMATING_ROLL'}
              canRoll={canHumanRoll}
              activeColor={turnColor}
              onRoll={handleRollDice}
            />
          </div>

          {!winner && (
            <QuickChatBar
              messages={matchChatMessages}
              onLocalMessage={handleLocalMatchChat}
            />
          )}
        </div>
      </main>
    </div>
  );
}