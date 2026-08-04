import * as Phaser from 'phaser';
import { fitCameraToDesign } from '../utils/cameraFit';
import { THEME, FONT_FAMILY, TEXT_RESOLUTION } from '../config/theme';
import { layout } from '../utils/responsive';
import { Button } from '../ui/Button';
import { createNoteGlyph } from '../ui/NoteGlyph';
import { getSongById, getDifficultyChart } from '../data/songRegistry';
import { RhythmEngine } from '../systems/RhythmEngine';
import type { ScheduledNote } from '../systems/RhythmEngine';
import { calculateJudgmentScore, nextCombo, calculateAccuracy, calculateGrade, calculateStars } from '../systems/ScoreSystem';
import { MultiTouchLaneTracker, keyCodeToLane } from '../systems/InputSystem';
import { COUNTDOWN_STEPS, COUNTDOWN_STEP_DURATION_MS, LANE_COUNT, LANE_NOTE_NAMES, LANE_NOTE_LETTERS, NOTE_TRAVEL_TIME_MS, NOTE_TRAVEL_START_OFFSET, SPEED_UP_MAX_MULTIPLIER, SPEED_UP_STEP_INCREMENT, MISTAKE_GAUGE_START_LEVEL, MISTAKE_GAUGE_LIMIT } from '../config/constants';
import { formatScore } from '../utils/formatting';
import { sessionState } from '../state/sessionState';
import { submitPlayResult } from '../storage/repositories';
import { determineSaveOutcome } from '../systems/SaveOutcome';
import type { JudgmentType, JudgmentCounts, PlayResult } from '../types/score';

const JUDGMENT_LABELS: Record<JudgmentType, string> = {
  perfect: 'Perfect!',
  great: 'Great',
  good: 'Good',
  miss: '괜찮아요',
};

const JUDGMENT_COLORS: Record<JudgmentType, number> = {
  perfect: THEME.judgmentPerfect,
  great: THEME.judgmentGreat,
  good: THEME.judgmentGood,
  miss: THEME.judgmentMiss,
};

export class GameScene extends Phaser.Scene {
  private engine!: RhythmEngine;
  private songTitle = '';
  private difficultyLabel = '';
  private showNoteNames = true;
  private highlightUpcoming = true;

  private judgmentLineY = layout.y(0.62);
  private keyboardTopY = layout.y(0.72);
  private laneWidth = 0;
  private laneStartX = 0;

  private noteVisuals = new Map<string, Phaser.GameObjects.Container>();
  private keyRects: Phaser.GameObjects.Rectangle[] = [];
  private mistakeGaugeActive = false;
  private mistakeCount = 0;
  private mistakeGaugeFill!: Phaser.GameObjects.Rectangle;
  private touchTracker = new MultiTouchLaneTracker();

  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private counts: JudgmentCounts = { perfect: 0, great: 0, good: 0, miss: 0 };

  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private progressBarFill!: Phaser.GameObjects.Rectangle;
  private judgmentPopup!: Phaser.GameObjects.Text;

  private isRunning = false;
  private isEnded = false;
  private visibilityHandler = () => this.handleVisibilityChange();

  constructor() {
    super('Game');
  }

