
      
'use client';
import { useDoc, useFirebase, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const customizationSchema = z.object({
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  foregroundColor: z.string().optional(),
  ctaButtonText: z.string().optional(),
  ctaButtonBgColor: z.string().optional(),
  ctaButtonTextColor: z.string().optional(),
  ctaButtonIcon: z.string().optional(),
  searchButtonBgColor: z.string().optional(),
  searchButtonTextColor: z.string().optional(),
  statsSectionBgColor: z.string().optional(),
  statsNumberColor: z.string().optional(),
  statsLabelColor: z.string().optional(),
  cardIconColor: z.string().optional(),
  cardValueColor: z.string().optional(),
  cardTitleColor: z.string().optional(),
  statusTagBgColor: z.string().optional(),
  statusTagTextColor: z.string().optional(),
  aboutSectionBgColor: z.string().optional(),
  aboutTaglineColor: z.string().optional(),
  aboutTitleColor: z.string().optional(),
  aboutTextColor: z.string().optional(),
  mapSectionBgColor: z.string().optional(),
  mapTitleColor: z.string().optional(),
  mapTextColor: z.string().optional(),
  mapButtonBgColor: z.string().optional(),
  mapButtonTextColor: z.string().optional(),
});

type CustomizationFormData = z.infer<typeof customizationSchema>;

type BrokerData = {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    homepage?: {
      heroTitle?: string;
      heroSubtitle?: string;
      heroTagline?: string;
      heroImageUrl?: string;
      ctaButtonText?: string;
      ctaButtonBgColor?: string;
      ctaButtonTextColor?: string;
      ctaButtonIcon?: string;
      searchButtonBgColor?: string;
      searchButtonTextColor?: string;
      statsSectionBgColor?: string;
      statsNumberColor?: string;
      statsLabelColor?: string;
      statsSold?: string;
      statsExperience?: string;
      cardIconColor?: string;
      cardValueColor?: string;
      cardTitleColor?: string;
      statusTagBgColor?: string;
      statusTagTextColor?: string;
      aboutSectionBgColor?: string;
      aboutTaglineColor?: string;
      aboutTitleColor?: string;
      aboutTextColor?: string;
      mapSectionBgColor?: string;
      mapTitleColor?: string;
      mapTextColor?: string;
      mapButtonBgColor?: string;
      mapButtonTextColor?: string;
    };
    slug?: string;
};

function hexToHsl(hex: string): string {
    if (!hex) return '0 0% 0%';
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
        return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return '0 0% 0%'; // Invalid hex
    }

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
}


function hslToHex(hslStr: string): string {
    if (!hslStr || typeof hslStr !== 'string') return '#000000';
    const parts = hslStr.match(/(\d+(\.\d+)?)/g);
    if (!parts || parts.length < 3) return '#000000';
    
    let h = parseFloat(parts[0]);
    let s = parseFloat(parts[1]);
    let l = parseFloat(parts[2]);

    const sNormalized = s / 100;
    const lNormalized = l / 100;

    let c = (1 - Math.abs(2 * lNormalized - 1)) * sNormalized;
    let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    let m = lNormalized - c / 2;
    let r = 0, g = 0, b = 0;

    if (0 <= h && h < 60) {
        r = c; g = x; b = 0;
    } else if (60 <= h && h < 120) {
        r = x; g = c; b = 0;
    } else if (120 <= h && h < 180) {
        r = 0; g = c; b = x;
    } else if (180 <= h && h < 240) {
        r = 0; g = x; b = c;
    } else if (240 <= h && h < 300) {
        r = x; g = 0; b = c;
    } else if (300 <= h && h < 360) {
        r = c; g = 0; b = x;
    }
    
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}



