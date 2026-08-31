import { useLesson } from "../../../entities/lesson/index.js";
import "./LessonPicker.css";

// Selector de lecție — primul element din bara de sus.
export function LessonPicker() {
  const { lessons, currentId, select } = useLesson();
  return (
    <label className="lesson-picker">
      <span className="lesson-picker__caret" aria-hidden="true">▾</span>
      <select
        className="lesson-picker__select"
        value={currentId}
        onChange={(e) => select(e.target.value)}
        aria-label="Alege lecția"
      >
        {lessons.map((l) => (
          <option key={l.id} value={l.id} disabled={!l.available}>
            {l.title}{l.available ? "" : "  (în curând)"}
          </option>
        ))}
      </select>
    </label>
  );
}
