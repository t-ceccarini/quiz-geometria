# Quiz Geometria MVP

Web app didattica per generare quiz di geometria e algebra lineare da un serbatoio di domande.

## Cosa include questa versione

- supporto formule matematiche con KaTeX;
- modalità **allenamento** e **esame**;
- generazione quiz più bilanciata su argomenti e difficoltà;
- archivio domande ampliato e con difficoltà riviste;
- riepilogo finale con statistiche per argomento;
- storico locale dei tentativi salvato nel browser.

## Prerequisiti

- Node.js installato
- npm disponibile da terminale

## Avvio locale

```bash
npm install
npm run dev
```

Poi apri:

```text
http://localhost:3000
```

## Dove modificare le domande

Le domande stanno in:

```text
data/questions.ts
```

Ogni domanda ha questa struttura:

```ts
{
  id: 'q1',
  topic: 'matrici',
  difficulty: 'facile',
  prompt: 'Testo della domanda con eventuale $$LaTeX$$',
  options: ['A', 'B', 'C', 'D'],
  correctIndex: 0,
  explanation: 'Spiegazione della risposta corretta'
}
```

## Topic disponibili

- matrici
- determinanti
- sistemi-lineari
- spazi-vettoriali
- basi-dimensione
- applicazioni-lineari
- autovalori
- geometria-piano
- geometria-spazio

## Come scrivere le formule

Puoi usare formule tra delimitatori:

- inline: `\( ... \)`
- display: `$$ ... $$`

Esempio:

```ts
prompt: 'Calcola il determinante di $$\\begin{pmatrix}1 & 2\\\\3 & 4\\end{pmatrix}$$'
```

## Note pratiche

- Le statistiche dei quiz vengono salvate solo nel browser locale.
- Non c’è ancora login.
- Non c’è ancora database.
