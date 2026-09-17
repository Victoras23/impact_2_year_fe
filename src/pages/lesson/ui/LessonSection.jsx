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

  return (
    <Card className="lesson-note">
      <h2>{current.title}</h2>
      <p>Această lecție va fi disponibilă în curând. Alege o lecție disponibilă din meniul de sus.</p>
    </Card>
  );
}
