import { useLesson } from "../../../entities/lesson/index.js";
import "./Footer.css";

const YEAR = new Date().getFullYear();

export function Footer() {
  const { current } = useLesson();
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__meta">
          <span>impact E-Commerce · {current.title}</span>
          <span>Frontend de referință · Feature-Sliced Design</span>
        </div>
        <p className="site-footer__copy">
          © {YEAR} impact Academies &amp; Camps. Toate drepturile rezervate.
        </p>
      </div>
    </footer>
  );
}
