import React, { lazy, Suspense } from "react";
import { Spinner } from "react-bootstrap";
import ReactDOM from "react-dom/client";

const App = lazy(() => import("./App"));

const Root = () => (
  <Suspense
    fallback={
      <div className="d-flex justify-content-center align-items-center w-100 h-100">
        <Spinner
          animation="border"
          variant="primary"
          style={{ width: "3rem", height: "3rem", borderWidth: "0.5rem" }}
        />
      </div>
    }
  >
    <App />
  </Suspense>
);

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
