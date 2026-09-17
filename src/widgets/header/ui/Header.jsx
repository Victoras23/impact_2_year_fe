import { APP_NAME } from "../../../shared/config/index.js";
import { useLesson } from "../../../entities/lesson/index.js";
import { LessonPicker } from "../../../features/lesson-picker/index.js";
import { ApiStatusBadge } from "../../../features/api-status/index.js";
import { ApiDocsButton } from "../../../features/api-docs/index.js";
import { EnvBadge } from "../../../features/env-badge/index.js";
import { AuthButton } from "../../../features/auth/index.js";
import { useCart } from "../../../entities/cart/index.js";
import "./Header.css";

export function Header({ onOpenCart }) {
  const { shows } = useLesson();
  const { count } = useCart();
  const [brand, sub] = APP_NAME.split(" ");

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-header__brand" href="#lesson">
          <span className="site-header__b1">{brand}</span>
          <span className="site-header__b2">{sub}</span>
        </a>
        <nav className="site-header__nav">
          <LessonPicker />
          <a href="#lesson">Lecția</a>
          {shows("catalog") ? <a href="#catalog">Catalog</a> : null}
          {shows("admin") ? <a href="#admin">Administrare</a> : null}
        </nav>
        <div className="site-header__right">
          {shows("env") ? <EnvBadge /> : null}
          <ApiStatusBadge />
          {shows("swagger") ? <ApiDocsButton /> : null}
          {onOpenCart ? (
            <button className="site-header__cart" onClick={onOpenCart}>
              Coș {count > 0 ? <span className="site-header__count">{count}</span> : null}
            </button>
          ) : null}
          {shows("auth") ? <AuthButton /> : null}
        </div>
      </div>
    </header>
  );
}
