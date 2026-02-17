import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { onAuthStateChanged, type User } from 'firebase/auth';
import Login from './components/Login';
import ExcelUpload from './components/ExcelUpload';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [creditos, setCreditos] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState<'starter' | 'pro'>('starter');
  const [produtos, setProdutos] = useState<any[]>([]);
  

  const CONFIG_PLANOS = {
    starter: { limite: 300, custo: 25 },
    pro: { limite: 1500, custo: 50 }
  };

  const handleData = (data: any[]) => {
const limiteAtual = CONFIG_PLANOS[plano].limite;

    if (data.length > limiteAtual) {
      alert(`Seu plano ${plano.toUpperCase()} permite apenas ${limiteAtual} SKUs por mês. Sua planilha tem ${data.length}.`);
      return;
    }

    setProdutos(data);
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
        }
      };
      fetchCreditos();
    }
  }, [user]);

  const iniciarProcessamento = async () => {
    const configAtual = CONFIG_PLANOS[plano];

    if (user && produtos.length > 0 && creditos >= configAtual.custo) {
      setLoading(true);
      try {
        // Cria a fila para o Scraper Python
        await addDoc(collection(db, "processamentos"), {
          usuarioId: user.uid,
          email: user.email,
          plano: plano,
          status: "pendente",
          progresso: 0,
          skus: produtos,
          dataCriacao: serverTimestamp()
        });

        // Desconto dinâmico: 25 para Starter, 50 para Pro
        const userRef = doc(db, "usuarios", user.uid);
        await updateDoc(userRef, {
          creditos: increment(-configAtual.custo)
        });

        setCreditos(prev => prev - configAtual.custo);
        setProdutos([]);
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    } else {
      alert(`Você precisa de ${configAtual.custo} créditos para processar no plano ${plano}.`);
    }
  };

  const baixarRelatorio = () => {
    const worksheet = XLSX.utils.json_to_sheet([
      { Produto: "Exemplo 1", Preço: "R$ 150,00", Link: "ml.com/item1" },
      { Produto: "Exemplo 2", Preço: "R$ 290,00", Link: "ml.com/item2" },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "relatorio_nexsell.xlsx");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {user ? (
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100 flex flex-col gap-6">

          <div>
            <h1 className="text-xl text-slate-600">Bem-vindo,</h1>
            <p className="font-bold text-slate-800 truncate">{user.email}</p>
            <div className="flex justify-center gap-2 mt-3">
              <button
                onClick={() => setPlano('starter')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${plano === 'starter'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
              >
                STARTER (300)
              </button>
              <button
                onClick={() => setPlano('pro')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${plano === 'pro'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
              >
                PRO (1500)
              </button>
            </div>
          </div>

          <div className="bg-green-50 rounded-2xl p-6 shadow-sm">
            <p className="text-sm text-green-600 uppercase tracking-wider font-semibold mb-1">
              Créditos Disponíveis
            </p>
            <p className="text-5xl font-black text-green-700">
              {creditos}
            </p>
          </div>

          <div className="mb-2">
            <ExcelUpload onDataLoaded={handleData} />
            {produtos.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 text-blue-700 text-xs font-medium rounded-xl border border-blue-100">
                ✨ {produtos.length} produtos identificados na planilha.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={iniciarProcessamento}
              disabled={creditos < CONFIG_PLANOS[plano].custo || loading || produtos.length === 0}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg ${creditos >= CONFIG_PLANOS[plano].custo && produtos.length > 0 && !loading
                  ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
            >
              {loading ? "Processando..." : `Iniciar Processamento (${CONFIG_PLANOS[plano].custo} créditos)`}
            </button>

            <button
              onClick={baixarRelatorio}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Baixar Relatório Completo
            </button>
          </div>

          <button
            onClick={() => auth.signOut()}
            className="text-slate-400 hover:text-red-500 text-sm font-medium transition-colors mt-2"
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