import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Login from './components/Login';
import ExcelUpload from './components/ExcelUpload';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [creditos, setCreditos] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  // 1. Definição dos limites conforme o MVP
  const LIMITES = {
    starter: 300,
    pro: 1500
  };

  // 2. Estados declarados corretamente no topo
  const [plano, setPlano] = useState<'starter' | 'pro'>('starter');
  const [produtos, setProdutos] = useState<any[]>([]);

  // 3. Função handleData corrigida
  const handleData = (data: any[]) => {
    const limiteAtual = LIMITES[plano];

    if (data.length > limiteAtual) {
      alert(`Seu plano ${plano.toUpperCase()} permite apenas ${limiteAtual} SKUs por mês. Sua planilha tem ${data.length}.`);
      return;
    }

    setProdutos(data);
    alert(`${data.length} produtos carregados com sucesso!`);
  };

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
          // Opcional: carregar o plano do banco de dados aqui também
        }
      };
      fetchCreditos();
    }
  }, [user]);

  const iniciarProcessamento = async () => {
    if (user && produtos.length > 0 && creditos >= 25) {
      setLoading(true);
      try {
        // 1. Criar o registro na fila para o Scraper Python
        await addDoc(collection(db, "processamentos"), {
          usuarioId: user.uid,
          email: user.email,
          status: "pendente",
          progresso: 0,
          skus: produtos, // A lista de itens do Excel
          dataCriacao: serverTimestamp()
        });

        // 2. Descontar os créditos no perfil do usuário
        const userRef = doc(db, "usuarios", user.uid);
        await updateDoc(userRef, {
          creditos: increment(-25)
        });

        setCreditos(prev => prev - 25);
        setProdutos([]); // Limpa a planilha após enviar
        alert("Processamento enviado para a fila com sucesso!");
      } catch (error) {
        console.error("Erro ao processar:", error);
        alert("Erro ao conectar com o banco de dados.");
      } finally {
        setLoading(false);
      }
    } else {
      alert("Verifique seus créditos ou se a planilha foi carregada.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {user ? (
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100">
          <div className="mb-6">
            <h1 className="text-xl text-slate-600">Bem-vindo,</h1>
            <p className="font-bold text-slate-800 truncate">{user.email}</p>
            <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded mt-2 inline-block uppercase">
              Plano {plano}
            </span>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 mb-8">
            <p className="text-sm text-green-600 uppercase tracking-wider font-semibold mb-1">
              Créditos Disponíveis
            </p>
            <p className="text-5xl font-black text-green-700">
              {creditos}
            </p>
          </div>

          {/* Componente de Upload de Excel */}
          <ExcelUpload onDataLoaded={handleData} />

          {produtos.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-sm rounded-lg mb-4">
              {produtos.length} produtos prontos para processar.
            </div>
          )}

          <button
            onClick={iniciarProcessamento} // Nome da nova função que envia para a fila
            disabled={creditos < 25 || loading || produtos.length === 0}
            className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg mb-4 ${creditos >= 25 && produtos.length > 0 && !loading
                ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                : 'bg-slate-300 cursor-not-allowed'
              }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando para Fila...
              </span>
            ) : (
              "Iniciar Processamento Excel"
            )}
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