'use client';
import React from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  aspectRatio: string;
  formats: string;
  recommendation: string;
  note: string;
  transparency?: boolean;
}

export default function ImageFieldInfoModal({ 
  isOpen, onClose, title, aspectRatio, formats, recommendation, note, transparency 
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg">Como preparar sua imagem</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">X</button>
        </div>
        
        <div className="p-6 space-y-4">
          <div><p className="font-bold text-sm text-gray-500">PROPORÇÃO</p><p>{aspectRatio}</p></div>
          <div><p className="font-bold text-sm text-gray-500">FORMATO</p><p>{formats}</p></div>
          {transparency && <div><p className="font-bold text-sm text-gray-500">TRANSPARÊNCIA</p><p>Preservada</p></div>}
          <div><p className="font-bold text-sm text-gray-500">RECOMENDAÇÃO</p><p>{recommendation}</p></div>
          <div><p className="font-bold text-sm text-gray-500">OBSERVAÇÃO</p><p>{note}</p></div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Entendi</button>
        </div>
      </div>
    </div>
  );
}
