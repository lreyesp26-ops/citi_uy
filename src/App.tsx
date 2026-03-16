import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRouter } from './routes';
import { ToastContainer } from './components/ui/Toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
