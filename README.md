# GengisBall

GengisBall è una prima migrazione modulare da HTML/JavaScript a **React + Phaser**.
React gestisce menu, selezione livelli, palline e progressi; Phaser gestisce canvas, input, rendering e scena di gioco. La fisica resta un solver custom a tick fissi, così può essere regolata senza dipendere da Arcade Physics. Sono presenti campagna, modalità a tempo (5 minuti) e survival (3 vite), scia colorata per skin, feedback visivi sui booster e dati storici dedicati per tutti i 60 livelli. Alcune meccaniche storiche sono ancora da riportare.

## Avvio

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

## Struttura

```text
src/
  App.jsx                    schermate e stato dell'interfaccia React
  components/GameCanvas.jsx  lifecycle e ponte React ↔ Phaser
  game/
    balls/skins.js           catalogo e requisiti di sblocco delle palline
    balls/drawBall.js        disegni personalizzati delle 22 skin
    data/levels.js           esportazione dei livelli storici
    data/historicLevelData.js geometrie e parametri originali per livello
    data/worlds.js           palette e nomi dei mondi
    obstacles/               costruttori documentati, un file per tipo
    physics/                 costanti e solver a tick fisso
    scenes/GameScene.js      input, simulazione e rendering Phaser
  services/progressStore.js caricamento e salvataggio locale
```

### Aggiungere un ostacolo

Usare il costruttore del tipo in `src/game/obstacles/` e inserirne i parametri nella configurazione del livello in `src/game/data/levels.js`. `hz` indica pericolo, `bo` rimbalzo, `mg`/`mr` magnete, `mx`/`my`/`sp` movimento, `rot` rotazione e `sw`/`dr` interruttore/porta.

### Aggiungere o bilanciare un livello

I 60 record in `src/game/data/historicLevelData.js` contengono partenza, canestro, par e ostacoli di ciascun livello. I costruttori creano istanze runtime nuove a ogni avvio; ogni sei livelli inizia un nuovo mondo.

## Salvataggi

I progressi sono memorizzati in `localStorage` con la chiave e il formato della versione precedente (`tb1`), così le stelle e la skin selezionata restano compatibili. Il profilo online Supabase non è ancora collegato alla nuova UI; `supabase.sql` è mantenuto per una fase successiva.

## Pubblicazione

Il workflow GitHub Actions esegue `npm ci` e `npm run build`, poi pubblica la cartella `dist` su GitHub Pages.
