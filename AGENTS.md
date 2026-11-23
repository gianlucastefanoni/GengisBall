# GengisBall — guida operativa per agenti

Questo documento è il punto d’ingresso per gli agenti che lavorano sul repository. Descrive l’architettura attuale, i flussi principali, i limiti noti e le regole da seguire. Va letto prima di modificare il progetto; non sostituisce la lettura dei moduli direttamente coinvolti nel task.

## 1. Scopo e stato del progetto

GengisBall è un gioco 2D di tiri con pallina, canestro e ostacoli. Il progetto è stato migrato da una pagina HTML monolitica a **React + Phaser + Vite**:

- **React** gestisce menu, schermate, selezione livelli/skin, stato UI e risultati.
- **Phaser** possiede il canvas, l’input di gioco, la scena e il rendering.
- La fisica è un solver JavaScript custom a passo fisso; non è Phaser Arcade Physics né Matter.
- I progressi locali sono salvati in `localStorage` sotto la chiave `tb1`.

**Importante:** questa è una migrazione modulare iniziale, non ancora una riproduzione completa del gioco precedente. I 60 record di livello conservano posizione di partenza, canestro e par, ma gli ostacoli sono ricostruiti da schemi riutilizzabili. Non affermare che le geometrie o le meccaniche siano equivalenti all’originale senza averle confrontate e reintrodotte.

## 2. Avvio, build e deploy

Requisiti: Node.js compatibile con Vite 8 (Node 20.19+ oppure una versione supportata più recente) e npm.

```sh
npm install
npm run dev
npm run build
npm run preview
```

`npm run check` esegue la build Vite. La configurazione è in `vite.config.mjs`; `base: './'` è intenzionale per GitHub Pages sotto un percorso repository. Il workflow `.github/workflows/deploy.yml` installa con `npm ci`, esegue la build e pubblica `dist` su GitHub Pages per i push su `main` o `master`.

In alcuni ambienti Windows il lancio di script npm può essere bloccato dai criteri di gruppo. Se succede, distinguere il blocco ambientale da un errore del codice; verificare la build con il runtime Node/Vite disponibile e riportare chiaramente il metodo usato.

## 3. Mappa dei moduli

```text
index.html                         contenitore Vite e root React
vite.config.mjs                    configurazione Vite e base per Pages
src/
  main.jsx                         bootstrap React
  App.jsx                          schermate, progressi, selezione, risultati
  styles.css                       stile dell’interfaccia DOM
  components/
    GameCanvas.jsx                 lifecycle e ponte React ↔ Phaser
  game/
    createGame.js                  costruzione dell’istanza Phaser
    balls/skins.js                 catalogo skin e regole di sblocco
    balls/drawBall.js              pattern canvas per tutte le 22 skin
    data/
      historicLevelData.js    record dei 60 livelli originali e istanze runtime
      worlds.js                    nomi e palette dei mondi
      levels.js                    esportazione del dataset storico dei livelli
    obstacles/
      beam.js                      segmento/capsula e suoi endpoint animati
      rectangle.js                 rettangolo
      circle.js                    cerchio
      portal.js                    coppie di portali
      stone.js                     dati per pietre mobili
    physics/
      constants.js                 dimensioni, gravità, potenza, tick
      step.js                      stepBall() e test del canestro
    scenes/GameScene.js            input, ciclo fisico e disegno Phaser
  services/progressStore.js        compatibilità salvataggi localStorage
supabase.sql                       schema SQL storico; non collegato alla UI attuale
.github/workflows/deploy.yml       build e deploy Pages
```

## 4. Flusso dell’applicazione

