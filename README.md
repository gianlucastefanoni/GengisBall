# GengisBall

Gioco fisico in stile Tigerball: trascina all'indietro e lascia andare per tirare la pallina nel cestino.
10 mondi, 60 livelli (ostacoli pericolosi, pianeti magnetici, portali, interruttori con porte, blocchi di ghiaccio che scivolano, zone che rimpiccioliscono la pallina e livelli al buio), 18 skin da sbloccare con le stelle, modalità a tempo (5 minuti), 12 skin con scie diverse. I progressi sono salvati nel browser (`localStorage`).

Il progetto è un unico file, `index.html`, senza dipendenze o build.

## Provarlo in locale

Apri `index.html` nel browser, oppure:

    python3 -m http.server 8000

## Pubblicare su GitHub Pages

1. Crea un repository su GitHub e carica questi file sul branch `main`.
2. Vai in **Settings → Pages** e imposta **Source: GitHub Actions**.
3. A ogni push su `main` il workflow `.github/workflows/deploy.yml` controlla la sintassi e pubblica il gioco.
   L'indirizzo sarà `https://<utente>.github.io/<repository>/`.

Puoi anche lanciare il workflow a mano dalla scheda **Actions** (Run workflow).

## Modalità di gioco

- **Gioca**: i livelli in ordine, con le stelle (si sbloccano uno dopo l'altro).
- **Contro il tempo**: 5 minuti, completa più livelli che puoi (Salta per cambiare livello).
- **Survival**: livelli in ordine con 3 vite; ogni errore (o "Riprova") costa una vita. Il punteggio è il livello raggiunto.
- Skin speciali: 15 e 40 livelli a tempo, livello 15 e 40 in survival.

## Nome giocatore e classifica online (opzionale)

Senza configurazione il gioco salva tutto nel browser (`localStorage`). Per avere nome giocatore, classifica e backup online "alla Pacman", senza login:

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Apri **SQL Editor**, incolla il contenuto di `supabase.sql` ed esegui.
3. In **Project Settings → API** copia *Project URL* e la chiave *anon public*.
4. In `index.html` cerca `const CLOUD={url:'',key:''};` e inserisci i due valori. La chiave anon è pensata per essere pubblica.
5. Fai push: la pipeline pubblica il gioco su GitHub Pages.

Dal menu **Giocatore e classifica** si sceglie il nome (2-12 caratteri), si vede la classifica e il *codice giocatore* con cui ripristinare i progressi su un altro dispositivo.

Limiti: senza login chiunque può inviare punteggi falsi, e chi conosce il tuo codice giocatore può ripristinare o sovrascrivere i tuoi progressi. Per un gioco di svago va bene; per qualcosa di più serio servono autenticazione e validazione lato server.
