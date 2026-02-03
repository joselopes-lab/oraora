'use client';

export default function Loading() {
  return (
     <div className="flex-1 flex flex-col items-center justify-center min-h-screen gap-4 bg-background-light">
         <div className="flex items-center gap-2 text-muted-foreground">
         <span className="material-symbols-outlined animate-spin text-lg text-primary">progress_activity</span>
         <span className="text-sm font-medium">Carregando seu painel...</span>
         </div>
     </div>
  )
}