1. `src/main.jsx` monta `App` dentro `#root`.
2. `App` carica i progressi tramite `loadProgress()` e gestisce gli schermi React.
3. Quando lo schermo diventa `game`, `GameCanvas` carica dinamicamente `createGame.js` e crea Phaser. Il caricamento lazy evita di includere Phaser nel bundle iniziale React.
4. `createGame()` crea `GameScene`, collega i callback (`onHud`, `onOutcome`) e avvia il livello dopo l’evento `READY` di Phaser.
5. `GameScene.startLevel()` crea una copia runtime del record con `structuredClone()`, inizializza la pallina e avvia la simulazione.
6. Il puntatore imposta una direzione di tiro inversa al trascinamento; `stepBall()` aggiorna posizione e collisioni a tick fissi. La previsione della traiettoria usa lo stesso solver.
7. La scena segnala vittoria/sconfitta a React; `App` mostra l’overlay e aggiorna le stelle. Le sessioni tempo e survival avanzano/terminano nella scena; React persiste i relativi record.
In campagna un tiro fallito riporta subito la pallina alla partenza senza azzerare i tiri; il contatto con un ostacolo letale aggiunge il burst e l’anello rossi storici. Il pulsante Riprova esplicito continua invece a riavviare il livello.

## 5. Dati dei livelli e ostacoli
I 60 record storici risiedono in `src/game/data/historicLevelData.js`; `src/game/data/levels.js` li esporta. Ogni livello ha posizione di partenza, canestro, par e geometria ostacoli dedicata. I dati speciali includono portali, pietre, zone, canestri stretti e flag dei livelli bui. I costruttori in `src/game/obstacles/` restituiscono istanze runtime con proprietà brevi compatibili con solver e renderer.

Le dieci palette di `src/game/data/worlds.js` corrispondono ai mondi storici. L’identità visiva dei materiali degli ostacoli deriva dalla palette del mondo, con colori separati per pericoli, booster, interruttori e magneti.


I costruttori degli ostacoli sono separati per tipo e documentati nei rispettivi file. Le proprietà opzionali usate attualmente includono:

- `hz`: contatto pericoloso;
- `bo`: rimbalzo potenziato;
- `mg` e `mr`: intensità e raggio del magnete;
- `mx`, `my`, `sp`: ampiezza e velocità di oscillazione;
- `rot`: rotazione per tick;
- `sw`, `dr`: identificatori per interruttore/porta, **non ancora implementati come ciclo di gioco completo**.

Le proprietà e i costruttori mantengono in parte i nomi brevi della versione precedente. Se li si rinomina, aggiornare insieme costruttori, dati, solver e renderer. Non introdurre formati misti senza una conversione esplicita.

## 6. Fisica e rendering

Le costanti condivise si trovano in `src/game/physics/constants.js` (mondo logico 360×640, gravità, raggio e potenza). `GameScene.update()` usa un accumulatore e un tick fisso; `stepBall(ball, obstacles, tick)` è in `src/game/physics/step.js`.
`stepBall()` restituisce eventi `obstacle-hit` alle collisioni ed eventi `booster-hit` solo quando una superficie `bo` imprime davvero un rimbalzo. `GameScene` usa questi ultimi per il flash dell’ostacolo, l’anello/particelle d’impatto e il breve boost verde della scia; i livelli bui rivelano gli ostacoli colpiti. I colori base della scia per pelle sono in `src/game/balls/skins.js`.

Il canestro ha tre segmenti collisionanti (montanti laterali e base della retina) creati da `GameScene.createBasketColliders()`. Il punto vale solo se la palla attraversa il bordo superiore verso il basso; mantenere coerenti `isBasketScored()` e i colliders quando si cambia la geometria del ferro.

Regole per le modifiche:

- Non spostare la fisica in componenti React: React deve rimanere UI, Phaser scena/input/rendering.
- Non sostituire il solver con Arcade/Matter senza un task esplicito di ribilanciamento e test di gameplay: cambierebbero traiettorie e collisioni.
- La previsione di tiro chiama lo stesso `stepBall()` della partita. Mantenerli sincronizzati.
- I valori sono espressi in tick, non in secondi. Conversioni da delta-time richiedono un accumulatore o una modifica consapevole della simulazione.
- Phaser deve essere distrutto quando il componente React viene smontato; non creare istanze duplicate o listener permanenti.
- I record importati in `LEVELS` sono configurazione condivisa: modifiche runtime vanno fatte alla copia creata dalla scena, non agli oggetti sorgente.

