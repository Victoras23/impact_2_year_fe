import { useLesson } from "../../../entities/lesson/index.js";
import { Card } from "../../../shared/ui/index.js";
import { Lesson1Console } from "./Lesson1Console.jsx";
import "./LessonSection.css";

// Ce se afișează pentru lecția aleasă din meniul de sus.
export function LessonSection() {
  const { current } = useLesson();

  if (current.id === 1) return <Lesson1Console />;

  return (
    <Card className="lesson-soon">
      <h2>{current.title}</h2>
      <p>Această lecție va fi disponibilă în curând. Alege <b>Lecția 1</b> din meniul de sus.</p>
    </Card>
  );
}
