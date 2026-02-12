import { useEffect, useState } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Login from './components/Login';

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      {user ? (
        <div className="p-10 text-center">
          <h1 className="text-2xl">Bem-vindo, {user.email}!</h1>
          <p className="mt-4">Aqui ficarão os seus créditos e o Scraper.</p>
          <button 
            onClick={() => auth.signOut()}
            className="mt-6 px-4 py-2 bg-red-500 text-white rounded"
          >
            Sair
          </button>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;