## 7. Progressi e servizi esterni

`src/services/progressStore.js` legge e scrive `tb1`. Mantiene il formato storico per non perdere i salvataggi locali. Non cambiare chiave o schema senza una migrazione e una prova con dati già presenti.

L’interfaccia nuova non usa ancora il backend Supabase. `supabase.sql` è documentazione/schema mantenuto per un’integrazione futura, non prova che classifica, upload o ripristino funzionino. Non inserire chiavi o credenziali reali nel repository.

## 8. Limiti funzionali conosciuti

Prima di dichiarare completato un task di parità o di modifica alle meccaniche, considerare almeno questi gap:

- modalità a tempo e survival presenti, ma la parità nei dettagli va verificata sui livelli;
- interruttori/porte non implementati end-to-end;
- pietre, zone di restringimento e livelli al buio hanno dati e resa visiva storici; collisioni/moto delle pietre, restringimento della pallina e durata/visibilità al buio richiedono ancora test di parità;
- disegni personalizzati delle 22 skin, scia colorata per skin e feedback base sui booster presenti; verificare la parità visiva degli effetti con l’HTML originale;
- classifica, profilo remoto e ripristino Supabase non collegati;
- copertura automatizzata limitata: la verifica attuale è principalmente la build.

Questi punti sono attività future, non comportamenti da presumere presenti. Se un task li affronta, aggiornare questa sezione e il changelog dopo aver verificato il codice.

## 9. Checklist per ogni agente

1. Leggere questo documento e il README, poi i file strettamente interessati.
2. Individuare se il task riguarda UI React, scena Phaser, dati, fisica, persistenza o deploy; rispettare i confini sopra.
3. Conservare il formato dei salvataggi e i valori fisici esistenti, salvo richiesta esplicita di modificarli.
4. Aggiungere commenti vicino ai dati o alle regole non ovvie; preferire funzioni piccole e nomi espliciti.
5. Eseguire `npm run build` (o il controllo equivalente disponibile) e verificare manualmente i flussi toccati.
6. Aggiornare questo documento se architettura, comandi, schema dati, copertura o limiti cambiano.
7. **Aggiungere sempre una nuova voce in fondo al changelog**, senza riscrivere o rimuovere le voci precedenti. Includere task, file/aree interessate, verifiche e follow-up aperti. Non registrare attività non eseguite.

## Changelog agenti

> Append-only: ogni agente aggiunge la propria voce in fondo a questa sezione dopo aver completato il task. Usare data ISO `YYYY-MM-DD`; conservare le voci storiche.

### 2026-11-23 — Creazione guida di handoff

- Creato il documento di orientamento per agenti con architettura, flussi, vincoli e limiti funzionali verificati nel repository.
- Verificati: `package.json`, README, workflow deploy, componenti React, configurazione dei livelli, scena Phaser e solver fisico.
- Follow-up: aggiornare questa guida insieme alle successive implementazioni di parità e integrazione Supabase.

### 2026-11-23 — Ripristino controlli e modalità

- Ripristinati mira da qualsiasi punto del canvas, traiettoria predittiva leggibile, gradiente di sfondo a tutta altezza, disegni dettagliati delle skin e contrasto del pulsante Menu nell’overlay.
- Riattivate le modalità a tempo (5 minuti) e survival (3 vite), con salto/riprova contestuali e salvataggio dei record locali; corretto il retry della campagna.
- Aree interessate: `src/App.jsx`, `src/styles.css`, `src/components/BallPreview.jsx`, `src/game/balls/drawBall.js`, `src/game/scenes/GameScene.js`.
- Verifica: build Vite eseguita tramite Node; confronto delle regole delle modalità e del renderer con la versione HTML storica.
- Follow-up: verificare manualmente il bilanciamento e la parità delle sessioni sui livelli; completare switch/porte, pietre, zone, buio ed effetti.

