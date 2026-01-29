import { GameProvider, useGame } from './context/GameContext';
import { SetupPage } from './pages/SetupPage';
import { GamePage } from './pages/GamePage';
import { GameOverPage } from './pages/GameOverPage';

function GameRouter() {
  const { state } = useGame();

  switch (state.phase) {
    case 'setup':
      return <SetupPage />;
    case 'playing':
      return <GamePage />;
    case 'gameOver':
      return <GameOverPage />;
    default:
      return <SetupPage />;
  }
}

function App() {
  return (
    <GameProvider>
      <GameRouter />
    </GameProvider>
  );
}

export default App;

