import { useState, useEffect, useRef } from 'react';
import { Search, X, User, FileText, DollarSign, Users, Radio, Package } from 'lucide-react';
import { useLockBodyScroll } from '@/react-app/hooks/useLockBodyScroll';

interface SearchResult {
  type: 'client' | 'quote' | 'transaction' | 'prospect' | 'contract' | 'transmission';
  id: number;
  title: string;
  subtitle: string;
  extra?: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (type: string, id: number) => void;
}

const TYPE_ICONS: Record<string, any> = {
  client: User,
  quote: FileText,
  transaction: DollarSign,
  prospect: Users,
  contract: FileText,
  transmission: Radio,
};

const TYPE_LABELS: Record<string, string> = {
  client: 'Cliente',
  quote: 'Orçamento',
  transaction: 'Transação',
  prospect: 'Prospect',
  contract: 'Contrato',
  transmission: 'Transmissão',
};

const TYPE_COLORS: Record<string, string> = {
  client: 'text-blue-400 bg-blue-600/20',
  quote: 'text-green-400 bg-green-600/20',
  transaction: 'text-emerald-400 bg-emerald-600/20',
  prospect: 'text-cyan-400 bg-cyan-600/20',
  contract: 'text-indigo-400 bg-indigo-600/20',
  transmission: 'text-red-400 bg-red-600/20',
};

export default function GlobalSearch({ isOpen, onClose, onNavigate }: GlobalSearchProps) {
  useLockBodyScroll(isOpen);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const search = async (q: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setSelected(0);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    } else if (e.key === 'Enter' && results[selected]) {
      handleSelect(results[selected]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result: SearchResult) => {
    onNavigate(result.type, result.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-[100] pt-20 px-4">
      <div className="bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl border border-slate-600 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar clientes, orçamentos, prospects, transações..."
            className="flex-1 bg-transparent text-white placeholder-slate-400 focus:outline-none text-lg"
          />
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 flex-shrink-0" />
          )}
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {results.map((result, idx) => {
              const Icon = TYPE_ICONS[result.type] || FileText;
              const colorClass = TYPE_COLORS[result.type] || 'text-slate-400 bg-slate-600/20';
              return (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700/50 transition-all text-left ${
                    idx === selected ? 'bg-slate-700/50' : ''
                  }`}
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{result.title}</p>
                    <p className="text-slate-400 text-sm truncate">{result.subtitle}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-semibold flex-shrink-0 ${colorClass}`}>
                    {TYPE_LABELS[result.type]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query.trim() && !loading && results.length === 0 && (
          <div className="p-8 text-center text-slate-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Nenhum resultado para "{query}"</p>
          </div>
        )}

        {/* Hints */}
        {!query && (
          <div className="p-4 text-slate-500 text-sm">
            <p>Digite para buscar em clientes, orçamentos, prospects, contratos e transações.</p>
            <p className="mt-1">Use ↑↓ para navegar e Enter para selecionar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
