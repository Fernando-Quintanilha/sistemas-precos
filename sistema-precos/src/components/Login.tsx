import { useState } from 'react';
import { db, auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await setDoc(doc(db, "usuarios", user.uid), {
                    email: user.email,
                    creditos: 50,
                    criadoEm: new Date()
                });

                alert("Conta criada com 50 créditos de brinde!");
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            alert("Erro: " + error.message);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100">
            <form onSubmit={handleAuth} className="p-8 bg-white shadow-xl rounded-2xl w-96">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
                    {isRegistering ? 'Criar Conta' : 'Acessar Scraper'}
                </h2>
                <input
                    type="email"
                    placeholder="E-mail"
                    className="w-full p-3 mb-4 border rounded-lg focus:outline-blue-500"
                    onChange={(e) => setEmail(e.target.value)}
                />
                <input
                    type="password"
                    placeholder="Senha"
                    className="w-full p-3 mb-6 border rounded-lg focus:outline-blue-500"
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition">
                    {isRegistering ? 'Cadastrar' : 'Entrar'}
                </button>
                <p
                    className="mt-4 text-sm text-center text-blue-600 cursor-pointer hover:underline"
                    onClick={() => setIsRegistering(!isRegistering)}
                >
                    {isRegistering ? 'Já tem conta? Entre aqui' : 'Não tem conta? Crie uma'}
                </p>
            </form>
        </div>
    );
}