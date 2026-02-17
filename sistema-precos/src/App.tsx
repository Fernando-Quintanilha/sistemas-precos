import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Login from './components/Login';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [creditos, setCreditos] = useState<number>(0);
  const [loading, setLoading] = useState(false);

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

  const gastarCredito = async () => {
    if (user && creditos > 0) {
      setLoading(true);
      try {
        const userRef = doc(db, "usuarios", user.uid);

        await updateDoc(userRef, {
          creditos: increment(-25)
        });

        setCreditos(prev => prev - 25);

        console.log("Consulta realizada com sucesso!");
      } catch (error) {
        console.error("Erro ao gastar crédito:", error);
      } finally {
        setLoading(false);
      }
    } else {
      alert("Você não possui créditos suficientes!");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {user ? (
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="mb-6">
            <h1 className="text-xl text-slate-600">Bem-vindo,</h1>
            <p className="font-bold text-slate-800 truncate">{user.email}</p>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 mb-8">
            <p className="text-sm text-green-600 uppercase tracking-wider font-semibold mb-1">
              Créditos Disponíveis
            </p>
            <p className="text-5xl font-black text-green-700">
              {creditos}
            </p>
          </div>

          <button
            onClick={gastarCredito}
            disabled={creditos <= 0 || loading}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg mb-4 ${creditos > 0
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed'
              }`}
          >
            {loading ? 'Processando...' : 'Simular Consulta de Preço'}
          </button>

          <button
            onClick={() => auth.signOut()}
            className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors"
          >
            Sair da conta
          </button>
        </div>
      ) : (
        <Login />
      )}
    </div>
  );
}

export default App;