  create(): void {
    fitCameraToDesign(this);
    this.cameras.main.setBackgroundColor(THEME.background);
    this.isRunning = false;
    this.isEnded = false;
    this.score = sessionState.cumulativeScore;
    this.combo = 0;
    this.maxCombo = 0;
    this.counts = { perfect: 0, great: 0, good: 0, miss: 0 };
    this.noteVisuals.clear();
    this.keyRects = [];
    this.mistakeGaugeActive = sessionState.progressiveLevel >= MISTAKE_GAUGE_START_LEVEL;
    this.mistakeCount = 0;
    this.touchTracker.releaseAll();

    const song = sessionState.songId ? getSongById(sessionState.songId) : undefined;
    const chart = sessionState.songId && sessionState.difficultyId ? getDifficultyChart(sessionState.songId, sessionState.difficultyId) : undefined;

    if (!song || !chart) {
      // 데이터가 없으면 안전하게 곡 선택 화면으로 되돌아간다
      this.scene.start('SongSelect');
      return;
    }

    this.songTitle = song.title;
    this.difficultyLabel = chart.label;
    this.showNoteNames = chart.showNoteNames;
    this.highlightUpcoming = chart.highlightUpcomingKey;

    const effectiveBpm = song.bpm * sessionState.speedMultiplier;

    this.engine = new RhythmEngine({
      bpm: effectiveBpm,
      notes: chart.notes,
      judgmentWindowMultiplier: chart.judgmentWindowMultiplier,
    });

    this.laneWidth = 760 / LANE_COUNT;
    this.laneStartX = layout.centerX - 760 / 2;

    this.buildTopBar();
    this.buildPlayfield();
    this.buildKeyboard();

    document.addEventListener('visibilitychange', this.visibilityHandler);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.game.canvas.removeEventListener('pointercancel', this.nativePointerCancelHandler);
      this.input.keyboard?.off('keydown', this.handleKeyDown, this);
      this.input.keyboard?.off('keyup', this.handleKeyUp, this);
      // 씬 전환 중 남아 있는 포인터/건반 상태를 확실히 초기화한다
      this.touchTracker.releaseAll();
    });
    this.events.once(Phaser.Scenes.Events.WAKE, () => this.onResumeFromPause());

    this.input.keyboard?.on('keydown', this.handleKeyDown, this);
    this.input.keyboard?.on('keyup', this.handleKeyUp, this);

    // 안전망: 개별 건반(pointerup/pointerout)에서 놓친 해제 이벤트를 보완한다.
    // (예: 건반 영역 밖에서 손가락을 뗀 진짜 "pointerupoutside" 상황)
    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => this.handleLaneRelease(pointer.id));

    // 안전망: iOS 시스템 제스처 등으로 터치가 강제 취소되는 pointercancel 처리.
    // Phaser의 입력 플러그인은 pointercancel을 별도 이벤트로 노출하지 않으므로
    // 네이티브 캔버스 이벤트를 직접 듣는다.
    this.game.canvas.addEventListener('pointercancel', this.nativePointerCancelHandler);

    this.runCountdown();
  }

  private nativePointerCancelHandler = (event: PointerEvent): void => {
    this.handleLaneRelease(event.pointerId);
  };

  // ---------------------------------------------------------------------
  // UI 구성
  // ---------------------------------------------------------------------

  private buildTopBar(): void {
    const logo = this.add.image(70, 34, 'muel-logo').setOrigin(0.5);
    logo.setScale(Math.min(1, 54 / logo.height));

    const levelSuffix = sessionState.progressiveLevel > 1 ? ` · Lv.${sessionState.progressiveLevel}` : '';
    this.add
      .text(140, 34, `${this.songTitle} · ${this.difficultyLabel}${levelSuffix}`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '19px',
        color: '#7a6f63',
      })
      .setOrigin(0, 0.5);

    this.scoreText = this.add
      .text(layout.centerX, 30, '0점', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5);

    this.comboText = this.add
      .text(layout.centerX, 58, '', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '19px',
        color: '#e8a23d',
      })
      .setOrigin(0.5);

    const progressTrackWidth = 220;
    this.add
      .rectangle(layout.width - 260, 34, progressTrackWidth, 10, THEME.backgroundAlt)
      .setOrigin(0, 0.5)
      .setStrokeStyle(1, THEME.secondaryLight);
    this.progressBarFill = this.add.rectangle(layout.width - 260, 34, 1, 10, THEME.accent).setOrigin(0, 0.5);

    new Button(this, layout.width - 60, 34, {
      label: '⏸',
      variant: 'ghost',
      width: 56,
      height: 56,
      fontSize: 25,
      onClick: () => this.pauseGame(),
    });

    if (this.mistakeGaugeActive) {
      this.buildMistakeGauge();
    }
  }

  /** 레벨 3부터 등장하는 실수 게이지. 놓칠 때마다(Miss) 오른쪽 막대가 차오르고, 가득 차면 즉시 종료된다 */
  private buildMistakeGauge(): void {
    const width = 160;
    const height = 14;
    const x = layout.width - 40 - width;
    const y = 74;

    this.add.rectangle(x, y, width, height, THEME.backgroundAlt).setOrigin(0, 0.5).setStrokeStyle(1, THEME.secondaryLight);
    this.mistakeGaugeFill = this.add.rectangle(x, y, 1, height, THEME.danger).setOrigin(0, 0.5);

    this.add
      .text(x + width, y - 16, '⚠️ 실수 게이지', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '12px',
        color: '#b8ada2',
      })
      .setOrigin(1, 0.5);
  }

  private buildPlayfield(): void {
    // 판정선
    this.add
      .rectangle(layout.centerX, this.judgmentLineY, this.laneWidth * LANE_COUNT, 4, THEME.secondary, 0.6)
      .setOrigin(0.5);

    this.judgmentPopup = this.add
      .text(layout.centerX, this.judgmentLineY - 90, '', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '38px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    // 레인 구분선 (노트가 내려오는 전체 구간을 덮도록 NOTE_TRAVEL_START_OFFSET과 맞춘다)
    for (let i = 0; i <= LANE_COUNT; i++) {
      const x = this.laneStartX + i * this.laneWidth;
      this.add.rectangle(x, this.judgmentLineY - NOTE_TRAVEL_START_OFFSET / 2, 1, NOTE_TRAVEL_START_OFFSET, THEME.secondaryLight, 0.35);
    }
  }

  /** 흰 건반 사이, 실제 피아노처럼 보이도록 검은 건반을 장식으로 그려 넣는다 (연주 판정에는 사용하지 않음) */
  private buildBlackKeys(keyTopY: number, whiteKeyHeight: number): void {
    // 레인 0~7 = 도 레 미 파 솔 라 시 도. 실제 피아노처럼 미-파, 시-도 사이에는 검은 건반이 없다.
    const boundariesWithBlackKey = [0, 1, 3, 4, 5];
    const blackKeyWidth = this.laneWidth * 0.5;
    const blackKeyHeight = whiteKeyHeight * 0.58;

    for (const laneIndex of boundariesWithBlackKey) {
      const boundaryX = this.laneStartX + (laneIndex + 1) * this.laneWidth;
      const blackKey = this.add
        .rectangle(boundaryX, keyTopY + blackKeyHeight / 2, blackKeyWidth, blackKeyHeight, THEME.primary)
        .setOrigin(0.5)
        .setDepth(5);
      blackKey.setStrokeStyle(1, 0x000000, 0.3);
    }
  }

  private buildKeyboard(): void {
    const keyWidth = this.laneWidth; // 흰 건반을 서로 붙여서 실제 피아노처럼 보이게 한다
    const keyHeight = 130;
    const keyTopY = this.keyboardTopY;

    for (let lane = 0; lane < LANE_COUNT; lane++) {
      const x = this.laneStartX + lane * this.laneWidth + this.laneWidth / 2;
      const y = keyTopY + keyHeight / 2;

      const key = this.add
        .rectangle(x, y, keyWidth - 2, keyHeight, THEME.surface)
        .setStrokeStyle(2, THEME.secondaryLight)
        .setInteractive();
      this.keyRects.push(key);

      if (this.showNoteNames) {
        this.add
          .text(x, y + keyHeight / 2 - 34, LANE_NOTE_NAMES[lane] ?? '', {
            fontFamily: FONT_FAMILY,
            resolution: TEXT_RESOLUTION,
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#8a6f57',
          })
          .setOrigin(0.5);
      }

      // 계이름 밑에 실제 음이름(C~B) 표기: 도=C, 레=D, 미=E, 파=F, 솔=G, 라=A, 시=B, (높은)도=C
      this.add
        .text(x, y + keyHeight / 2 - 12, LANE_NOTE_LETTERS[lane] ?? '', {
          fontFamily: FONT_FAMILY,
          resolution: TEXT_RESOLUTION,
          fontSize: '16px',
          color: '#b8ada2',
        })
        .setOrigin(0.5);

      key.on('pointerdown', (pointer: Phaser.Input.Pointer) => this.handleLanePress(lane, pointer.id));
      key.on('pointerup', (pointer: Phaser.Input.Pointer) => this.handleLaneRelease(pointer.id));
      key.on('pointerout', (pointer: Phaser.Input.Pointer) => this.handleLaneRelease(pointer.id));
    }

    // 실제 피아노처럼 보이도록 장식용 검은 건반을 흰 건반 위에 그린다 (연주에는 사용하지 않음)
    this.buildBlackKeys(keyTopY, keyHeight);
  }

  // ---------------------------------------------------------------------
  // 카운트다운 & 진행
  // ---------------------------------------------------------------------

  private runCountdown(): void {
    const countdownText = this.add
      .text(layout.centerX, layout.centerY, '', {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '77px',
        fontStyle: 'bold',
        color: '#2b2b2b',
      })
      .setOrigin(0.5)
      .setDepth(500);

    let step = 0;
    const showNext = () => {
      if (step >= COUNTDOWN_STEPS.length) {
        countdownText.destroy();
        this.startPlaying();
        return;
      }
      countdownText.setText(COUNTDOWN_STEPS[step] ?? '');
      if (step === COUNTDOWN_STEPS.length - 1) {
        sessionState.audio.effectSynth.countdownGo();
      } else {
        sessionState.audio.effectSynth.countdownTick();
      }
      step += 1;
      this.time.delayedCall(COUNTDOWN_STEP_DURATION_MS, showNext);
    };
    showNext();
  }

  private startPlaying(): void {
    sessionState.audio.startSong();
    this.isRunning = true;
  }

  override update(): void {
    if (!this.isRunning || this.isEnded) return;

    const currentMs = sessionState.audio.getAdjustedPositionMs();

    this.updateNoteVisuals(currentMs);

    const missed = this.engine.collectAutoMisses(currentMs);
    for (const note of missed) {
      this.applyJudgment(note, 'miss');
    }

    this.progressBarFill.width = Math.max(
      1,
      220 * (this.counts.perfect + this.counts.great + this.counts.good + this.counts.miss) / Math.max(1, this.engine.totalNotes),
    );

    if (this.engine.isComplete(currentMs)) {
      this.endSong(true);
    }
  }

  private updateNoteVisuals(currentMs: number): void {
    const upcoming = this.engine.getUpcomingNotes(currentMs, NOTE_TRAVEL_TIME_MS + 200);

    if (this.highlightUpcoming) {
      this.updateKeyHighlights(upcoming, currentMs);
    }

    for (const note of upcoming) {
      if (note.judged) continue;
      let visual = this.noteVisuals.get(note.id);
      if (!visual) {
        const x = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
        visual = createNoteGlyph(this, x, -50, this.laneWidth, THEME.accent, THEME.accentDark, note.visualValue);
        this.noteVisuals.set(note.id, visual);
      }
      const progress = 1 - (note.targetTimeMs - currentMs) / NOTE_TRAVEL_TIME_MS;
      const startY = this.judgmentLineY - NOTE_TRAVEL_START_OFFSET;
      visual.y = Phaser.Math.Linear(startY, this.judgmentLineY, Phaser.Math.Clamp(progress, 0, 1.15));
    }

    // 판정된 노트의 시각 요소 정리는 applyJudgment / collectAutoMisses에서 처리
  }

  /** '처음' 난이도에서 곧 도착할 노트의 건반을 미리 강조 표시한다 */
  private updateKeyHighlights(upcoming: ScheduledNote[], currentMs: number): void {
    const highlightThresholdMs = 350;
    const lanesToHighlight = new Set(
      upcoming.filter((n) => !n.judged && n.targetTimeMs - currentMs <= highlightThresholdMs).map((n) => n.lane),
    );
    this.keyRects.forEach((key, lane) => {
      if (this.touchTracker.isLanePressed(lane)) return; // 눌린 키는 눌림 색이 우선
      key.setFillStyle(lanesToHighlight.has(lane) ? THEME.accentLight : THEME.surface);
    });
  }

  // ---------------------------------------------------------------------
  // 입력 처리
  // ---------------------------------------------------------------------

  /**
   * 키보드 입력도 터치와 동일한 MultiTouchLaneTracker로 추적한다.
   * 실제 터치 포인터 id는 항상 0 이상이므로, 키보드는 레인별로 겹치지 않는
   * 음수 가상 id를 사용해 같은 추적기 안에서 안전하게 공존시킨다.
   * 이렇게 하면 "터치로 누른 채 키보드로도 같은 레인을 누르는" 것 같은
   * 극단적 상황에서도 건반 시각 상태가 꼬이지 않고, 두 입력 소스 중 하나가
   * 이미 눌려 있으면 다른 쪽이 눌림 상태를 함부로 해제하지 않는다.
   */
  private static readonly KEYBOARD_POINTER_BASE = -1000;

  private handleLanePress(lane: number, pointerId: number): void {
    if (!this.isRunning) return;
    const wasEmpty = this.touchTracker.press(pointerId, lane);
    if (wasEmpty) this.flashKey(lane, true);
    this.registerHit(lane);
  }

  private handleLaneRelease(pointerId: number): void {
    const lane = this.touchTracker.release(pointerId);
    if (lane !== undefined && !this.touchTracker.isLanePressed(lane)) {
      this.flashKey(lane, false);
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isRunning || event.repeat) return;
    const lane = keyCodeToLane(event.code);
    if (lane === undefined) return;
    this.handleLanePress(lane, GameScene.KEYBOARD_POINTER_BASE - lane);
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const lane = keyCodeToLane(event.code);
    if (lane === undefined) return;
    this.handleLaneRelease(GameScene.KEYBOARD_POINTER_BASE - lane);
  }

  private registerHit(lane: number): void {
    sessionState.audio.init();
    const currentMs = sessionState.audio.getAdjustedPositionMs();
    const result = this.engine.handleLaneInput(lane, currentMs);
    if (result) {
      sessionState.audio.pianoSynth.playLane(lane);
      this.applyJudgment(result.note, result.judgment);
    } else {
      // 판정 대상 노트가 없어도 건반음은 들려줘 태블릿에서 자연스러운 피아노처럼 느껴지게 한다
      sessionState.audio.pianoSynth.playLane(lane, undefined, 0.5);
    }
  }

  private flashKey(lane: number, pressed: boolean): void {
    const key = this.keyRects[lane];
    if (!key) return;
    key.setFillStyle(pressed ? THEME.surfaceAlt : THEME.surface);
    this.tweens.add({ targets: key, scaleY: pressed ? 0.94 : 1, duration: 90, ease: 'Quad.easeOut' });
  }

  // ---------------------------------------------------------------------
  // 판정 처리
  // ---------------------------------------------------------------------

  private applyJudgment(note: ScheduledNote, judgment: JudgmentType): void {
    const gained = calculateJudgmentScore(judgment, this.combo);
    this.score += gained;
    this.combo = nextCombo(this.combo, judgment);
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.counts[judgment] += 1;

    this.scoreText.setText(`${formatScore(this.score)}점`);
    this.comboText.setText(this.combo >= 2 ? `콤보 ${this.combo}` : '');

    this.playJudgmentEffect(note, judgment);
    this.destroyNoteVisual(note.id, judgment);

    switch (judgment) {
      case 'perfect':
        sessionState.audio.effectSynth.perfect();
        break;
      case 'great':
        sessionState.audio.effectSynth.great();
        break;
      case 'good':
        sessionState.audio.effectSynth.good();
        break;
      case 'miss':
        sessionState.audio.effectSynth.miss();
        if (this.mistakeGaugeActive) {
          this.fillMistakeGauge();
        }
        break;
    }
  }

  /** 실수 게이지를 한 칸 채운다. 게이지가 가득 차면 즉시 게임을 종료한다 */
  private fillMistakeGauge(): void {
    if (this.mistakeCount >= MISTAKE_GAUGE_LIMIT) return;
    this.mistakeCount += 1;

    const width = 160;
    const ratio = this.mistakeCount / MISTAKE_GAUGE_LIMIT;
    this.tweens.add({
      targets: this.mistakeGaugeFill,
      width: Math.max(1, width * ratio),
      duration: 200,
      ease: 'Quad.easeOut',
    });

    if (this.mistakeCount >= MISTAKE_GAUGE_LIMIT) {
      this.time.delayedCall(250, () => this.endSong(false));
    }
  }

  private playJudgmentEffect(note: ScheduledNote, judgment: JudgmentType): void {
    const x = this.laneStartX + note.lane * this.laneWidth + this.laneWidth / 2;
    const y = this.judgmentLineY;
    const color = JUDGMENT_COLORS[judgment];

    this.judgmentPopup.setText(JUDGMENT_LABELS[judgment]);
    this.judgmentPopup.setColor(cssColor(color));
    this.judgmentPopup.setAlpha(1).setScale(1.15);
    this.tweens.add({ targets: this.judgmentPopup, alpha: 0, scale: 1, duration: 420, ease: 'Quad.easeOut' });

    if (judgment === 'miss') {
      const flash = this.add.circle(x, y, 20, color, 0.25);
      this.tweens.add({ targets: flash, alpha: 0, scale: 1.3, duration: 260, onComplete: () => flash.destroy() });
      return;
    }

    // 빛 효과
    const glow = this.add.circle(x, y, judgment === 'perfect' ? 34 : 24, color, 0.35);
    this.tweens.add({ targets: glow, scale: judgment === 'perfect' ? 2.2 : 1.6, alpha: 0, duration: 320, onComplete: () => glow.destroy() });

    // 간단한 파티클(작은 원 여러 개가 퍼짐)
    const particleCount = judgment === 'perfect' ? 8 : 5;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = judgment === 'perfect' ? 46 : 32;
      const p = this.add.circle(x, y, judgment === 'perfect' ? 4 : 3, color, 0.9);
      this.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 10,
        alpha: 0,
        duration: 380,
        ease: 'Quad.easeOut',
        onComplete: () => p.destroy(),
      });
    }
  }

  private destroyNoteVisual(noteId: string, judgment: JudgmentType): void {
    const visual = this.noteVisuals.get(noteId);
    if (!visual) return;
    this.noteVisuals.delete(noteId);
    if (judgment === 'miss') {
      this.tweens.add({ targets: visual, alpha: 0, duration: 200, onComplete: () => visual.destroy() });
    } else {
      this.tweens.add({ targets: visual, alpha: 0, scale: 1.3, duration: 180, onComplete: () => visual.destroy() });
    }
  }

  // ---------------------------------------------------------------------
  // 일시정지 / 종료
  // ---------------------------------------------------------------------

  private handleVisibilityChange(): void {
    if (document.hidden && this.isRunning && !this.isEnded) {
      this.pauseGame();
    }
  }

  private pauseGame(): void {
    if (!this.isRunning || this.isEnded) return;
    this.isRunning = false;
    sessionState.audio.pauseSong();
    sessionState.audio.suspendContext();
    this.resetAllKeyPressState();
    this.scene.sleep();
    this.scene.launch('Pause');
  }

  /** 일시정지 시 눌려 있던 건반(터치/키보드 모두)의 내부 상태와 시각 효과를 초기화한다 */
  private resetAllKeyPressState(): void {
    this.touchTracker.releaseAll();
    this.keyRects.forEach((key) => {
      key.setFillStyle(THEME.surface);
      key.setScale(1, 1);
    });
  }

  private onResumeFromPause(): void {
    sessionState.audio.resumeContext();
    this.isRunning = true;
  }

  private endSong(completed: boolean): void {
    if (this.isEnded) return;
    this.isEnded = true;
    this.isRunning = false;
    sessionState.audio.stopSong();

    // this.score는 이번 판 시작 시 이미 이전 단계까지의 누적 점수로 초기화되어 있으므로 그대로 대입한다.
    sessionState.cumulativeScore = this.score;
    sessionState.cumulativeJudgments.perfect += this.counts.perfect;
    sessionState.cumulativeJudgments.great += this.counts.great;
    sessionState.cumulativeJudgments.good += this.counts.good;
    sessionState.cumulativeJudgments.miss += this.counts.miss;
    sessionState.cumulativeMaxCombo = Math.max(sessionState.cumulativeMaxCombo, this.maxCombo);

    const canAutoContinue = completed && sessionState.speedMultiplier < SPEED_UP_MAX_MULTIPLIER;

    if (canAutoContinue) {
      sessionState.audio.effectSynth.songComplete();
      this.showLevelUpAndContinue();
      return;
    }

    // 체인이 여기서 끝난다 (실패했거나, 최고 속도까지 도달했거나, 중간에 완주하지 못함) — 누적 결과로 최종 기록을 만든다.
    const cumulativeAccuracy = calculateAccuracy(sessionState.cumulativeJudgments);
    const cumulativeGrade = calculateGrade(cumulativeAccuracy);
    const cumulativeStars = calculateStars(cumulativeAccuracy, sessionState.cumulativeJudgments.miss, completed);

    const result: PlayResult = {
      songId: sessionState.songId ?? '',
      difficultyId: sessionState.difficultyId ?? '',
      studentName: sessionState.studentName,
      score: sessionState.cumulativeScore,
      maxCombo: sessionState.cumulativeMaxCombo,
      accuracy: cumulativeAccuracy,
      judgments: { ...sessionState.cumulativeJudgments },
      grade: cumulativeGrade,
      stars: cumulativeStars,
      completed,
      playedAt: Date.now(),
    };

    sessionState.lastResult = result;

    if (completed) {
      sessionState.audio.effectSynth.songComplete();
    }

    void this.saveAndProceed(result);
  }

  /** 다음 단계로 자동 진입한다: 짧은 "레벨 업" 안내 후 곧바로 더 빠른 속도로 다시 시작한다 */
  private showLevelUpAndContinue(): void {
    sessionState.progressiveLevel += 1;
    sessionState.speedMultiplier = Math.min(SPEED_UP_MAX_MULTIPLIER, sessionState.speedMultiplier + SPEED_UP_STEP_INCREMENT);

    const overlay = this.add.rectangle(layout.centerX, layout.centerY, layout.width, layout.height, THEME.background, 0.92).setDepth(590);
    const text = this.add
      .text(layout.centerX, layout.centerY, `레벨 ${sessionState.progressiveLevel}!\n더 빨라져요 🚀`, {
        fontFamily: FONT_FAMILY,
        resolution: TEXT_RESOLUTION,
        fontSize: '52px',
        fontStyle: 'bold',
        color: '#2b2b2b',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(600);

    this.time.delayedCall(1300, () => {
      overlay.destroy();
      text.destroy();
      this.scene.restart(); // create()를 다시 호출해 새 속도로 곧바로 이어서 시작한다
    });
  }

  private async saveAndProceed(result: PlayResult): Promise<void> {
    const { outcome, saveFailed } = await determineSaveOutcome(() => submitPlayResult(result));
    sessionState.lastResultOutcome = outcome;
    sessionState.lastSaveFailed = saveFailed;
    this.scene.start('Result');
  }
}

function cssColor(hex: number): string {
  return `#${hex.toString(16).padStart(6, '0')}`;
}
