import React from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 24 }}>
      <h1>RBAC Web</h1>
      <p>Frontend bootstrap (Vite + React). Next steps: Router, Auth pages.</p>
    </div>
  );
}

const container = document.getElementById('root')!;
createRoot(container).render(<App />);
