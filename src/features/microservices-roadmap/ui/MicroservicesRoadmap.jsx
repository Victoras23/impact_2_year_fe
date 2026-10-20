import { Card, Badge } from "../../../shared/ui/index.js";
import "./MicroservicesRoadmap.css";

// Lecția 20 — harta (statică): cele 3 servicii candidate și drumul monolit → microservicii.
// Nicio cerere spre backend: azi totul rulează încă într-un singur proces.
const SERVICES = [
  {
    name: "Catalog",
    tone: "cat",
    does: "produse, categorii, prețuri, reduceri, stoc",
    tables: ["categories", "products"],
    api: ["/api/v1/products", "/api/v1/categories", "/graphql"],
  },
  {
    name: "Comenzi",
    tone: "ord",
    does: "comanda, confirmarea (RabbitMQ), evenimentele (Kafka), statistici",
    tables: ["orders", "order_items", "analytics_*"],
    api: ["/api/v1/orders", "/api/v1/mq", "/api/v1/kafka", "/api/v1/analytics"],
  },
  {
    name: "Utilizatori",
    tone: "usr",
    does: "cont, login, JWT, refresh token",
    tables: ["users", "refresh_tokens"],
    api: ["/api/v1/auth"],
  },
];

const ROADMAP = [
  { id: 20, title: "Planul + granițele în cod", text: "3 servicii candidate; comenzile vorbesc cu catalogul și utilizatorii doar prin CatalogClient / UserClient.", now: true },
  { id: 21, title: "Primul serviciu separat", text: "orders-service cu baza lui de date; clienții Local* devin HTTP; un API gateway în față." },
  { id: 22, title: "Reziliență", text: "Stocul nu mai e în aceeași tranzacție cu comanda → Saga; circuit breaker când catalogul nu răspunde." },
  { id: 23, title: "Kubernetes", text: "Containerele devin un cluster local: pods, deployments, services." },
  { id: 24, title: "Microserviciile în Kubernetes", text: "Fiecare serviciu cu replicile lui, probe de health, rolling updates." },
];

export function MicroservicesRoadmap() {
  return (
    <Card className="msr">
      <div className="msr__head"><h3>Harta: cele 3 servicii candidate</h3><Badge tone="ok">azi: un singur proces</Badge></div>
      <div className="msr__services">
        {SERVICES.map((s) => (
          <div key={s.name} className={`msr__svc msr__svc--${s.tone}`}>
            <h4>{s.name}</h4>
            <p>{s.does}</p>
            <p className="msr__label">Tabele</p>
            <p>{s.tables.map((t) => <code key={t}>{t}</code>)}</p>
            <p className="msr__label">Endpoint-uri</p>
            <p>{s.api.map((a) => <code key={a}>{a}</code>)}</p>
          </div>
        ))}
      </div>
      <div className="msr__arrows">
        <code>OrderService</code> → <code>CatalogClient</code> → <code>LocalCatalogClient</code> → <code>ProductService</code>
        <br />
        <code>OrderService</code> → <code>UserClient</code> → <code>LocalUserClient</code> → <code>AuthService</code>
        <br />
        <span>În Lecția 21, <code>Local*</code> devin apeluri HTTP — <code>OrderService</code> nu se schimbă.</span>
      </div>

      <div className="msr__head msr__head--road"><h3>Drumul: monolit → microservicii</h3></div>
      <ol className="msr__road">
        {ROADMAP.map((r) => (
          <li key={r.id} className={r.now ? "is-now" : ""}>
            <span className="msr__step">L{r.id}</span>
            <div>
              <b>{r.title}</b>{r.now ? <Badge tone="ok">azi</Badge> : null}
              <p>{r.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
