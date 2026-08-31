import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LESSONS, STORAGE_LESSON } from "../../../shared/config/index.js";
import { readStorage, writeStorage } from "../../../shared/lib/index.js";

const LessonContext = createContext(null);

function firstAvailableId() {
  const found = LESSONS.find((l) => l.available);
  return found ? found.id : LESSONS[0].id;
}

export function LessonProvider({ children }) {
  const [currentId, setCurrentId] = useState(() => {
    const saved = Number(readStorage(STORAGE_LESSON, ""));
    const lesson = LESSONS.find((l) => l.id === saved);
    return lesson && lesson.available ? lesson.id : firstAvailableId();
  });

  useEffect(() => { writeStorage(STORAGE_LESSON, String(currentId)); }, [currentId]);

  const value = useMemo(() => {
    const current = LESSONS.find((l) => l.id === currentId) || LESSONS[0];
    return {
      lessons: LESSONS,
      currentId,
      current,
      // Este secțiunea `key` a magazinului vizibilă la lecția curentă?
      shows: (key) => (current.shows || []).includes(key),
      select(id) {
        const lesson = LESSONS.find((l) => l.id === Number(id));
        if (lesson && lesson.available) setCurrentId(lesson.id);
      },
    };
  }, [currentId]);

  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

export function useLesson() {
  const ctx = useContext(LessonContext);
  if (!ctx) throw new Error("useLesson must be used inside <LessonProvider>");
  return ctx;
}
