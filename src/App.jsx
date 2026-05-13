import './App.css';
import AppShell from './components/layout/AppShell.jsx';
import Header from './components/layout/Header.jsx';
import PreviewCanvas from './components/preview/PreviewCanvas.jsx';
import ControlPanel from './components/panel/ControlPanel.jsx';

function App() {
  return (
    <AppShell
      header={<Header />}
      sidebar={<ControlPanel />}
      preview={<PreviewCanvas />}
    />
  );
}

export default App;
