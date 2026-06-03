# Base HTMX — Fastify + KitaJS HTML

Un server HTTP che restituisce pagine HTML generate tramite componenti JSX. Il JSX viene compilato in stringhe HTML direttamente sul server, senza bundle client-side.

---

## Stack tecnologico

### TypeScript

Superset di JavaScript che aggiunge i tipi statici. Permette di intercettare errori a compile-time invece che a runtime.

- [Documentazione ufficiale](https://www.typescriptlang.org/docs/)
- [Playground online](https://www.typescriptlang.org/play)

### Fastify

Framework web per Node.js, progettato per essere veloce e con basso overhead.

- [Documentazione ufficiale](https://fastify.dev/docs/latest/)
- [GitHub](https://github.com/fastify/fastify)

Concetti chiave:
- **Plugin system**: tutto in Fastify è un plugin (routes, decorators, hooks)
- **Schema-based validation**: validazione automatica di request/response tramite JSON Schema
- **Logging integrato**: logger JSON ad alte prestazioni incluso di default

### @kitajs/html

Runtime JSX che genera stringhe HTML. Non c'è virtual DOM, non c'è hydration, non c'è stato client-side. È puro templating server-side con la sintassi JSX.

- [Documentazione](https://github.com/kitajs/html)
- [Sito ufficiale](https://html.kitajs.org/)

Perché usarlo:
- Sintassi familiare (JSX) per scrivere HTML
- Type-safe: errori nei nomi dei tag o attributi vengono catturati dal compilatore
- Molto veloce nel generare HTML statico
- Componenti riutilizzabili con props tipizzate

### @kitajs/fastify-html-plugin

Plugin che integra `@kitajs/html` in Fastify, aggiungendo il metodo `reply.html()` per inviare risposte HTML.

- [npm](https://www.npmjs.com/package/@kitajs/fastify-html-plugin)
- [GitHub](https://github.com/kitajs/html/tree/master/packages/fastify-html-plugin)

Funzionalità:
- Aggiunge automaticamente `<!doctype html>` se la risposta inizia con `<html>`
- Imposta il `Content-Type: text/html` corretto
- Supporta componenti asincroni e `Suspense` per lo streaming

### tsx

Tool per eseguire file TypeScript direttamente senza compilazione manuale. Usa esbuild sotto il cofano.

- [GitHub](https://github.com/privatenumber/tsx)

---

## Struttura del progetto

```
base-htmx/
├── src/
│   ├── index.tsx              # Entry point: server Fastify + routes
│   └── components/
│       └── Counter.tsx        # Esempio di componente JSX
├── package.json               # Dipendenze e script
├── tsconfig.json              # Configurazione TypeScript
└── .gitignore
```

---

## Prerequisiti

- [Node.js](https://nodejs.org/) >= 20
- npm (incluso con Node.js)

---

## Setup

```bash
# Installa le dipendenze
npm install

# Avvia in modalità sviluppo (hot-reload)
npm run dev
```

Il server sarà disponibile su **http://localhost:3000**.

---

## Come funziona

### Entry point (`src/index.tsx`)

```tsx
import Fastify from "fastify"
import fastifyHtml from "@kitajs/fastify-html-plugin"

const app = Fastify()

// Registra il plugin HTML
await app.register(fastifyHtml)

// Definisci una route che ritorna JSX
app.get("/", (req, reply) => {
  return reply.html(
    <html lang="it">
      <body>
        <h1>Ciao mondo</h1>
      </body>
    </html>
  )
})

app.listen({ port: 3000, host: "0.0.0.0" })
```

Punti importanti:
1. `app.register(fastifyHtml)` — registra il plugin che abilita `reply.html()`
2. `reply.html(<jsx />)` — converte il JSX in stringa HTML e la invia al client
3. Il top-level `await` funziona perché il progetto è configurato come ES Module (`"type": "module"` in package.json)

### Componenti (`src/components/Counter.tsx`)

```tsx
type InputProps = {
  count: number
}

export default (props: InputProps) => {
  return <span>Count: {props.count}</span>
}
```

Un componente è una semplice funzione che:
- Riceve **props** tipizzate come argomento
- Ritorna **JSX** (che verrà convertito in stringa HTML)

Non c'è stato, non ci sono hooks, non c'è lifecycle. È puro rendering.

---

## Configurazione TypeScript (`tsconfig.json`)

```jsonc
{
  "compilerOptions": {
    "jsx": "react-jsx",              // Abilita la trasformazione JSX automatica
    "jsxImportSource": "@kitajs/html" // Usa KitaJS come runtime JSX
  }
}
```

Le due opzioni chiave sono:
- **`jsx: "react-jsx"`** — dice a TypeScript di trasformare il JSX usando l'import automatico (non serve importare manualmente il runtime)
- **`jsxImportSource: "@kitajs/html"`** — specifica che il runtime JSX è KitaJS

---

## Routes disponibili

| Metodo | Path     | Descrizione                          |
|--------|----------|--------------------------------------|
| GET    | `/`      | Pagina con Lorem Ipsum               |
| GET    | `/count` | Pagina con contatore (incrementale)  |

---

## Script npm

| Comando         | Cosa fa                                              |
|-----------------|------------------------------------------------------|
| `npm run dev`   | Avvia il server con hot-reload (usa `tsx watch`)     |
| `npm run build` | Compila TypeScript in JavaScript (`dist/`)           |
| `npm start`     | Avvia il server compilato da `dist/`                 |

---

## Risorse utili

- [Fastify — Getting Started](https://fastify.dev/docs/latest/Guides/Getting-Started/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [KitaJS HTML](https://github.com/kitajs/html)
- [HTMX — documentazione](https://htmx.org/docs/)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
