'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useAuthContext } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

type HelpVideoItem = {
  id: string;
  title: string;
  description?: string;
  page: string;
  videoUrl: string;
  active: boolean;
  order: number;
};

export function HelpVideo({ page }: { page: string }) {
  const firestore = useFirestore();
  const { user, authLoading } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);

  const videosQuery = useMemoFirebase(
    () => {
      console.log('HelpVideo Debug:', { authLoading, userId: user?.uid, hasFirestore: !!firestore, page });
      if (authLoading || !user || !firestore) return null;
      return query(
        collection(firestore, 'helpVideos'),
        where('page', '==', page),
        where('active', '==', true),
        orderBy('order', 'asc')
      );
    },
    [authLoading, user, firestore, page]
  );

  const { data: videos } = useCollection<HelpVideoItem>(videosQuery);

  if (!videos || videos.length === 0) {
    return null;
  }

  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="cursor-pointer flex items-center gap-2 rounded-xl h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
      >
        <span className="material-symbols-outlined text-[18px]">play_circle</span>
        <span>🎥 Como usar esta tela?</span>
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 max-w-3xl border-none bg-transparent shadow-none gap-0">
          <VisuallyHidden>
            <DialogHeader>
              <DialogTitle>Vídeos de Ajuda</DialogTitle>
            </DialogHeader>
          </VisuallyHidden>

          <div className="bg-white w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">help</span>
                Vídeos de Ajuda & Tutoriais
              </h3>
            </div>

            <div className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6">
              {videos.map((video, index) => (
                <div key={video.id || index} className="flex flex-col gap-3 pb-6 border-b border-slate-100 last:border-none last:pb-0 text-left">
                  <h4 className="text-base font-bold text-slate-900">{video.title}</h4>
                  {video.description && (
                    <p className="text-sm text-slate-600">{video.description}</p>
                  )}
                  <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-inner">
                    <iframe
                      src={getEmbedUrl(video.videoUrl)}
                      title={video.title}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
