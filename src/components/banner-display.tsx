
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
                <Image 
                    src={selectedBanner.content} 
                    alt={selectedBanner.name} 
                    width={728} 
                    height={90} 
                    className="rounded-md object-contain h-auto w-auto max-w-full"
                />
            );

             if (selectedBanner.link) {
                return (
                    <div onClick={handleClick} className="cursor-pointer">
                        {image}
                    </div>
                );
            }
            return <div onClick={handleClick}>{image}</div>;
        }
        return null;
    }

    return (
        <div className="my-8 flex justify-center items-center w-full">
            {renderBannerContent()}
        </div>
    );
}
