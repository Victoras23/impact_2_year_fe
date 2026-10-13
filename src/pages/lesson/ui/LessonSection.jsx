import { useLesson } from "../../../entities/lesson/index.js";
import { Card } from "../../../shared/ui/index.js";
import { Lesson1Console } from "./Lesson1Console.jsx";
import { SecurityConsole } from "../../../features/security-console/index.js";
import { RefreshConsole } from "../../../features/refresh-console/index.js";
import { RestVsGraphqlConsole } from "../../../features/rest-vs-graphql/index.js";
import { RateLimitConsole } from "../../../features/rate-limit-console/index.js";
import { LoadBalancerConsole } from "../../../features/lb-console/index.js";
import { MessageQueueConsole } from "../../../features/mq-console/index.js";
import "./LessonSection.css";

// Ce se afișează pentru lecția aleasă din meniul de sus.
export function LessonSection() {
  const { current } = useLesson();

  if (current.id === 1) return <Lesson1Console />;

  if (current.id === 2) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Backend-ul este acum conectat la PostgreSQL. Catalogul de mai jos se încarcă
          din baza de date (<code>GET /api/v1/products</code>). Butonul{" "}
          <b>Autentificare</b> din colțul din dreapta deschide fereastra de login (JWT);{" "}
          <b>Ieși</b> șterge tokenul.
        </p>
      </Card>
    );
  }

  if (current.id === 3) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Lista de produse și categoriile sunt acum ținute în <b>cache Redis</b>: prima
          cerere lovește baza de date, următoarele vin din Redis (vezi „Încărcat în … ms"
          și butonul <b>Golește cache-ul</b> de sub filtre). Butonul <b>Documentație API</b>
          din bara de sus deschide <b>Swagger UI</b>. Workflow-ul Git al clasei este în
          <code>2 Year/Lesson 3/git-workflow.md</code>.
        </p>
      </Card>
    );
  }

  if (current.id === 4) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          <b>Nimic nou de văzut aici</b> — lecția asta e despre cum scrii codul, nu despre ce
          face el. Magazinul de mai jos arată exact ca la Lecția 3.
        </p>
        <p>
          Am refactorizat <code>GET /api/v1/auth/me</code>: controllerul construia singur
          răspunsul (<code>Map.of("email", ..., "roles", ...)</code>) — o încălcare mică a
          principiului responsabilității unice (S din SOLID). Acum <code>AuthController</code>{" "}
          doar rutează, iar <code>AuthService.me(email)</code> decide forma răspunsului și
          întoarce un <code>MeResponse</code> tipizat. Comportamentul e identic; toate cele 15
          teste de backend trec la fel ca înainte.
        </p>
      </Card>
    );
  }

  if (current.id === 5) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Uită-te la categoria <b>Accesorii</b> din catalogul de mai jos: prețurile ei sunt
          acum tăiate, cu un preț nou lângă, și un badge <b>reducere</b> pe card. Restul
          categoriilor rămân neschimbate.
        </p>
        <p>
          Asta vine dintr-un <b>Strategy pattern</b> pe backend: fiecare regulă de discount
          e propria clasă (<code>CategoryPercentageDiscountStrategy</code>,{" "}
          <code>NoDiscountStrategy</code>), și Spring le injectează pe toate ca{" "}
          <code>List&lt;DiscountStrategy&gt;</code>, ordonate cu <code>@Order</code>.{" "}
          <code>DiscountService</code> ia pur și simplu prima care se potrivește categoriei
          produsului — nu există niciun <code>switch</code>/<code>if-else</code> pe tipul de
          discount. Categoria și procentul (15%) vin din config, nu din cod.
        </p>
      </Card>
    );
  }

  if (current.id === 6) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Uită-te în colțul din dreapta sus: badge-ul <b>Mediu: DEV / Mediu: PROD</b> arată
          profilul Spring activ pe backend chiar acum (<code>GET /api/v1/config/info</code>).
          Apasă-l ca să reverifici după ce repornești backend-ul pe alt profil.
        </p>
        <p>
          Configurația s-a mutat din cod în mediu (Factorul III din <b>12-Factor App</b>):{" "}
          <code>application.yaml</code> mai ține doar ce e comun, iar{" "}
          <code>application-dev.yaml</code> / <code>application-prod.yaml</code> țin ce diferă
          (bază de date, Redis, CORS, secretul JWT). Pe <b>prod</b> nu există nicio valoare
          implicită pentru date sensibile — dacă lipsește o variabilă de mediu, aplicația
          refuză să pornească în loc să pornească greșit („fail fast").
        </p>
      </Card>
    );
  }

  if (current.id === 7) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          <b>Nimic nou de văzut aici</b> — checkpoint-ul lecției e infrastructură, nu o
          funcție nouă. Magazinul de mai jos arată exact ca la Lecția 6.
        </p>
        <p>
          Tot backend-ul (Spring Boot + PostgreSQL + Redis) pornește acum cu o singură
          comandă, <code>docker compose up --build</code>, fără nimic instalat pe laptop
          în afară de Docker. Imaginea backend-ului e un build <b>multi-stage</b>: un
          stage cu Maven compilează jar-ul, iar stage-ul final rulează doar jar-ul, cu un
          JRE minimal — fără Maven, fără codul sursă, fără cache-ul de dependențe.
        </p>
        <p>
          Codul nu știe că rulează în Docker: <code>docker-compose.yml</code> doar
          setează variabilele de mediu din Lecția 6 (<code>APP_DB_HOST=postgres</code>,
          <code>APP_REDIS_HOST=redis</code>) ca backend-ul să găsească baza de date și
          cache-ul prin numele serviciilor din rețeaua Docker, în loc de{" "}
          <code>localhost</code>.
        </p>
      </Card>
    );
  }

  if (current.id === 8) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          <b>Nimic nou de văzut aici</b> — checkpoint-ul lecției trăiește doar în codul
          backend-ului, nu în interfață. Magazinul de mai jos arată exact ca la Lecția 7.
        </p>
        <p>
          Până acum toate testele backend-ului erau <code>@SpringBootTest</code>: pornesc
          tot contextul Spring și ating o bază de date H2 reală — utile, dar lente (~4
          secunde). Acum sunt și teste <b>unitare</b>: fără context Spring, fără bază de
          date — doar dependențele fiecărui serviciu mock-uite cu <b>Mockito</b>.{" "}
          <code>AuthServiceTest</code>, <code>ProductServiceTest</code> și{" "}
          <code>DiscountServiceTest</code> (care testează exact regula de selecție a
          Strategy pattern-ului din Lecția 5, izolat de strategiile reale) rulează toate
          16 teste noi în sub 400 ms — de zece ori mai rapid decât un singur test cu
          Spring Boot.
        </p>
      </Card>
    );
  }

  if (current.id === 9) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          <b>Nimic nou de văzut aici</b> — checkpoint-ul lecției trăiește doar în codul
          backend-ului, nu în interfață. Magazinul de mai jos arată exact ca la Lecția 8.
        </p>
        <p>
          Testele unitare din Lecția 8 mock-uiau totul, ca să testeze doar logica unui
          serviciu, izolată. Lecția 9 testează integrarea reală: <code>AuthFlowIntegrationTest</code>{" "}
          pornește un <b>Postgres adevărat</b>, într-un container (<b>Testcontainers</b>),
          nu H2 — și verifică direct în baza de date că parola ajunge hash-uită, nu în
          clar, și că un email duplicat e respins de constrângerea{" "}
          <code>UNIQUE</code> reală, nu doar simulată. Separat, <code>ProductApiTest</code>{" "}
          renunță la <code>MockMvc</code> (care nu iese niciodată printr-un socket) și
          vorbește cu aplicația pornită pe un port real, cu <b>RestAssured</b> — exact cum
          ar face Postman.
        </p>
      </Card>
    );
  }

  if (current.id === 10) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          O <b>revizuire de securitate</b> reală pe endpoint-urile existente, nu una
          ipotetică — vezi <code>SECURITY_REVIEW.md</code> din backend. Cea mai interesantă
          descoperire: <code>frameOptions</code> era dezactivat <b>global</b>, pe tot API-ul.
          Motivul nu era prostesc — butonul <b>Documentație API</b> de mai sus chiar
          embedează Swagger UI într-un <code>&lt;iframe&gt;</code> adevărat, așa că pagina
          aceea CHIAR are nevoie să fie afișabilă în cadru. Problema era că remedierea se
          aplica peste tot, nu doar acolo. Acum sunt <b>două</b> politici de securitate: rutele
          Swagger rămân deschise la iframe, restul API-ului (produse, autentificare) e strict
          din nou — <code>frameOptions.deny()</code>.
        </p>
        <p>
          Un parametru cu tipul greșit (forma tipică a unei încercări de SQL injection)
          întorcea un 400 cu <b>corp gol</b> — acum <code>GlobalExceptionHandler</code> îl
          prinde și întoarce mereu <code>{"{status, message}"}</code>, ca restul API-ului.
        </p>
        <p>
          Apasă <b>„Rulează verificarea"</b> mai jos — nu e o simulare: verifică live headerele
          reale întoarse de backend și trimite chiar acel parametru „otrăvit" către{" "}
          <code>/api/v1/products</code>, ca să vezi cu ochii tăi eroarea curată, nu doar să citești
          despre ea.
        </p>
        <SecurityConsole />
      </Card>
    );
  }

  if (current.id === 11) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Mai jos, secțiunea <b>Administrare produse</b> face acum POST / PUT / DELETE reale
          pe <code>/api/v1/products</code> — dar numai dacă ești autentificat ca{" "}
          <code>admin@impact.md</code>. Autentifică-te ca <code>user@impact.md</code> (contul
          obișnuit) și încearcă un buton acolo: backend-ul răspunde <b>403</b>, nu doar
          interfața te oprește — poți verifica direct în tab-ul de rețea al browserului.
        </p>
        <p>
          Login-ul întoarce acum și un <b>refresh token</b>: un UUID opac, ținut într-un
          tabel din baza de date (nu într-un JWT), ca să poată fi <b>revocat</b> — un JWT
          stateless nu poate fi anulat înainte de expirare. Fiecare refresh <b>rotește</b>{" "}
          tokenul: primești o pereche nouă, iar cel vechi devine inutilizabil imediat.
          Butonul <b>Ieși</b> din colțul din dreapta sus revocă acum refresh tokenul pe
          backend, nu doar șterge tokenul din browser.
        </p>
        <p>
          Apasă <b>„Testează rotația"</b> mai jos — trimite refresh tokenul curent, primește
          unul nou, apoi retrimite pe cel <b>vechi</b> și arată că a fost respins, direct din
          răspunsul backend-ului.
        </p>
        <RefreshConsole />
      </Card>
    );
  }

  if (current.id === 12) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Caută în catalogul de mai jos — câmpul nou de căutare cheamă{" "}
          <code>GET /api/v1/products?search=...</code>, backat de un index GIN pe trigrame
          (<code>idx_products_name_trgm</code>), nu de un index obișnuit — un index B-tree
          normal nu ajută la un <code>ILIKE '%...%'</code> cu wildcard la început.
        </p>
        <p>
          Pe cele ~8 produse din proiect n-o să vezi nicio diferență de viteză — și asta e
          intenționat, nu un bug: pe un tabel atât de mic, Postgres alege corect{" "}
          <code>Seq Scan</code> chiar și cu indexul prezent, pentru că parcurgerea completă
          e mai ieftină. Ca să vezi diferența reală (Seq Scan de ~114 ms → index de ~4.6 ms),
          exersează întâi pe baza de date de practică din{" "}
          <code>Lesson 12/practice-db/</code> — 200 000 de produse, populată printr-un script
          SQL pe care îl rulezi tu, local.
        </p>
        <p>
          Checkpoint-ul complet — 4 pași, fiecare cu <code>EXPLAIN ANALYZE</code> înainte și
          după un index nou — e în <code>04_practice_queries.sql</code>, inclusiv un caz onest
          de query pe care indexarea NU îl rezolvă.
        </p>
      </Card>
    );
  }

  if (current.id === 13) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Apasă pe numele unui produs din catalogul de mai jos — se deschide detaliul lui,
          printr-un <code>GET /api/v1/products/{"{id}"}</code> nou cache-uit pe backend (Redis,
          cache separat de lista de produse). Apasă „Reîncarcă” — a doua cerere vine din
          cache, nu din baza de date.
        </p>
        <p>
          Al doilea checkpoint e invizibil în interfață, dar real: <code>list()</code>{" "}
          (catalogul) lovea baza de date cu 1 query pentru produse + câte unul SEPARAT
          pentru fiecare categorie distinctă — un N+1 clasic, confirmat cu logging SQL
          real, nu presupus. Rezolvat cu <code>@EntityGraph</code> pe repository: acum un
          singur query, cu <code>LEFT JOIN</code>, indiferent de câte categorii distincte
          apar în listă.
        </p>
        <p>
          Exersează întâi diferența dintre 51 de interogări separate și una singură, cu
          JOIN, pe baza de date de practică din <code>Lesson 13/practice-db/</code> —
          aceeași <code>optimizare-practica</code> din Lecția 12 — apoi vezi remedierea
          reală mai jos, în cod.
        </p>
      </Card>
    );
  }

  if (current.id === 14) {
    return (
      <Card className="lesson-note">
        <h2>{current.title}</h2>
        <p>
          Tot API-ul a trecut la <code>/api/v1/...</code> — checkpoint-ul de versionare.{" "}
          <code>/api/practice</code> (Lecția 1) a rămas neversionat intenționat: e o consolă
          de practică, nu o parte a contractului real.
        </p>
        <p>
          Catalogul de mai jos e acum <b>paginat</b> pe backend, nu doar filtrat — vezi
          controalele de sub grilă. Poți și sorta: <code>GET /api/v1/products?sort=price,desc</code>{" "}
          (doar <code>id</code>, <code>name</code>, <code>price</code> sunt acceptate — orice
          alt câmp e respins cu <b>400</b>, nu trimis mai departe ca proprietate arbitrară).
        </p>
        <p>
          Formatul erorilor e acum unic în tot API-ul — <code>{"{timestamp, status, error, message, path, errors}"}</code>{" "}
          — inclusiv pentru o eroare complet neprevăzută, care înainte ajungea la pagina
          Whitelabel implicită a Spring Boot. Deschide un produs după id (<code>Lecția 13</code>{" "}
          — apasă pe numele lui) — răspunsul include acum <code>links</code>: <code>self</code>,{" "}
          <code>list</code>, <code>category</code> — un exemplu de HATEOAS, nu o adoptare
          completă a stilului în tot API-ul.
        </p>
        <p>
          <b>În plus, nemenționat în curriculum:</b> formularul „Adaugă produs" din
          Administrare trimite un header <code>Idempotency-Key</code> unic la fiecare creare —
          dacă apeși „Da" de două ori pe același formular (ex. după un eșec de rețea), backend-ul
          întoarce produsul deja creat în loc să creeze un al doilea (vezi{" "}
          <code>IdempotencyService</code>, susținut de Redis).
        </p>
      </Card>
    );
  }

  if (current.id === 15) {
    return (
      <>
        <Card className="lesson-note">
          <h2>{current.title}</h2>
          <p>
            Backend-ul are acum <b>două uși</b> către același magazin: REST-ul de până acum
            (<code>/api/v1/...</code>) și un endpoint nou, <code>POST /graphql</code>. Ambele trec prin
            aceleași servicii și același cache Redis — singura diferență e protocolul.
          </p>
          <p>
            Deasupra catalogului de mai jos ai un comutator nou, <b>Sursa datelor</b>: aceeași grilă,
            aceeași paginare și sortare, încărcate prin REST sau prin GraphQL. Dacă n-ai observa
            comutatorul, n-ai ști care e care — exact ideea.
          </p>
          <p>
            Consola de mai jos măsoară diferențele reale: <b>over-fetching</b> (câți octeți primești),{" "}
            <b>under-fetching</b> (câte cereri face un ecran), <b>benchmark-ul</b> cerut de checkpoint și
            trade-off-urile — inclusiv cele în care GraphQL pierde. Mutațiile (<code>createProduct</code>,{" "}
            <code>updateProduct</code>, <code>deleteProduct</code>) cer rolul ADMIN, verificat cu{" "}
            <code>@PreAuthorize</code> pe resolver, nu pe URL — în GraphQL există un singur URL.
          </p>
        </Card>
        <RestVsGraphqlConsole />
      </>
    );
  }

  if (current.id === 16) {
    return (
      <>
        <Card className="lesson-note">
          <h2>{current.title}</h2>
          <p>
            Backend-ul numără acum cererile fiecărui client (după IP) cu algoritmul <b>token bucket</b>:
            fiecare cerere ia un jeton din „găleată”; când găleata e goală, răspunsul e{" "}
            <b>429 Too Many Requests</b>, cu header-ul <code>Retry-After</code> — câte secunde să aștepți.
          </p>
          <p>
            Două găleți per client: <b>login</b> (<code>/api/v1/auth/login</code> și <code>/register</code>) —{" "}
            <b>5 încercări pe minut</b>, contra ghicirii parolei; și <b>api</b> (restul <code>/api/v1/...</code>{" "}
            și <code>/graphql</code>) — <b>100 pe minut</b>, reumplută treptat. Gălețile stau în <b>Redis</b>, ca
            mai multe instanțe ale aplicației (Lecția 17) să numere împreună, nu fiecare separat.
          </p>
          <p>
            Încearcă și din fereastra de autentificare (dreapta sus): după 5 parole greșite, butonul se
            blochează cu numărătoare inversă, iar după fiecare greșeală vezi câte încercări mai ai.
          </p>
        </Card>
        <RateLimitConsole />
      </>
    );
  }

  if (current.id === 17) {
    return (
      <>
        <Card className="lesson-note">
          <h2>{current.title}</h2>
          <p>
            Backend-ul rulează acum în <b>două instanțe</b> (<code>backend-1</code>, <code>backend-2</code>), în spatele
            lui <b>Nginx</b> — reverse proxy și load balancer. Frontend-ul vorbește în continuare cu{" "}
            <code>localhost:8080</code>, dar acolo răspunde Nginx, care alege la fiecare cerere o instanță. Fiecare
            răspuns spune cine l-a servit, în header-ul <code>X-Instance-Id</code>.
          </p>
          <p>
            Algoritmul se schimbă din <code>NGINX_CONF</code>: <b>round-robin</b> (pe rând), <b>least-conn</b> (instanța
            cea mai liberă) sau <b>ip-hash</b> (același client, mereu aceeași instanță — sticky sessions). Aplicația
            noastră e <b>stateless</b> (JWT + Redis), deci nu are nevoie de sticky sessions — consola îți arată de ce.
          </p>
          <p>
            Nginx trimite IP-ul tău real în <code>X-Forwarded-For</code>, iar backend-ul îl crede DOAR de la Nginx —
            așa rate limiting-ul din Lecția 16 numără fiecare client real, comun pentru ambele instanțe.
          </p>
        </Card>
        <LoadBalancerConsole />
      </>
    );
  }

  if (current.id === 18) {
    return (
      <>
        <Card className="lesson-note">
          <h2>{current.title}</h2>
          <p>
            Până acum, fiecare cerere făcea toată munca înainte să răspundă. Azi, plasarea comenzii face doar partea
            rapidă: salvează comanda ca <b>PENDING</b>, pune un mesaj în <b>RabbitMQ</b> și răspunde imediat cu{" "}
            <code>202 Accepted</code>. Partea lentă — verificarea și scăderea stocului — o face un <b>consumator</b>,
            în fundal, care schimbă statusul în <b>CONFIRMED</b> sau <b>REJECTED</b>.
          </p>
          <p>
            Mesajul trece printr-un exchange <b>fanout</b> (<code>orders.placed</code>) în două cozi: confirmarea și
            notificarea („emailul”). Ambele instanțe din Lecția 17 ascultă aceleași cozi (<b>competing consumers</b>),
            deci comenzile se împart între ele. Un mesaj care eșuează de 3 ori ajunge în <b>dead-letter queue</b>.
          </p>
          <p>
            Încearcă în magazin: adaugă produse în coș, apasă <b>Plasează comanda</b> și urmărește-o în „Comenzile mele”.
            Apoi rulează consola de mai jos.
          </p>
        </Card>
        <MessageQueueConsole />
      </>
    );
  }

  return (
    <Card className="lesson-note">
      <h2>{current.title}</h2>
      <p>Această lecție va fi disponibilă în curând. Alege o lecție disponibilă din meniul de sus.</p>
    </Card>
  );
}
