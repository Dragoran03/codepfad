import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/instrument-sans';
import '@fontsource-variable/jetbrains-mono';
import './styles.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Header } from './components/Header.tsx';
import { LessonPage } from './components/LessonPage.tsx';
import { PathMap } from './components/PathMap.tsx';
import { Playground } from './components/Playground.tsx';
import { AppProvider, useApp } from './state.tsx';

function Page() {
  const { route } = useApp();
  if (route.page === 'lesson') return <LessonPage key={route.id} id={route.id} />;
  if (route.page === 'playground') return <Playground />;
  return <PathMap />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <a className="skip-link" href="#inhalt">
        Zum Inhalt springen
      </a>
      <Header />
      <div id="inhalt">
        <Page />
      </div>
    </AppProvider>
  </StrictMode>,
);
