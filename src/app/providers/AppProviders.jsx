import { ApiBaseProvider } from "../../shared/api/index.js";
import { LessonProvider } from "../../entities/lesson/index.js";
import { PracticeProvider } from "../../entities/api-practice/index.js";
import { CartProvider } from "../../entities/cart/index.js";

// Toți furnizorii de context ai aplicației, într-un singur loc.
export function AppProviders({ children }) {
  return (
    <LessonProvider>
      <ApiBaseProvider>
        <PracticeProvider>
          <CartProvider>{children}</CartProvider>
        </PracticeProvider>
      </ApiBaseProvider>
    </LessonProvider>
  );
}