### 2026-11-23 — Ripristino canestro fisico

- Ripristinati ferro circolare e retina conica; aggiunti i colliders storici di montanti e base, così la rete respinge la palla anche dal basso.
- Il canestro ora registra un punto soltanto attraversando l’apertura dall’alto in discesa.
- Aree interessate: `src/game/scenes/GameScene.js`, `src/game/physics/step.js`.
- Verifica: build Vite e test diretti del solver per ingresso discendente, tiro ascendente e urto contro la base.
- Follow-up: verificare visivamente e bilanciare i canestri su livelli con partenza vicina o sotto il ferro.

### 2026-11-23 — Rettangolo mobile visibile

- Verificato che nel livello 9 il rettangolo (`mx: 35`, `sp: 0.03`) aveva collisioni oscillanti ma il renderer lo disegnava alla posizione iniziale.
- Aggiunta `rectangleCenterAt()` condivisa tra solver e renderer; il blocco ora è visibile lungo tutto il movimento.
- Verifica: build Vite e test del centro del rettangolo al tick 0 e durante l’oscillazione.
- Follow-up: controllare gli altri livelli con rettangoli mobili e confermare la corrispondenza visiva in gioco.

### 2026-11-23 — Scia e feedback dei booster

- Ripristinata la scia colorata in base alla skin; durante il boost da rimbalzo su ostacolo verde la scia passa al verde chiaro.
- Gli urti validi sui booster emettono un evento usato per flash dell’ostacolo, anello e particelle d’impatto.
- Aree interessate: `src/game/balls/skins.js`, `src/game/physics/step.js`, `src/game/scenes/GameScene.js`.
- Verifica: build Vite e test del solver/evento, della palette per skin e del colore verde boost.
- Follow-up: controllare manualmente visibilità e durata degli effetti in gioco.

### 2026-11-23 — Reset e collisioni del livello 12

- Ripristinato il layout storico del livello 12, con segmento mobile, segmento statico e booster non letali.
- In campagna i tiri falliti resettano la pallina alla partenza mantenendo il conteggio; il contatto letale riproduce burst e anello rossi senza mostrare l’overlay Riprova.
- Aree interessate: `src/game/data/levels.js`, `src/game/scenes/GameScene.js`.
- Verifica: build Vite e test mirati del layout del livello 12 e dei casi di collisione/reset.
- Follow-up: verificare visivamente il nuovo burst e il flusso di reset durante una partita.

### 2026-11-23 — Ripristino livelli e stile dei mondi

- Ripristinati dati storici dedicati per tutti i 60 livelli, incluse posizioni, ostacoli, magneti, portali, switch, pietre, zone, canestri stretti e livelli bui.
- Ripristinata la resa tematica di ostacoli, booster, pericoli, portali, pietre e zone; i magneti mostrano aure animate viola in attrazione e arancioni in repulsione.
- Aree interessate: `src/game/data/historicLevelData.js`, `src/game/data/levels.js`, `src/game/scenes/GameScene.js`.
- Verifica: confronto normalizzato di tutti i 60 record con la versione storica e build Vite.
- Follow-up: verificare visivamente i mondi, l’animazione dei magneti e le pietre; switch/porte e restringimento della pallina nelle zone non sono ancora implementati end-to-end.

### 2026-11-23 — Gradiente Canvas per i mondi

- Corretto lo sfondo invisibile: il gioco usa `Phaser.CANVAS`, dove `Graphics.fillGradientStyle()` non è supportato.
- Creato un texture Canvas con gradiente verticale per ciascun mondo e selezionato il texture corrispondente al livello corrente.
- Area interessata: `src/game/scenes/GameScene.js`.
- Verifica: build Vite e controllo statico senza errori.
- Follow-up: confermare la resa visiva sui dispositivi target.
