import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader } from 'lucide-react';

const ExportReport = ({ onExport, loading = false }) => {
  const [showMenu, setShowMenu] = useState(false);

  const exportOptions = [
    { format: 'pdf', label: 'PDF', icon: FileText, color: 'red' },
    { format: 'excel', label: 'Excel', icon: FileSpreadsheet, color: 'green' },
    { format: 'csv', label: 'CSV', icon: FileText, color: 'blue' }
  ];

  const handleExport = (format) => {
    onExport(format);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg hover:bg-white/30 transition-colors flex items-center disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader className="w-5 h-5 mr-2 animate-spin" />
            Export en cours...
          </>
        ) : (
          <>
            <Download className="w-5 h-5 mr-2" />
            Exporter
          </>
        )}
      </button>

      {showMenu && !loading && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-10">
          {exportOptions.map((option) => {
            const IconComponent = option.icon;
            
            return (
              <button
                key={option.format}
                onClick={() => handleExport(option.format)}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-3 transition-colors"
              >
                <div className={`p-1.5 rounded bg-${option.color}-100`}>
                  <IconComponent className={`w-4 h-4 text-${option.color}-600`} />
                </div>
                <span className="text-gray-700">{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ExportReport;