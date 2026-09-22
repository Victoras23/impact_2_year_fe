import "./crud.css";

export function CrudNote({ result }) {
  if (result.error) return <p className="crud-note crud-note--bad">Eroare de rețea: {result.error}</p>;
  return (
    <p className={"crud-note " + (result.ok ? "crud-note--ok" : "crud-note--bad")}>
      <b>{result.status}</b> · {result.ms} ms
      {result.message ? <> · <code>{result.message}</code></> : null}
    </p>
  );
}
