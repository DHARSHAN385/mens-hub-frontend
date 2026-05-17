
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import { GoogleAuthProvider } from "./components/GoogleAuthProvider.tsx";
  import "./styles/index.css";

  createRoot(document.getElementById("root")!).render(
    <GoogleAuthProvider>
      <App />
    </GoogleAuthProvider>
  );
  