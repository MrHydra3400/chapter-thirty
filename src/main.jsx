import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { supabase } from "./storage";
import AuthGate from "./AuthGate";
import App from "./App";

function Root() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{ minHeight: "100vh", background: "#070b08", color: "#46f08a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "serif" }}>
      Evocazione in corso…
    </div>
  );

  return (
    <AuthGate session={session}>
      <App session={session} />
    </AuthGate>
  );
}

createRoot(document.getElementById("root")).render(<Root />);
