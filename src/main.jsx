import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    // Swap this for Sentry.captureException(error) once error tracking is wired up
    console.error("4U crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          background: "#100F26", color: "#F5F3FF", fontFamily: "sans-serif", padding: 24, textAlign: "center",
        }}>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#A6A1CC" }}>Try refreshing the page. If this keeps happening, let us know.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ background: "#FF6B4A", color: "#100F26", border: "none", borderRadius: 999, padding: "12px 24px", fontWeight: 600, cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
