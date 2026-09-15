Ecco un file `README.md` completo e strutturato basato sulle tue configurazioni.

```markdown
# E-Commerce Base HTMX

Un'applicazione e-commerce Full-Stack ad alte prestazioni creata con architettura server-rendered, HTMX e Fastify.

## Tech Stack

* **Server:** Fastify, TypeScript, Zod
* **Frontend:** HTMX, JSX/TSX (@kitajs/html), Tailwind CSS, esbuild
* **Database & ORM:** PostgreSQL, Drizzle ORM
* **Email:** React Email, Nodemailer, MailHog (dev)
* **Infrastruttura:** Docker, Docker Compose

---

## Prerequisiti

* **Node.js** (v20 o superiore)
* **Docker** e **Docker Compose**

---

## Installazione e Configurazione

1. **Clona la repository e installa le dipendenze:**
   ```bash
   git clone <URL_REPOSITORY>
   cd <NOME_CARTELLA>
   npm install

```

2. **Configura le variabili d'ambiente:**
Crea un file `.env` nella radice del progetto:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ecommerce_db

```


3. **Avvia i servizi Docker (PostgreSQL e MailHog):**
```bash
docker compose up -d

```


4. **Esegui le migrazioni del Database:**
```bash
npm run db:generate
npm run db:migrate

```



---

## Sviluppo

Per avviare il server di sviluppo insieme alla compilazione degli asset:

```bash
# Avvia il server e lo script client
npm run dev

# In un altro terminale, avvia il watch dei CSS
npm run watch:css

```

L'applicazione sarà raggiungibile su `http://localhost:3000` (o la porta configurata nel server).

---

## Script Utili

* **`npm run db:studio`**: Apre l'interfaccia web di Drizzle Studio per esplorare il database.
* **`npm run build:client`**: Compila e minimizza lo script client tramite esbuild.
* **`npm run build:css`**: Genera il bundle Tailwind CSS per la produzione.
* **`npm run email`**: Avvia l'ambiente di sviluppo per i template React Email.

---

## Servizi Locali

* **MailHog (UI Email):** `http://localhost:8025`
* **PostgreSQL:** `localhost:5432`

```

```
