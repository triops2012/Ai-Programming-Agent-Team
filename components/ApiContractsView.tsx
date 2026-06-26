import React, { useState, useMemo } from 'react';
import { ApiContract, Team } from '../types.ts';

interface ApiContractsViewProps {
    contracts: ApiContract[];
    teams: Team[];
}

const JsonViewer: React.FC<{ data: object }> = ({ data }) => {
    const formattedJson = JSON.stringify(data, null, 2);
    return (
        <pre className="bg-gray-800 text-white text-xs p-3 rounded-md overflow-auto">
            <code>{formattedJson}</code>
        </pre>
    );
};


export const ApiContractsView: React.FC<ApiContractsViewProps> = ({ contracts, teams }) => {
    const [expandedContractId, setExpandedContractId] = useState<string | null>(null);
    const teamNameMap = useMemo(() => new Map(teams.map(t => [t.id, t.name])), [teams]);

    const toggleExpand = (contractId: string) => {
        setExpandedContractId(prevId => (prevId === contractId ? null : contractId));
    };
    
    if (contracts.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-center p-8">
                <p className="text-gray-600">
                    No se han definido contratos de API en este proyecto.
                    <br />
                    <span className="text-sm">Se generarán automáticamente cuando el Líder Técnico detecte una necesidad de comunicación entre equipos durante la planificación de un sprint.</span>
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-4">
            {contracts.map(contract => (
                <div key={contract.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpand(contract.id)}>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    contract.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {contract.status.toUpperCase()}
                                </span>
                                <p className="text-lg font-bold text-gray-800 mt-2 font-mono">
                                    <span className="text-blue-600">{contract.method}</span> {contract.endpoint}
                                </p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                                <p><strong>Proveedor:</strong> {teamNameMap.get(contract.providerTeamId) || 'Desconocido'}</p>
                                <p><strong>Consumidor:</strong> {teamNameMap.get(contract.consumerTeamId) || 'Desconocido'}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{contract.description}</p>
                    </div>
                    {expandedContractId === contract.id && (
                        <div className="p-4 border-t border-gray-200 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-semibold mb-2">Request Schema</h4>
                                    <JsonViewer data={contract.requestSchema} />
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Response Schema</h4>
                                    <JsonViewer data={contract.responseSchema} />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};