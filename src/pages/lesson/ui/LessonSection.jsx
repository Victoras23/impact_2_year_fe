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

  return (
    <Card className="lesson-note">
      <h2>{current.title}</h2>
      <p>Această lecție va fi disponibilă în curând. Alege o lecție disponibilă din meniul de sus.</p>
    </Card>
  );
}