const ColorInputRow = ({ name, label, sublabel, form }: { name: keyof CustomizationFormData; label: string; sublabel: string; form: any }) => {
    const [color, setColor] = useState(() => hslToHex(form.getValues(name) || '0 0% 0%'));

    useEffect(() => {
        const subscription = form.watch((value: any) => {
            const newHsl = value[name] || '0 0% 0%';
            setColor(hslToHex(newHsl));
        });
        return () => subscription.unsubscribe();
    }, [form, name]);

    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setColor(newHex);
        if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newHex)) {
            form.setValue(name, hexToHsl(newHex), { shouldDirty: true });
        }
    };
    
    const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newHex = e.target.value;
        setColor(newHex);
        form.setValue(name, hexToHsl(newHex), { shouldDirty: true });
    };

    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="relative size-10 rounded-full border border-gray-200 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform" style={{ backgroundColor: color }}>
                    <input className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" type="color" value={color} onChange={handleColorPickerChange} />
                </div>
                <div>
                    <p className="text-sm font-bold text-text-main">{label}</p>
                    <p className="text-[10px] text-text-secondary font-medium font-mono uppercase">{sublabel}</p>
                </div>
            </div>
            <div className="w-32">
                <Input className="w-full bg-gray-50 border-gray-200 rounded-lg text-sm font-mono text-center focus:ring-secondary focus:border-secondary" type="text" value={color} onChange={handleHexChange} />
            </div>
        </div>
    );
};

// Define the hardcoded default theme colors
const defaultThemeColors: CustomizationFormData = {
    primaryColor: '80 99% 49%',
    secondaryColor: '110 16% 8%',
    accentColor: '90 20% 97%',
    backgroundColor: '0 0% 100%',
    foregroundColor: '110 16% 8%',
    ctaButtonText: 'Fale Comigo',
    ctaButtonBgColor: '80 99% 49%',
    ctaButtonTextColor: '110 16% 8%',
    ctaButtonIcon: 'chat_bubble',
    searchButtonBgColor: '110 16% 8%',
    searchButtonTextColor: '80 99% 49%',
    statsSectionBgColor: '0 0% 100%',
    statsNumberColor: '80 99% 49%',
    statsLabelColor: '220 9% 46%',
    cardIconColor: '80 99% 49%',
    cardValueColor: '80 99% 49%',
    cardTitleColor: '110 16% 8%',
    statusTagBgColor: '80 99% 49%',
    statusTagTextColor: '110 16% 8%',
    aboutSectionBgColor: '0 0% 100%',
    aboutTaglineColor: '80 99% 49%',
    aboutTitleColor: '110 16% 8%',
    aboutTextColor: '220 9% 46%',
    mapSectionBgColor: '90 20% 97%',
    mapTitleColor: '0 0% 100%',
    mapTextColor: '0 0% 80%',
    mapButtonBgColor: '80 99% 49%',
    mapButtonTextColor: '110 16% 8%',
};

const iconOptions = [
    { value: 'chat_bubble', label: 'Balão de Chat' },
    { value: 'call', label: 'Telefone' },
    { value: 'mail', label: 'E-mail' },
    { value: 'send', label: 'Enviar' },
    { value: 'forum', label: 'Fórum' },
    { value: 'textsms', label: 'SMS' },
];

