import { useLesson } from "../../../entities/lesson/index.js";
import { Card } from "../../../shared/ui/index.js";
import { Lesson1Console } from "./Lesson1Console.jsx";
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

  return (
    <Card className="lesson-note">
      <h2>{current.title}</h2>
      <p>Această lecție va fi disponibilă în curând. Alege o lecție disponibilă din meniul de sus.</p>
    </Card>
  );
}
