
'use client';

import { useState, useEffect } from 'react';
import { type Banner } from '@/app/dashboard/banners/page';
import { incrementBannerView, incrementBannerClick } from '@/app/dashboard/banners/actions';
import Image from 'next/image';

interface BannerDisplayProps {
    banners?: Banner[];
}

export default function BannerDisplay({ banners }: BannerDisplayProps) {
    const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);

    useEffect(() => {
        const setupBanner = async () => {
            if (banners && banners.length > 0) {
                const randomIndex = Math.floor(Math.random() * banners.length);
                const banner = banners[randomIndex];
                setSelectedBanner(banner);
                if (banner.id) {
                    await incrementBannerView(banner.id);
                }
            } else {
                setSelectedBanner(null);
            }
        };
        setupBanner();
    }, [banners]);
    
    const handleClick = async () => {
        if (selectedBanner && selectedBanner.id) {
            await incrementBannerClick(selectedBanner.id);
            if (selectedBanner.type === 'image' && selectedBanner.link) {
                window.open(selectedBanner.link, '_blank', 'noopener,noreferrer');
            }
        }
    }

    if (!selectedBanner) {
        return null;
    }
    
    const renderBannerContent = () => {
        if (selectedBanner.type === 'html') {
            return <div className="w-auto flex items-center justify-center cursor-pointer" onClick={handleClick} dangerouslySetInnerHTML={{ __html: selectedBanner.content }} />;
        }
        
        if (selectedBanner.type === 'image') {
            const image = (
                <div className="relative w-full aspect-[728/90]">
                    <Image 
                        src={selectedBanner.content} 
                        alt={selectedBanner.name} 
                        fill
                        sizes="100vw"
                        className="rounded-md object-contain"
                    />
                </div>
            );

             if (selectedBanner.link) {
                return (
                    <div onClick={handleClick} className="cursor-pointer w-full">
                        {image}
                    </div>
                );
            }
            return <div onClick={handleClick} className="w-full">{image}</div>;
        }
        return null;
    }

    return (
        <div className="my-8 flex justify-center items-center w-full">
            {renderBannerContent()}
        </div>
    );
}
