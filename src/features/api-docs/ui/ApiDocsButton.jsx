import { useState } from "react";
import { Modal } from "../../../shared/ui/index.js";
import { joinUrl, useApiBase } from "../../../shared/api/index.js";
import { SWAGGER_PATH } from "../../../shared/config/index.js";
import "./ApiDocsButton.css";

// Afișează documentația Swagger a backend-ului într-un iframe, direct în pagină (Lecția 3).
export function ApiDocsButton() {
  const [open, setOpen] = useState(false);
  const { baseUrl } = useApiBase();
  const swaggerUrl = joinUrl(baseUrl, SWAGGER_PATH);

  return (
    <>
      <button
        type="button"
        className="api-docs-button"
        onClick={() => setOpen(true)}
        title="Deschide Swagger UI"
      >
        Documentație API
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title="Documentație API (Swagger)" size="lg">
        {open ? (
          <iframe
            className="api-docs-frame"
            src={swaggerUrl}
            title="Swagger UI"
          />
        ) : null}
      </Modal>
    </>
  );
}
