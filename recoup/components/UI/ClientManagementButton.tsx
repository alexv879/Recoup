// Button to open Client Management UI
import React from 'react';

interface ClientManagementButtonProps {
    onClick: () => void;
}

const ClientManagementButton: React.FC<ClientManagementButtonProps> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        aria-label="Open client management"
    >
        Manage Clients
    </button>
);

export default ClientManagementButton;
