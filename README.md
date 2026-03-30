# Quiz Geometria MVP

Web app didattica per esercitarsi su algebra lineare e geometria analitica con un archivio di oltre 1000 domande a risposta multipla.

## Cosa include

- modalita `allenamento` e `esame`
- archivio di oltre 1000 domande bilanciato per topic e difficolta
- nuova fascia `difficile-plus` per quesiti multi-step e trasversali
- focus rafforzato su autovalori, diagonalizzazione e teorema spettrale
- riepilogo finale con statistiche per argomento
- storico locale dei tentativi salvato nel browser
- rendering matematico con KaTeX

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- KaTeX

## Avvio locale

```bash
npm install
npm run dev
```

Poi apri:

```text
http://localhost:3000
```

Per la build di produzione:

```bash
npm run build
```

## Dove stanno le domande

Il dataset si trova in:

```text
data/questions.ts
```

Ogni domanda ha questa struttura:

```ts
{
  id: 'q1',
  topic: 'matrici',
  difficulty: 'facile',
  prompt: 'Testo della domanda con eventuale formula',
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
- diagonalizzazione
- teorema-spettrale
- geometria-piano
- geometria-spazio

## Formule supportate

Nel testo delle domande e nelle spiegazioni puoi usare:

- inline: `$ ... $`
- inline: `\( ... \)`
- display: `$$ ... $$`
- display: `\[ ... \]`

Esempio:

```ts
prompt: 'Se $A$ e una matrice simmetrica, allora $A$ e ortogonalmente diagonalizzabile?'
```

## Stato del dataset

L'archivio e stato ampliato con:

- piu domande su autovalori e autovettori
- nuovi blocchi su diagonalizzazione
- nuovi blocchi su teorema spettrale
- un blocco `difficile-plus` pensato per domande a crocette che richiedono comunque uno svolgimento serio
- una quota molto piu alta di domande difficili
- meno famiglie puramente parametriche e piu quesiti di ragionamento

## Note pratiche

- Le statistiche dei quiz vengono salvate solo nel browser locale.
- Non c'e login.
- Non c'e database.
- Il dataset e pensato per essere esteso e ripulito progressivamente.
