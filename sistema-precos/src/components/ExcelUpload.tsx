import { useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelUploadProps {
    onDataLoaded: (data: any[]) => void;
}

export default function ExcelUpload({ onDataLoaded }: ExcelUploadProps) {
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        const reader = new FileReader();

        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            // Lê o arquivo Excel
            const wb = XLSX.read(bstr, { type: 'binary' });
            // Pega a primeira aba da planilha
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            // Converte as linhas da planilha em um Array de Objetos (JSON)
            const data = XLSX.utils.sheet_to_json(ws);

            // Envia os dados para o componente pai (App.tsx)
            onDataLoaded(data);
        };

        reader.readAsBinaryString(file);
    };

    return (
        <div className="mt-4 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 hover:border-blue-400 transition-colors group">
            <label className="flex flex-col items-center cursor-pointer">
                <svg
                    className="w-8 h-8 text-slate-400 group-hover:text-blue-500 mb-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="C12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-slate-600">
                    {fileName ? fileName : "Clique para subir o Excel (.xlsx)"}
                </span>
                <input
                    type="file"
                    className="hidden"
                    accept=".xlsx, .xls"
                    onChange={handleFile}
                />
            </label>
        </div>
    );
}