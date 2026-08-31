import { useState } from "react";
import { AppProviders } from "./providers/AppProviders.jsx";
import { useLesson } from "../entities/lesson/index.js";
import { Header } from "../widgets/header/index.js";
import { Footer } from "../widgets/footer/index.js";
import { CartDrawer } from "../widgets/cart-drawer/index.js";
import { StorePage } from "../pages/store/index.js";
import "./styles/global.css";

function AppShell() {
  const { shows } = useLesson();
  const [cartOpen, setCartOpen] = useState(false);
  const cartEnabled = shows("cart");

  return (
    <>
      <Header onOpenCart={cartEnabled ? () => setCartOpen(true) : null} />
      <StorePage />
      <Footer />
      {cartEnabled ? <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} /> : null}
    </>
  );
}

export function App() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}
