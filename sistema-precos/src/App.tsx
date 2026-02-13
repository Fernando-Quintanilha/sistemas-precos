import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Login from './components/Login';
import { doc, getDoc } from 'firebase/firestore';




function App() {
  const [user, setUser] = useState<User | null>(null);
  const [creditos, setCreditos] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchCreditos = async () => {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          setCreditos(userDoc.data().creditos);
        }
      };
      fetchCreditos();
    }
  }, [user]);

  return (
    <div>
      {user ? (
        <div className="p-10 text-center">
          <h1 className="text-2xl">Bem-vindo, {user.email}!</h1>
          <p className="text-xl font-bold text-green-600">
            Você possui: {creditos} créditos
          </p>
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