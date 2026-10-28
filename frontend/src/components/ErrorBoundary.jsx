import React from "react";

// Shows a message instead of a blank white page if any screen crashes.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Screen crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        <h2>Something went wrong</h2>
        <p>The page could not load properly. Please reload and try again.</p>
        <button
          onClick={() => window.location.reload()}
          style={{ padding: "10px 20px", background: "#25D366", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" }}
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
