'use client';
import React, { useState, useCallback } from 'react';
import Cropper, { Area, Point, Zoom } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/image-utils';

interface Props {
  source: string;
  aspectRatio: number | null;
  mode: 'image' | 'logo';
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

export default function ImageEditorModal({ source, aspectRatio, mode, onCancel, onConfirm }: Props) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = async () => {
    if (croppedAreaPixels) {
      const croppedImage = await getCroppedImg(source, croppedAreaPixels);
      if (croppedImage) {
        onConfirm(croppedImage);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-lg">{mode === 'logo' ? 'Ajuste sua marca' : 'Ajuste sua imagem'}</h3>
        </div>
        
        <div className="relative w-full h-96 bg-gray-200">
          <Cropper
            image={source}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio || 1}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-4 flex gap-4">
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancelar</button>
          <button onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Usar esta imagem</button>
        </div>
      </div>
    </div>
  );
}
