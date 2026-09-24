import { useLesson } from "../../../entities/lesson/index.js";
import { Card } from "../../../shared/ui/index.js";
import { Lesson1Console } from "./Lesson1Console.jsx";
import { SecurityConsole } from "../../../features/security-console/index.js";
import { RefreshConsole } from "../../../features/refresh-console/index.js";
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
          din baza de date (<code>GET /api/products</code>). Butonul{" "}
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
          Am refactorizat <code>GET /api/auth/me</code>: controllerul construia singur
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
          profilul Spring activ pe backend chiar acum (<code>GET /api/config/info</code>).
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
          <code>/api/products</code>, ca să vezi cu ochii tăi eroarea curată, nu doar să citești
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
          pe <code>/api/products</code> — dar numai dacă ești autentificat ca{" "}
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
          <code>GET /api/products?search=...</code>, backat de un index GIN pe trigrame
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
          printr-un <code>GET /api/products/{"{id}"}</code> nou cache-uit pe backend (Redis,
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

  return (
    <Card className="lesson-note">
      <h2>{current.title}</h2>
      <p>Această lecție va fi disponibilă în curând. Alege o lecție disponibilă din meniul de sus.</p>
    </Card>
  );
}
