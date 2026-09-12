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

  return (
    <Card className="lesson-note">
      <h2>{current.title}</h2>
      <p>Această lecție va fi disponibilă în curând. Alege o lecție disponibilă din meniul de sus.</p>
    </Card>
  );
}
