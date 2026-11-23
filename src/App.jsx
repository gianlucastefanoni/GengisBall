import { useMemo, useState } from 'react';
import { GameCanvas } from './components/GameCanvas.jsx';
import { BallPreview } from './components/BallPreview.jsx';
import { LEVELS } from './game/data/levels.js';
import { WORLDS } from './game/data/worlds.js';
import { BALL_SKINS, isSkinUnlocked } from './game/balls/skins.js';
import { loadProgress, saveProgress } from './services/progressStore.js';

/** Interfaccia React: schermate, avanzamento, selezione livelli e palline. */
export default function App() {
  const [progress, setProgress] = useState(loadProgress);
  const [screen, setScreen] = useState('home');
  const [levelIndex, setLevelIndex] = useState(0);
  const [hud, setHud] = useState({ level: 1, shots: 0 });
  const [result, setResult] = useState(null);
  const [scene, setScene] = useState(null);
  const [mode, setMode] = useState('campaign');
  const totalStars = useMemo(() => progress.stars.reduce((sum, value) => sum + (value || 0), 0), [progress.stars]);

  function updateProgress(next) {
    setProgress(next);
    saveProgress(next);
  }

  function play(index = 0, selectedMode = 'campaign') {
    setLevelIndex(index);
    setMode(selectedMode);
    setResult(null);
    setScreen('game');
  }

  function onOutcome(outcome) {
    if (outcome.sessionOver && outcome.mode === 'timed') {
      updateProgress({ ...progress, tbest: Math.max(progress.tbest || 0, outcome.completed || 0) });
    } else if (outcome.sessionOver && outcome.mode === 'survival') {
      updateProgress({ ...progress, sbest: Math.max(progress.sbest || 0, outcome.reachedLevel || 0) });
    } else if (outcome.won && outcome.mode === 'campaign') {
      const stars = [...progress.stars];
      stars[outcome.levelIndex] = Math.max(stars[outcome.levelIndex] || 0, outcome.stars);
      const best = [...(progress.best || [])];
      best[outcome.levelIndex] = Math.min(best[outcome.levelIndex] || 99, outcome.shots);
      updateProgress({ ...progress, stars, best });
    }
    setResult(outcome);
  }

  function nextLevel() {
    if (levelIndex === LEVELS.length - 1) {
      backToMenu();
      return;
    }
    const next = Math.min(levelIndex + 1, LEVELS.length - 1);
    setLevelIndex(next);
    setResult(null);
    scene?.startLevel(next, progress.skin, 'campaign');
  }

  function retryLevel() {
    setResult(null);
    scene?.retry();
  }

  function replayMode() {
    setResult(null);
    scene?.startLevel(mode === 'campaign' ? levelIndex : 0, progress.skin, mode);
  }

  function backToMenu() {
    setScene(null);
    setResult(null);
    setScreen('home');
  }

  const unlocked = (index) => index === 0 || (progress.stars[index - 1] || 0) > 0;

  return (
    <main className="app-shell">
      <header className="brand-row">
        <span className="brand-mark" aria-hidden="true">●</span>
        <span>GengisBall</span>
        <span className="star-count">★ {totalStars}</span>
      </header>

      {screen === 'home' && (
        <section className="panel home-panel">
          <p className="eyebrow">TIRA · RIMBALZA · FAI CANESTRO</p>
          <h1>GengisBall</h1>
          <p className="intro">Prendi la mira, dosa il tiro e supera gli ostacoli. La traiettoria segue una fisica a gravità fissa.</p>
          <button className="button primary" onClick={() => play(progress.stars.findIndex((stars) => !stars) < 0 ? 0 : Math.max(0, progress.stars.findIndex((stars) => !stars)))}>Gioca</button>
          <button className="button secondary" onClick={() => play(0, 'timed')}>Contro il tempo · 5 min</button>
          <button className="button secondary" onClick={() => play(0, 'survival')}>Survival · 3 vite</button>
          <button className="button secondary" onClick={() => setScreen('levels')}>Scegli livello</button>
          <button className="button secondary" onClick={() => setScreen('skins')}>Personalizza pallina</button>
          <button className="text-button" onClick={() => setScreen('profile')}>Giocatore: {progress.name || 'ospite'} · {totalStars} stelle</button>
        </section>
      )}

      {screen === 'levels' && (
        <section className="panel list-panel">
          <div className="panel-heading"><div><p className="eyebrow">CAMPAGNA</p><h2>Seleziona un livello</h2></div><button className="icon-button" onClick={() => setScreen('home')} aria-label="Torna al menu">×</button></div>
          {WORLDS.map((world, worldIndex) => (
            <div className="world-group" key={world.name}>
              <h3><span className="world-dot" style={{ background: world.top }} /> Mondo {worldIndex + 1} · {world.name}</h3>
              <div className="level-grid">
                {LEVELS.slice(worldIndex * 6, worldIndex * 6 + 6).map((level, localIndex) => {
                  const index = worldIndex * 6 + localIndex;
                  const isUnlocked = unlocked(index);
                  return <button key={level.id} className={`level-button ${isUnlocked ? '' : 'locked'}`} disabled={!isUnlocked} onClick={() => play(index)}>
                    <strong>{String(level.id).padStart(2, '0')}</strong><span>{'★'.repeat(progress.stars[index] || 0)}{'☆'.repeat(3 - (progress.stars[index] || 0))}</span>
                  </button>;
                })}
              </div>
            </div>
          ))}
        </section>
      )}

      {screen === 'skins' && (
        <section className="panel list-panel">
          <div className="panel-heading"><div><p className="eyebrow">COLLEZIONE</p><h2>Scegli la pallina</h2></div><button className="icon-button" onClick={() => setScreen('home')} aria-label="Torna al menu">×</button></div>
          <p className="intro compact">Sblocca nuove skin guadagnando stelle nei livelli.</p>
          <div className="skin-grid">
            {BALL_SKINS.map((skin) => {
              const available = isSkinUnlocked(skin.id, progress);
              return <button key={skin.id} className={`skin-card ${progress.skin === skin.id ? 'selected' : ''}`} disabled={!available} onClick={() => updateProgress({ ...progress, skin: skin.id })}>
                <BallPreview skinId={skin.id} label={`Pallina ${skin.name}`} /><strong>{skin.name}</strong><small>{available ? (progress.skin === skin.id ? 'In uso' : 'Seleziona') : 'Bloccata'}</small>
              </button>;
            })}
          </div>
        </section>
      )}

      {screen === 'profile' && (
        <section className="panel profile-panel">
          <div className="panel-heading"><div><p className="eyebrow">PROGRESSI LOCALI</p><h2>Giocatore</h2></div><button className="icon-button" onClick={() => setScreen('home')} aria-label="Torna al menu">×</button></div>
          <label htmlFor="player-name">Nome giocatore</label>
          <input id="player-name" maxLength={12} value={progress.name || ''} placeholder="Il tuo nome" onChange={(event) => updateProgress({ ...progress, name: event.target.value.slice(0, 12) })} />
          <p className="intro compact">I progressi vengono salvati in questo browser. Stelle totali: {totalStars}.</p>
        </section>
      )}

      {screen === 'game' && (
        <section className="play-layout">
          <div className="game-toolbar"><button className="button small secondary" onClick={backToMenu}>Menu</button><div className="level-label">{mode === 'timed' ? `⏱ ${Math.floor((hud.secondsLeft || 0) / 60)}:${String((hud.secondsLeft || 0) % 60).padStart(2, '0')} · Fatti ${hud.completed || 0}` : mode === 'survival' ? `${'♥'.repeat(hud.lives ?? 3)}${'♡'.repeat(3 - (hud.lives ?? 3))} · Livello ${hud.level}` : `Livello ${hud.level}`} <span>·</span> Tiri {hud.shots}</div><button className="button small secondary" disabled={!scene || Boolean(result)} onClick={retryLevel}>{mode === 'timed' ? 'Salta' : mode === 'survival' ? 'Riprova −♥' : 'Riprova'}</button></div>
          <div className="game-frame">
            <GameCanvas levelIndex={levelIndex} skinId={progress.skin} mode={mode} onHud={setHud} onOutcome={onOutcome} onSceneReady={setScene} />
            {result && <div className="result-overlay"><p className="eyebrow">{result.sessionOver ? (mode === 'timed' ? 'TEMPO SCADUTO' : 'SURVIVAL') : result.won ? 'CANESTRO!' : 'RITENTA'}</p><h2>{result.sessionOver ? (mode === 'timed' ? 'Partita terminata' : result.won ? 'Survival completato!' : 'Game over') : result.won ? 'Bel tiro!' : 'Ci sei quasi'}</h2><div className="result-stars">{result.sessionOver ? (mode === 'timed' ? `${result.completed || 0} livelli` : `Livello ${result.reachedLevel || 1}`) : '★'.repeat(result.stars)}{!result.sessionOver && '☆'.repeat(3 - result.stars)}</div><p>{result.sessionOver ? (mode === 'timed' ? `Record: ${Math.max(progress.tbest || 0, result.completed || 0)} livelli` : `Record: livello ${Math.max(progress.sbest || 0, result.reachedLevel || 0)}`) : result.won ? `Completato in ${result.shots} tiri` : 'Regola la mira e prova ancora.'}</p><div className="result-actions"><button className="button primary" onClick={result.sessionOver ? replayMode : result.won ? nextLevel : retryLevel}>{result.sessionOver ? 'Rigioca' : result.won ? (levelIndex === LEVELS.length - 1 ? 'Menu' : 'Continua') : 'Riprova'}</button><button className="button secondary" onClick={backToMenu}>Menu</button></div></div>}
          </div>
          <p className="game-hint">Trascina all’indietro e rilascia per tirare</p>
        </section>
      )}
    </main>
  );
}
