// Advanced Autocomplete Client Selector for Relay
import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, X } from 'lucide-react';

interface Client {
    id: string;
    name: string;
    email: string;
    company?: string;
}

interface ClientSelectorProps {
    clients: Client[];
    onSelectClient: (client: Client) => void;
    onAddNewClient: (name: string) => void;
    selectedClient?: Client | null;
    maxSuggestions?: number;
}

const ClientSelector: React.FC<ClientSelectorProps> = ({
    clients = [],
    onSelectClient,
    onAddNewClient,
    selectedClient = null,
    maxSuggestions = 10,
}) => {
    const [inputValue, setInputValue] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [recentClients, setRecentClients] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const recent = JSON.parse(localStorage.getItem('recentClients') || '[]');
        setRecentClients(recent);
    }, []);

    const handleInputChange = (value: string) => {
        setInputValue(value);
        setSelectedIndex(-1);
        if (value.trim().length < 2) {
            setFilteredClients([]);
            setIsOpen(false);
            return;
        }
        const searchTerm = value.toLowerCase();
        const filtered = clients
            .filter(client =>
                client.name.toLowerCase().includes(searchTerm) ||
                client.email.toLowerCase().includes(searchTerm) ||
                (client.company && client.company.toLowerCase().includes(searchTerm))
            )
            .slice(0, maxSuggestions);
        setFilteredClients(filtered);
        setIsOpen(filtered.length > 0);
    };

    // Predictive highlighting helper
    function getHighlightedText(text: string, input: string) {
        if (!input) return text;
        const idx = text.toLowerCase().indexOf(input.toLowerCase());
        if (idx === -1) return text;
        const before = text.slice(0, idx);
        const match = text.slice(idx, idx + input.length);
        const after = text.slice(idx + input.length);
        return (
            <>
                {before}
                <span className="font-semibold text-blue-700">{match}</span>
                <span className="font-bold text-gray-900">{after}</span>
            </>
        );
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isOpen && e.key !== 'ArrowDown') return;
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setIsOpen(true);
                setSelectedIndex(prev =>
                    prev < filteredClients.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredClients.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0) {
                    selectClient(filteredClients[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                setInputValue('');
                break;
            default:
                break;
        }
    };

    const selectClient = (client: Client) => {
        setInputValue(client.name);
        setIsOpen(false);
        onSelectClient(client);
        const recent = JSON.parse(localStorage.getItem('recentClients') || '[]');
        const updated = [client.id, ...recent.filter((id: string) => id !== client.id)].slice(0, 5);
        localStorage.setItem('recentClients', JSON.stringify(updated));
    };

    const recentClientObjects = recentClients
        .map(id => clients.find(c => c.id === id))
        .filter(Boolean)
        .slice(0, 3);

    const showNoResults = inputValue.length >= 2 && filteredClients.length === 0;

    // Mobile bottom sheet for selector
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    return (
        <div className="relative w-full">
            {/* Desktop selector */}
            {!isMobile && (
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search or select client..."
                        value={inputValue}
                        onChange={e => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                            if (inputValue.length >= 2) setIsOpen(true);
                        }}
                        aria-label="Select client"
                        aria-autocomplete="list"
                        aria-expanded={isOpen}
                        aria-controls="client-dropdown"
                        role="combobox"
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {inputValue && (
                        <button
                            onClick={() => {
                                setInputValue('');
                                setFilteredClients([]);
                                setIsOpen(false);
                                inputRef.current?.focus();
                            }}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            aria-label="Clear search"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
            {/* Mobile bottom sheet selector */}
            {isMobile && (
                <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-lg p-4" role="dialog" aria-modal="true" aria-labelledby="mobile-client-selector-title">
                    <div className="flex justify-between items-center mb-2">
                        <span id="mobile-client-selector-title" className="text-lg font-bold">Select Client</span>
                        <button onClick={() => setIsOpen(false)} aria-label="Close selector" className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search or select client..."
                        value={inputValue}
                        onChange={e => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        aria-label="Select client"
                        aria-autocomplete="list"
                        aria-expanded={isOpen}
                        aria-controls="client-dropdown"
                        role="combobox"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg mb-2"
                        style={{ fontSize: '16px', minHeight: '48px' }}
                    />
                    {isOpen && (
                        <div id="client-dropdown" role="listbox" className="max-h-80 overflow-y-auto">
                            {!inputValue && recentClientObjects.length > 0 && (
                                <>
                                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-100">Recently Used</div>
                                    {recentClientObjects.map(client => (
                                        <button
                                            key={client!.id}
                                            onClick={() => selectClient(client!)}
                                            className="w-full text-left px-4 py-3 mb-2 rounded-lg bg-gray-50 hover:bg-blue-50"
                                            style={{ minHeight: '48px' }}
                                        >
                                            <p className="font-medium text-gray-900">{client!.name}</p>
                                            <p className="text-sm text-gray-600">{client!.email}</p>
                                        </button>
                                    ))}
                                </>
                            )}
                            {filteredClients.length > 0 && (
                                <>
                                    <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase bg-gray-50 border-b border-gray-100">All Clients</div>
                                    {filteredClients.map((client, index) => (
                                        <button
                                            key={client.id}
                                            onClick={() => selectClient(client)}
                                            role="option"
                                            aria-selected={index === selectedIndex}
                                            className={`w-full text-left px-4 py-3 mb-2 rounded-lg ${index === selectedIndex ? 'bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                                            style={{ minHeight: '48px' }}
                                        >
                                            <p className="font-medium text-gray-900">{getHighlightedText(client.name, inputValue)}</p>
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm text-gray-600">{getHighlightedText(client.email, inputValue)}</p>
                                                {client.company && (
                                                    <span className="text-xs text-gray-500 ml-2">{getHighlightedText(client.company, inputValue)}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </>
                            )}
                            {showNoResults && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-gray-600 mb-3">No clients found</p>
                                    <button
                                        onClick={() => onAddNewClient(inputValue)}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                                        style={{ minHeight: '48px' }}
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add new client
                                    </button>
                                </div>
                            )}
                            {filteredClients.length > 0 && (
                                <button
                                    onClick={() => onAddNewClient(inputValue)}
                                    className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 border-t border-gray-200 text-blue-600 font-semibold transition-colors flex items-center gap-2"
                                    style={{ minHeight: '48px' }}
                                >
                                    <Plus className="w-4 h-4" />
                                    Add new client
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ClientSelector;
