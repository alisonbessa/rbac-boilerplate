import React from 'react';
import { createRoot } from 'react-dom/client';
import { AppRouterProvider } from './router';

const container = document.getElementById('root')!;
createRoot(container).render(<AppRouterProvider />);
