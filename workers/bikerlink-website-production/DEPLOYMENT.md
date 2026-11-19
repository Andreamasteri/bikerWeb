# Preview e pubblicazione del Worker

Questa directory contiene il Worker Cloudflare per il sito BikerWeb. Wrangler è fissato alla versione `4.165.0` nel manifest e nel lockfile, così i preview e i deploy sono ripetibili.

## Preview isolato

Dalla directory `workers/bikerlink-website-production/`:

```sh
npm ci
npx wrangler login --device --scopes account:read user:read workers_scripts:write workers_routes:write zone:read
npx wrangler whoami
npm run dry-run
npm run preview
```

Il comando `preview` usa `wrangler preview --ignore-base-config --json`; crea un Preview Cloudflare e non promuove una versione sul dominio ufficiale. Conservare l’URL restituito come hostname di verifica. Le richieste API del Worker preview raggiungono l’origine Railway configurata: usare soltanto controlli anonimi e GET/HEAD/OPTIONS finché non è disponibile un backend sandbox isolato.

I token OAuth di Wrangler sono salvati nella configurazione locale dell’utente, fuori dal repository. Non salvarli nei file Git e non inviarli in chat.

## Pubblicazione

Non eseguire `wrangler deploy` o associare il dominio apex prima che Gate 1 sia PASS e che preview, routing, rollback e Gate 2 siano verificati. Il cambio DNS dell’apex è una fase separata e non viene eseguito da questi script.