export default function EditSiteColorsPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const brokerDocRef = useMemoFirebase(
    () => (user ? doc(firestore, 'brokers', user.uid) : null),
    [firestore, user]
  );
  
  const { data: brokerData, isLoading } = useDoc<BrokerData>(brokerDocRef);

  const form = useForm<CustomizationFormData>({
    resolver: zodResolver(customizationSchema),
    defaultValues: defaultThemeColors,
  });
  
  const watchedColors = useWatch({ control: form.control });

  // Add state for collapsible sections
  const [isMarcaOpen, setIsMarcaOpen] = useState(true);
  const [isInterfaceOpen, setIsInterfaceOpen] = useState(true);
  const [isTipografiaOpen, setIsTipografiaOpen] = useState(true);
  const [isCtaOpen, setIsCtaOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [isStatusTagOpen, setIsStatusTagOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);


  // When broker data loads, populate the form with saved values, falling back to defaults.
   useEffect(() => {
    if (brokerData) {
      form.reset({
        primaryColor: brokerData.primaryColor || defaultThemeColors.primaryColor,
        secondaryColor: brokerData.secondaryColor || defaultThemeColors.secondaryColor,
        accentColor: brokerData.accentColor || defaultThemeColors.accentColor,
        backgroundColor: brokerData.backgroundColor || defaultThemeColors.backgroundColor,
        foregroundColor: brokerData.foregroundColor || defaultThemeColors.foregroundColor,
        ctaButtonText: brokerData.homepage?.ctaButtonText || defaultThemeColors.ctaButtonText,
        ctaButtonBgColor: brokerData.homepage?.ctaButtonBgColor || defaultThemeColors.ctaButtonBgColor,
        ctaButtonTextColor: brokerData.homepage?.ctaButtonTextColor || defaultThemeColors.ctaButtonTextColor,
        ctaButtonIcon: brokerData.homepage?.ctaButtonIcon || defaultThemeColors.ctaButtonIcon,
        searchButtonBgColor: brokerData.homepage?.searchButtonBgColor || defaultThemeColors.searchButtonBgColor,
        searchButtonTextColor: brokerData.homepage?.searchButtonTextColor || defaultThemeColors.searchButtonTextColor,
        statsSectionBgColor: brokerData.homepage?.statsSectionBgColor || defaultThemeColors.statsSectionBgColor,
        statsNumberColor: brokerData.homepage?.statsNumberColor || defaultThemeColors.statsNumberColor,
        statsLabelColor: brokerData.homepage?.statsLabelColor || defaultThemeColors.statsLabelColor,
        cardIconColor: brokerData.homepage?.cardIconColor || defaultThemeColors.cardIconColor,
        cardValueColor: brokerData.homepage?.cardValueColor || defaultThemeColors.cardValueColor,
        cardTitleColor: brokerData.homepage?.cardTitleColor || defaultThemeColors.cardTitleColor,
        statusTagBgColor: brokerData.homepage?.statusTagBgColor || defaultThemeColors.statusTagBgColor,
        statusTagTextColor: brokerData.homepage?.statusTagTextColor || defaultThemeColors.statusTagTextColor,
        aboutSectionBgColor: brokerData.homepage?.aboutSectionBgColor || defaultThemeColors.aboutSectionBgColor,
        aboutTaglineColor: brokerData.homepage?.aboutTaglineColor || defaultThemeColors.aboutTaglineColor,
        aboutTitleColor: brokerData.homepage?.aboutTitleColor || defaultThemeColors.aboutTitleColor,
        aboutTextColor: brokerData.homepage?.aboutTextColor || defaultThemeColors.aboutTextColor,
        mapSectionBgColor: brokerData.homepage?.mapSectionBgColor || defaultThemeColors.mapSectionBgColor,
        mapTitleColor: brokerData.homepage?.mapTitleColor || defaultThemeColors.mapTitleColor,
        mapTextColor: brokerData.homepage?.mapTextColor || defaultThemeColors.mapTextColor,
        mapButtonBgColor: brokerData.homepage?.mapButtonBgColor || defaultThemeColors.mapButtonBgColor,
        mapButtonTextColor: brokerData.homepage?.mapButtonTextColor || defaultThemeColors.mapButtonTextColor,
      });
    }
  }, [brokerData, form]);

 const onSubmit = (data: CustomizationFormData) => {
    if (!user) return;

    // Separate general colors from homepage specific ones
    const { 
      ctaButtonText, 
      ctaButtonBgColor, 
      ctaButtonTextColor,
      ctaButtonIcon,
      searchButtonBgColor,
      searchButtonTextColor,
      statsSectionBgColor,
      statsNumberColor,
      statsLabelColor,
      cardIconColor,
      cardValueColor,
      cardTitleColor,
      statusTagBgColor,
      statusTagTextColor,
      aboutSectionBgColor,
      aboutTaglineColor,
      aboutTitleColor,
      aboutTextColor,
      mapSectionBgColor,
      mapTitleColor,
      mapTextColor,
      mapButtonBgColor,
      mapButtonTextColor,
      ...globalColors 
    } = data;

    const homepageData = { 
        ctaButtonText, 
        ctaButtonBgColor, 
        ctaButtonTextColor, 
        ctaButtonIcon,
        searchButtonBgColor,
        searchButtonTextColor,
        statsSectionBgColor,
        statsNumberColor,
        statsLabelColor,
        cardIconColor,
        cardValueColor,
        cardTitleColor,
        statusTagBgColor,
        statusTagTextColor,
        aboutSectionBgColor,
        aboutTaglineColor,
        aboutTitleColor,
        aboutTextColor,
        mapSectionBgColor,
        mapTitleColor,
        mapTextColor,
        mapButtonBgColor,
        mapButtonTextColor,
    };
    
    const sanitizedGlobalColors = JSON.parse(JSON.stringify(globalColors));
    const sanitizedHomepageData = JSON.parse(JSON.stringify(homepageData));

    const docRef = doc(firestore, 'brokers', user.uid);
    setDocumentNonBlocking(docRef, { 
      ...sanitizedGlobalColors,
      homepage: sanitizedHomepageData 
    }, { merge: true }); 

    toast({
      title: 'Configurações salvas!',
      description: 'As cores e textos do seu site foram atualizados.',
    });
  };

  const handleReset = () => {
    form.reset(defaultThemeColors);
    toast({
      title: 'Cores Restauradas',
      description: 'O esquema de cores foi revertido para o padrão original do template.',
    });
  };
  
  if (isLoading) {
    return <p>Carregando...</p>;
  }
  
  const previewStyle: React.CSSProperties = {
      '--preview-primary': hslToHex(watchedColors.primaryColor || ''),
      '--preview-secondary': hslToHex(watchedColors.secondaryColor || ''),
      '--preview-bg': hslToHex(watchedColors.backgroundColor || ''),
      '--preview-card': hslToHex(watchedColors.accentColor || ''),
      '--preview-text-main': hslToHex(watchedColors.foregroundColor || ''),
      '--preview-text-support': '#6b7280', // Hardcoded as per layout
      '--preview-stats-bg': hslToHex(watchedColors.statsSectionBgColor || ''),
      '--preview-stats-number': hslToHex(watchedColors.statsNumberColor || ''),
      '--preview-stats-label': hslToHex(watchedColors.statsLabelColor || ''),
      '--preview-card-icon': hslToHex(watchedColors.cardIconColor || ''),
      '--preview-card-value': hslToHex(watchedColors.cardValueColor || ''),
      '--preview-card-title': hslToHex(watchedColors.cardTitleColor || ''),
      '--preview-status-tag-bg': hslToHex(watchedColors.statusTagBgColor || ''),
      '--preview-status-tag-text': hslToHex(watchedColors.statusTagTextColor || ''),
  } as React.CSSProperties;

  const content = brokerData?.homepage || {};
  const defaultContent = {
      heroTagline: "Seu Slogan Aqui",
      heroTitle: "O Título do Seu Site",
      heroSubtitle: "Uma descrição cativante sobre seus serviços.",
      heroImageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDzPeUZUrjmZi1J6YXvGV6PUhFRbF5C43OfQNC14zZjfRDhiA6SJGvTiMBwmOE6NONcPtqlUT-byvh0sabE8__a8rXqGsHVmCRktA8lqGHtXsQLdsEoewXy2QBy6gY780D68cWXi_y3oXYoy6essuqpeSCCySFlIh0JcOuINOy7EpKFi58DMV9dEDK6yg-ZhpdOXpU5_SFlJ77FjB-DgGMFngpcbp6tAnMRQflFN1ocdH4KTnLAGONujmpJBOrpUhWQgzI7rb4_N0E"
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <nav className="flex items-center gap-2 text-xs text-text-secondary mb-2 font-medium">
              <Link className="hover:text-primary transition-colors" href="/dashboard/meu-site">Meu Site</Link>
              <span className="material-symbols-outlined text-[10px]">chevron_right</span>
              <span className="text-text-main">Cores do Site</span>
            </nav>
            <h1 className="text-3xl font-bold text-text-main tracking-tight">Cores do Site</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button type="button" variant="outline" className="bg-white border border-gray-200 hover:border-gray-300 text-text-secondary hover:text-text-main font-bold py-2.5 px-6 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm" onClick={handleReset}>
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              Restaurar Padrão
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-secondary hover:bg-primary text-white hover:text-black font-bold py-2.5 px-6 rounded-lg shadow-sm hover:shadow-glow transition-all duration-300 flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {form.formState.isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                <Collapsible open={isMarcaOpen} onOpenChange={setIsMarcaOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">branding_watermark</span>
                            <h3 className="font-bold text-text-main">Cores da Marca</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <ColorInputRow name="primaryColor" label="Cor Primária" sublabel="primary_color" form={form} />
                        <ColorInputRow name="secondaryColor" label="Cor Secundária" sublabel="secondary_color" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible open={isInterfaceOpen} onOpenChange={setIsInterfaceOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">grid_view</span>
                            <h3 className="font-bold text-text-main">Cores de Interface</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                     <CollapsibleContent className="p-6 space-y-6">
                       <ColorInputRow name="backgroundColor" label="Fundo do Site" sublabel="bg_main" form={form} />
                       <ColorInputRow name="accentColor" label="Fundo de Cards" sublabel="bg_card" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible open={isTipografiaOpen} onOpenChange={setIsTipografiaOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">text_fields</span>
                            <h3 className="font-bold text-text-main">Tipografia</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                     <CollapsibleContent className="p-6 space-y-6">
                       <ColorInputRow name="foregroundColor" label="Texto Principal" sublabel="text_main" form={form} />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative size-10 rounded-full border border-gray-200 flex items-center justify-center bg-[#6b7280]"></div>
                                <div>
                                    <p className="text-sm font-bold text-text-main">Texto de Apoio</p>
                                    <p className="text-[10px] text-text-secondary font-medium font-mono uppercase">text_support</p>
                                </div>
                            </div>
                            <div className="w-32">
                                <Input className="w-full bg-gray-50 border-gray-200 rounded-lg text-sm font-mono text-center" type="text" value="#6B7280" disabled />
                            </div>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
                 <Collapsible open={isCtaOpen} onOpenChange={setIsCtaOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">smart_button</span>
                            <h3 className="font-bold text-text-main">Botão Principal (CTA)</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <FormField control={form.control} name="ctaButtonText" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Texto do Botão</FormLabel>
                                <FormControl>
                                    <Input placeholder="Fale Comigo" {...field} value={field.value ?? ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <FormField
                            control={form.control}
                            name="ctaButtonIcon"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Ícone do Botão</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um ícone" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {iconOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-sm">{option.value}</span>
                                            <span>{option.label}</span>
                                        </div>
                                        </SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <ColorInputRow name="ctaButtonBgColor" label="Cor de Fundo" sublabel="cta_button_bg" form={form} />
                        <ColorInputRow name="ctaButtonTextColor" label="Cor do Texto" sublabel="cta_button_text" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                 <Collapsible open={isSearchOpen} onOpenChange={setIsSearchOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">search</span>
                            <h3 className="font-bold text-text-main">Botão de Busca</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <ColorInputRow name="searchButtonBgColor" label="Cor de Fundo" sublabel="search_button_bg" form={form} />
                        <ColorInputRow name="searchButtonTextColor" label="Cor do Texto" sublabel="search_button_text" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">analytics</span>
                            <h3 className="font-bold text-text-main">Estatísticas em Números</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <ColorInputRow name="statsSectionBgColor" label="Cor de Fundo" sublabel="stats_section_bg" form={form} />
                        <ColorInputRow name="statsNumberColor" label="Cor dos Números" sublabel="stats_number_color" form={form} />
                        <ColorInputRow name="statsLabelColor" label="Cor dos Rótulos" sublabel="stats_label_color" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                 <Collapsible open={isCardOpen} onOpenChange={setIsCardOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">grid_on</span>
                            <h3 className="font-bold text-text-main">Cards de Imóveis</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <ColorInputRow name="cardIconColor" label="Cor dos Ícones" sublabel="card_icon_color" form={form} />
                        <ColorInputRow name="cardValueColor" label="Cor do Preço" sublabel="card_value_color" form={form} />
                        <ColorInputRow name="cardTitleColor" label="Cor do Título" sublabel="card_title_color" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                 <Collapsible open={isStatusTagOpen} onOpenChange={setIsStatusTagOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">label</span>
                            <h3 className="font-bold text-text-main">Tag de Status do Imóvel</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <ColorInputRow name="statusTagBgColor" label="Cor de Fundo" sublabel="status_tag_bg" form={form} />
                        <ColorInputRow name="statusTagTextColor" label="Cor do Texto" sublabel="status_tag_text" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                 <Collapsible open={isAboutOpen} onOpenChange={setIsAboutOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">info</span>
                            <h3 className="font-bold text-text-main">Seção Sobre</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <ColorInputRow name="aboutSectionBgColor" label="Cor de Fundo" sublabel="about_section_bg" form={form} />
                        <ColorInputRow name="aboutTaglineColor" label="Cor da Tagline" sublabel="about_tagline" form={form} />
                        <ColorInputRow name="aboutTitleColor" label="Cor do Título" sublabel="about_title" form={form} />
                        <ColorInputRow name="aboutTextColor" label="Cor do Texto" sublabel="about_text" form={form} />
                    </CollapsibleContent>
                </Collapsible>
                <Collapsible open={isMapOpen} onOpenChange={setIsMapOpen} className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                    <CollapsibleTrigger className="p-5 border-b border-gray-50 flex items-center justify-between gap-2 w-full hover:bg-gray-50/50 transition-colors data-[state=open]:bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">map</span>
                            <h3 className="font-bold text-text-main">Seção Mapa</h3>
                        </div>
                        <span className="material-symbols-outlined text-gray-400 transition-transform duration-300 data-[state=open]:rotate-180">expand_more</span>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-6 space-y-6">
                        <ColorInputRow name="mapSectionBgColor" label="Cor de Fundo" sublabel="map_section_bg" form={form} />
                        <ColorInputRow name="mapTitleColor" label="Cor do Título" sublabel="map_title_color" form={form} />
                        <ColorInputRow name="mapTextColor" label="Cor do Texto" sublabel="map_text_color" form={form} />
                        <ColorInputRow name="mapButtonBgColor" label="Cor Fundo Botão" sublabel="map_button_bg" form={form} />
                        <ColorInputRow name="mapButtonTextColor" label="Cor Texto Botão" sublabel="map_button_text" form={form} />
                    </CollapsibleContent>
                </Collapsible>
            </div>
            {/* The rest of the page remains the same */}
            <div className="lg:col-span-7 xl:col-span-8">
                <div className="bg-white rounded-xl shadow-soft border border-gray-100 h-full flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-secondary">visibility</span>
                            <h3 className="font-bold text-text-main">Visualização em Tempo Real</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-[10px] font-bold text-text-secondary uppercase">Live Preview</span>
                        </div>
                    </div>
                    <div className="flex-grow p-8 bg-gray-50/50" style={previewStyle}>
                        <div className="max-w-3xl mx-auto bg-[var(--preview-bg)] rounded-xl shadow-2xl border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
                            {/* Header Preview */}
                            <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'hsl(var(--border))' }}>
                                <div className="flex items-center gap-2">
                                    <div className="size-6 rounded" style={{ backgroundColor: 'var(--preview-primary)' }}></div>
                                    <div className="h-3 w-20 rounded" style={{ backgroundColor: 'var(--preview-secondary)', opacity: 0.8 }}></div>
                                </div>
                                <div className="flex gap-4 items-center">
                                    <div className="h-2 w-10 bg-[var(--preview-text-support)] opacity-30 rounded hidden sm:block"></div>
                                    <div className="h-2 w-10 bg-[var(--preview-text-support)] opacity-30 rounded hidden sm:block"></div>
                                     <div style={{
                                        backgroundColor: watchedColors.ctaButtonBgColor ? hslToHex(watchedColors.ctaButtonBgColor) : 'var(--preview-primary)',
                                        color: watchedColors.ctaButtonTextColor ? hslToHex(watchedColors.ctaButtonTextColor) : '#000'
                                    }} className="px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1">
                                        <span>{watchedColors.ctaButtonText || 'Fale Comigo'}</span>
                                        <span className="material-symbols-outlined text-[14px]">{watchedColors.ctaButtonIcon || 'chat_bubble'}</span>
                                    </div>
                                </div>
                            </div>
                            {/* Hero Preview */}
                            <div
                                className="relative h-64 flex items-center justify-center overflow-hidden bg-cover bg-center"
                                style={{
                                    backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.6)), url(${content.heroImageUrl || defaultContent.heroImageUrl})`
                                }}
                            >
                                <div className="relative z-10 text-center px-6">
                                    <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}>
                                        {content.heroTagline || defaultContent.heroTagline}
                                    </div>
                                    <h4 className="text-3xl font-bold mb-2" style={{ color: 'white' }} dangerouslySetInnerHTML={{ __html: (content.heroTitle || defaultContent.heroTitle).replace('<span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">', `<span style="color: var(--preview-primary)">`) }}></h4>
                                    <p className="text-sm max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.8)' }}>
                                        {content.heroSubtitle || defaultContent.heroSubtitle}
                                    </p>
                                </div>
                            </div>
                             {/* Stats Preview */}
                            <div style={{ backgroundColor: 'var(--preview-stats-bg, white)'}} className="py-4">
                                <div className="grid grid-cols-2 gap-4 px-4">
                                    <div className="text-center">
                                        <span className="text-lg font-bold" style={{ color: 'var(--preview-stats-number)'}}>{content.statsSold || '+250'}</span>
                                        <span className="text-xs block" style={{ color: 'var(--preview-stats-label)'}}>Imóveis Vendidos</span>
                                    </div>
                                    <div className="text-center">
                                        <span className="text-lg font-bold" style={{ color: 'var(--preview-stats-number)'}}>{content.statsExperience || '12+'}</span>
                                        <span className="text-xs block" style={{ color: 'var(--preview-stats-label)'}}>Anos de Mercado</span>
                                    </div>
                                </div>
                            </div>
                            {/* Card Preview */}
                            <div className="p-8 flex-grow flex items-center justify-center">
                                <div className="rounded-xl overflow-hidden max-w-sm mx-auto shadow-lg group" style={{ backgroundColor: 'var(--preview-card)', border: '1px solid hsl(var(--border))' }}>
                                    <div className="h-32 bg-gray-200 relative" style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuDkXRn_abrq_xKAyoKVmG9rBkNpiH5pbI_8DF3S2P5kicmFjeKjeVv1fjAvIL5GPT8IxW3gAY7aUbywUBvi1UJnHxUHUVwuT5damHsL4vcY8DF1R4C4q16tb28ImYRavBT9wCbFNi_HwakR9tO9FynZWpKb9cjSBRyJ2DCcuQ3WNcEdtkoG2y8e6rZGuD4rCC459eNlGseRJ0mn2eqkbVO4Uk4kdEI-0t918N6Ogssq-n8OREud30-AX0PTTePbp03C1_OEREbHfPRK4ut_S0o')`, backgroundSize: 'cover'}}>
                                        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--preview-status-tag-bg)', color: 'var(--preview-status-tag-text)' }}>DESTAQUE</div>
                                    </div>
                                    <div className="p-4">
                                        <h5 className="font-bold text-sm mb-1 group-hover:text-primary" style={{ color: 'var(--preview-card-title)' }}>Nome do Imóvel</h5>
                                        <p className="text-[10px] flex items-center gap-1 mb-3" style={{ color: 'var(--preview-text-support)' }}>
                                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                                            Bairro, Cidade
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold" style={{ color: 'var(--preview-card-value)' }}>R$ 1.234.567</span>
                                            <span className="material-symbols-outlined text-[20px]" style={{ color: 'var(--preview-card-icon)' }}>favorite</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center">
                            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                <span className="material-symbols-outlined text-secondary text-[18px]">lightbulb</span>
                                <p className="text-xs font-medium text-text-secondary">O preview acima reflete como seu site aparecerá para os clientes.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </form>
    </FormProvider>
  );
}
      
    
    
