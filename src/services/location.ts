
// src/services/location.ts
import { allStates } from '@/lib/states';

export interface State {
  id: number;
  sigla: string;
  nome: string;
}

export interface City {
  id: number;
  nome: string;
}

export interface Neighborhood {
    id: number;
    nome: string;
}

const joaoPessoaNeighborhoods: Neighborhood[] = [
    { id: 0, nome: "Não informado" },
    { id: 1, nome: "Aeroclube" },
    { id: 2, nome: "Água Fria" },
    { id: 3, nome: "Altiplano Cabo Branco" },
    { id: 4, nome: "Anatólia" },
    { id: 5, nome: "Bairro das Indústrias" },
    { id: 6, nome: "Bairro dos Estados" },
    { id: 7, nome: "Bairro dos Ipês" },
    { id: 8, nome: "Bairro dos Novaes" },
    { id: 9, nome: "Bancários" },
    { id: 10, nome: "Barra de Gramame" },
    { id: 11, nome: "Bessa" },
    { id: 12, nome: "Brisamar" },
    { id: 13, nome: "Cabo Branco" },
    { id: 14, nome: "Castelo Branco" },
    { id: 15, nome: "Centro" },
    { id: 16, nome: "Cidade dos Colibris" },
    { id: 17, nome: "Conjunto Valentina de Figueiredo" },
    { id: 18, nome: "Costa e Silva" },
    { id: 19, nome: "Costa do Sol" },
    { id: 20, nome: "Cristo Redentor" },
    { id: 21, nome: "Cruz das Armas" },
    { id: 22, nome: "Cuiá" },
    { id: 23, nome: "Distrito Industrial" },
    { id: 24, nome: "Ernesto Geisel" },
    { id: 25, nome: "Ernani Sátiro" },
    { id: 26, nome: "Expedicionários" },
    { id: 27, nome: "Funcinários" },
    { id: 28, nome: "Grotão" },
    { id: 29, nome: "Gramame" },
    { id: 30, nome: "Jaguaribe" },
    { id: 31, nome: "Jardim Cidade Universitária" },
    { id: 32, nome: "Jardim Esther" },
    { id: 33, nome: "Jardim Luna" },
    { id: 34, nome: "Jardim Oceania" },
    { id: 35, nome: "Jardim São Paulo" },
    { id: 36, nome: "Jardim Veneza" },
    { id: 37, nome: "João Agripino" },
    { id: 38, nome: "João Paulo II" },
    { id: 39, nome: "José Américo de Almeida" },
    { id: 40, nome: "Mandacaru" },
    { id: 41, nome: "Manaíra" },
    { id: 42, nome: "Mangabeira" },
    { id: 43, nome: "Miramar" },
    { id: 44, nome: "Monsenhor Magno" },
    { id: 45, nome: "Muçumagro" },
    { id: 46, nome: "Oitizeiro" },
    { id: 47, nome: "Paratibe" },
    { id: 48, nome: "Penha" },
    { id: 49, nome: "Planalto da Boa Esperança" },
    { id: 50, nome: "Ponta do Seixas" },
    { id: 51, nome: "Portal do Sol" },
    { id: 52, nome: "Praia do Sol" },
    { id: 53, nome: "Presidente Médici" },
    { id: 54, nome: "Rangel" },
    { id: 55, nome: "Roger" },
    { id: 56, nome: "São José" },
    { id: 57, nome: "Tambauzinho" },
    { id: 58, nome: "Tambaú" },
    { id: 59, nome: "Tambiá" },
    { id: 60, nome: "Torre" },
    { id: 61, nome: "Treze de Maio" },
    { id: 62, nome: "Trincheiras" },
    { id: 63, nome: "Valentina de Figueiredo" },
    { id: 64, nome: "Varadouro" },
    { id: 65, nome: "Varjão" }
].sort((a,b) => a.nome.localeCompare(b.nome));

const cabedeloNeighborhoods: Neighborhood[] = [
    { id: 65, nome: "Não informado" },
    { id: 66, nome: "Amazonas" },
    { id: 67, nome: "Areia Dourada" },
    { id: 68, nome: "Brasília de Baixo" },
    { id: 69, nome: "Camalaú" },
    { id: 70, nome: "Camboinha" },
    { id: 71, nome: "Centro" },
    { id: 72, nome: "Formosa" },
    { id: 73, nome: "Intermares" },
    { id: 74, nome: "Jacaré" },
    { id: 75, nome: "Jardim América" },
    { id: 76, nome: "Jardim Brasilia" },
    { id: 77, nome: "Jardim Jericó" },
    { id: 78, nome: "Jardim Manguinhos" },
    { id: 79, nome: "Monte Castelo" },
    { id: 80, nome: "Oceania" },
    { id: 81, nome: "Parque Esperança" },
    { id: 82, nome: "Poço" },
    { id: 83, nome: "Ponta de Matos" },
    { id: 84, nome: "Portal do Poço" },
    { id: 85, nome: "Renascer" },
    { id: 86, nome: "Salgadinho" },
    { id: 87, nome: "Santa Catarina" },
    { id: 88, nome: "Santo Antônio" },
    { id: 89, nome: "Vila Feliz" },
    { id: 90, nome: "Vila São João" },
    { id: 91, nome: "Ponta de Campina" }
].sort((a,b) => a.nome.localeCompare(b.nome));

const natalNeighborhoods: Neighborhood[] = [
    { id: 100, nome: "Não informado" },
    { id: 101, nome: "Alecrim" },
    { id: 102, nome: "Areia Preta" },
    { id: 103, nome: "Barro Vermelho" },
    { id: 104, nome: "Bom Pastor" },
    { id: 105, nome: "Candelária" },
    { id: 106, nome: "Capim Macio" },
    { id: 107, nome: "Cidade Alta" },
    { id: 108, nome: "Cidade da Esperança" },
    { id: 109, nome: "Cidade Nova" },
    { id: 110, nome: "Dix-Sept Rosado" },
    { id: 111, nome: "Felipe Camarão" },
    { id: 112, nome: "Guarapes" },
    { id: 113, nome: "Igapó" },
    { id: 114, nome: "Lagoa Azul" },
    { id: 115, nome: "Lagoa Nova" },
    { id: 116, nome: "Lagoa Seca" },
    { id: 117, nome: "Mãe Luiza" },
    { id: 118, nome: "Neópolis" },
    { id: 119, nome: "Nossa Senhora da Apresentação" },
    { id: 120, nome: "Nossa Senhora de Nazaré" },
    { id: 121, nome: "Nova Descoberta" },
    { id: 122, nome: "Pajuçara" },
    { id: 123, nome: "Petrópolis" },
    { id: 124, nome: "Pitimbu" },
    { id: 125, nome: "Planalto" },
    { id: 126, nome: "Ponta Negra" },
    { id: 127, nome: "Potengi" },
    { id: 128, nome: "Praia do Meio" },
    { id: 129, nome: "Quintas" },
    { id: 130, nome: "Redinha" },
    { id: 131, nome: "Ribeira" },
    { id: 132, nome: "Rocas" },
    { id: 133, nome: "Salinas" },
    { id: 134, nome: "Santos Reis" },
    { id: 135, nome: "Tirol" },
    { id: 136, nome: "Nordeste" }
].sort((a,b) => a.nome.localeCompare(b.nome));

const fozDoIguacuNeighborhoods: Neighborhood[] = [
    { id: 200, nome: "Não informado" },
    { id: 201, nome: "Campos do Iguaçu" },
    { id: 202, nome: "Centro" },
    { id: 203, nome: "Cidade Nova" },
    { id: 204, nome: "Jardim América" },
    { id: 205, nome: "Jardim Central" },
    { id: 206, nome: "Jardim Curitibano" },
    { id: 207, nome: "Jardim Duarte" },
    { id: 208, nome: "Jardim das Flores" },
    { id: 209, nome: "Jardim Ipê" },
    { id: 210, nome: "Jardim Jupira" },
    { id: 211, nome: "Jardim Lancaster" },
    { id: 212, nome: "Jardim das Laranjeiras" },
    { id: 213, nome: "Jardim Panorama" },
    { id: 214, nome: "Jardim Petrópolis" },
    { id: 215, nome: "Jardim Polo Centro" },
    { id: 216, nome: "Jardim Santa Rosa" },
    { id: 217, nome: "Jardim São Paulo" },
    { id: 218, nome: "Jardim Tarobá" },
    { id: 219, nome: "Loteamento Bourbon" },
    { id: 220, nome: "Parque Monjolo" },
    { id: 221, nome: "Parque Presidente" },
    { id: 222, nome: "Três Lagoas" },
    { id: 223, nome: "Vila A" },
    { id: 224, nome: "Vila B" },
    { id: 225, nome: "Vila Portes" },
].sort((a,b) => a.nome.localeCompare(b.nome));

const parnamirimNeighborhoods: Neighborhood[] = [
    { id: 300, nome: "Não informado" },
    { id: 301, nome: "Cajupiranga" },
    { id: 302, nome: "Caminho do Sol" },
    { id: 303, nome: "Centro" },
    { id: 304, nome: "Cidade Verde" },
    { id: 305, nome: "Cohabinal" },
    { id: 306, nome: "Emaús" },
    { id: 307, nome: "Jardim Aeroporto" },
    { id: 308, nome: "Jardim Planalto" },
    { id: 309, nome: "Jockey Club" },
    { id: 310, nome: "Liberdade" },
    { id: 311, nome: "Monte Castelo" },
    { id: 312, nome: "Nova Esperança" },
    { id: 313, nome: "Nova Parnamirim" },
    { id: 314, nome: "Parque de Exposições" },
    { id: 315, nome: "Parque Industrial" },
    { id: 316, nome: "Passagem de Areia" },
    { id: 317, nome: "Pium" },
    { id: 318, nome: "Rosa dos Ventos" },
    { id: 319, nome: "Santa Tereza" },
    { id: 320, nome: "Santos Reis" },
    { id: 321, nome: "Vale do Sol" },
    { id: 322, nome: "Vida Nova" }
].sort((a, b) => a.nome.localeCompare(b.nome));

const cascavelNeighborhoods: Neighborhood[] = [
    { id: 400, nome: "Não informado" },
    { id: 401, nome: "14 de Novembro" },
    { id: 402, nome: "Abelha" },
    { id: 403, nome: "Alto Alegre" },
    { id: 404, nome: "Brasmadeira" },
    { id: 405, nome: "Brasília" },
    { id: 406, nome: "Cancelli" },
    { id: 407, nome: "Cascavel Velho" },
    { id: 408, nome: "Cataratas" },
    { id: 409, nome: "Centro" },
    { id: 410, nome: "Ciro Nardi" },
    { id: 411, nome: "Cidade Verde" },
    { id: 412, nome: "Claudete" },
    { id: 413, nome: "Consolata" },
    { id: 414, nome: "Coqueiral" },
    { id: 415, nome: "Country" },
    { id: 416, nome: "Esmeralda" },
    { id: 417, nome: "FAG" },
    { id: 418, nome: "Floresta" },
    { id: 419, nome: "Guarujá" },
    { id: 420, nome: "Interlagos" },
    { id: 421, nome: "Maria Luiza" },
    { id: 422, nome: "Morumbi" },
    { id: 423, nome: "Neva" },
    { id: 424, nome: "Nova Cidade" },
    { id: 425, nome: "Nova Iorque" },
    { id: 426, nome: "Pacaembu" },
    { id: 427, nome: "Parque São Paulo" },
    { id: 428, nome: "Parque Verde" },
    { id: 429, nome: "Pioneiros Catarinenses" },
    { id: 430, nome: "Presidente" },
    { id: 431, nome: "Quebec" },
    { id: 432, nome: "Região do Lago" },
    { id: 433, nome: "Santa Felicidade" },
    { id: 434, nome: "Santa Cruz" },
    { id: 435, nome: "Santo Onofre" },
    { id: 436, nome: "Santos Dumont" },
    { id: 437, nome: "São Cristóvão" },
    { id: 438, nome: "Sede Alvorada" },
    { id: 439, nome: "Tropical" },
    { id: 440, nome: "Universitário" },
].sort((a, b) => a.nome.localeCompare(b.nome));

const recifeNeighborhoods: Neighborhood[] = [
    { id: 500, nome: "Não informado" },
    { id: 501, nome: "Aflitos" },
    { id: 502, nome: "Afogados" },
    { id: 503, nome: "Água Fria" },
    { id: 504, nome: "Alto do Mandu" },
    { id: 505, nome: "Alto José Bonifácio" },
    { id: 506, nome: "Alto José do Pinho" },
    { id: 507, nome: "Apipucos" },
    { id: 508, nome: "Areias" },
    { id: 509, nome: "Arruda" },
    { id: 510, nome: "Barro" },
    { id: 511, nome: "Beberibe" },
    { id: 512, nome: "Boa Viagem" },
    { id: 513, nome: "Boa Vista" },
    { id: 514, nome: "Bomba do Hemetério" },
    { id: 515, nome: "Bongi" },
    { id: 516, nome: "Brasília Teimosa" },
    { id: 517, nome: "Brejo da Guabiraba" },
    { id: 518, nome: "Brejo de Beberibe" },
    { id: 519, nome: "Cabanga" },
    { id: 520, nome: "Caçote" },
    { id: 521, nome: "Cajueiro" },
    { id: 522, nome: "Campina do Barreto" },
    { id: 523, nome: "Campo Grande" },
    { id: 524, nome: "Casa Amarela" },
    { id: 525, nome: "Casa Forte" },
    { id: 526, nome: "Caxangá" },
    { id: 527, nome: "Cidade Universitária" },
    { id: 528, nome: "Coelhos" },
    { id: 529, nome: "Cohab" },
    { id: 530, nome: "Coqueiral" },
    { id: 531, nome: "Cordeiro" },
    { id: 532, nome: "Córrego do Jenipapo" },
    { id: 533, nome: "Curado" },
    { id: 534, nome: "Derby" },
    { id: 535, nome: "Dois Irmãos" },
    { id: 536, nome: "Dois Unidos" },
    { id: 537, nome: "Encruzilhada" },
    { id: 538, nome: "Engenho do Meio" },
    { id: 539, nome: "Espinheiro" },
    { id: 540, nome: "Estância" },
    { id: 541, nome: "Fundão" },
    { id: 542, nome: "Graças" },
    { id: 543, nome: "Guabiraba" },
    { id: 544, nome: "Hipódromo" },
    { id: 545, nome: "Ibura" },
    { id: 546, nome: "Ilha do Leite" },
    { id: 547, nome: "Ilha do Retiro" },
    { id: 548, nome: "Ilha Joana Bezerra" },
    { id: 549, nome: "Imbiribeira" },
    { id: 550, nome: "Iputinga" },
    { id: 551, nome: "Jaqueira" },
    { id: 552, nome: "Jardim São Paulo" },
    { id: 553, nome: "Jiquiá" },
    { id: 554, nome: "Jordão" },
    { id: 555, nome: "Linha do Tiro" },
    { id: 556, nome: "Macaxeira" },
    { id: 557, nome: "Madalena" },
    { id: 558, nome: "Mangabeira" },
    { id: 559, nome: "Mangueira" },
    { id: 560, nome: "Monteiro" },
    { id: 561, nome: "Morro da Conceição" },
    { id: 562, nome: "Mustardinha" },
    { id: 563, nome: "Nova Descoberta" },
    { id: 564, nome: "Paissandu" },
    { id: 565, nome: "Parnamirim" },
    { id: 566, nome: "Passarinho" },
    { id: 567, nome: "Pau Ferro" },
    { id: 568, nome: "Peixinhos" },
    { id: 569, nome: "Pina" },
    { id: 570, nome: "Poço da Panela" },
    { id: 571, nome: "Ponto de Parada" },
    { id: 572, nome: "Porto da Madeira" },
    { id: 573, nome: "Prado" },
    { id: 574, nome: "Recife" },
    { id: 575, nome: "Rosarinho" },
    { id: 576, nome: "San Martin" },
    { id: 577, nome: "Sancho" },
    { id: 578, nome: "Santana" },
    { id: 579, nome: "Santo Amaro" },
    { id: 580, nome: "Santo Antônio" },
    { id: 581, nome: "São José" },
    { id: 582, nome: "Sítio dos Pintos" },
    { id: 583, nome: "Soledade" },
    { id: 584, nome: "Tamarineira" },
    { id: 585, nome: "Tejipió" },
    { id: 586, nome: "Torre" },
    { id: 587, nome: "Torreão" },
    { id: 588, nome: "Torrões" },
    { id: 589, nome: "Totó" },
    { id: 590, nome: "Várzea" },
    { id: 591, nome: "Vasco da Gama" },
    { id: 592, nome: "Zumbi" },
].sort((a, b) => a.nome.localeCompare(b.nome));

const curitibaNeighborhoods: Neighborhood[] = [
    { id: 600, nome: "Não informado" },
    { id: 601, nome: "Abranches" },
    { id: 602, nome: "Água Verde" },
    { id: 603, nome: "Ahú" },
    { id: 604, nome: "Alto Boqueirão" },
    { id: 605, nome: "Alto da Glória" },
    { id: 606, nome: "Alto da Rua XV" },
    { id: 607, nome: "Augusta" },
    { id: 608, nome: "Bacacheri" },
    { id: 609, nome: "Bairro Alto" },
    { id: 610, nome: "Barreirinha" },
    { id: 611, nome: "Batel" },
    { id: 612, nome: "Bigorrilho" },
    { id: 613, nome: "Boa Vista" },
    { id: 614, nome: "Bom Retiro" },
    { id: 615, nome: "Boqueirão" },
    { id: 616, nome: "Butiatuvinha" },
    { id: 617, nome: "Cabral" },
    { id: 618, nome: "Cachoeira" },
    { id: 619, nome: "Cajuru" },
    { id: 620, nome: "Campina do Siqueira" },
    { id: 621, nome: "Campo Comprido" },
    { id: 622, nome: "Campo de Santana" },
    { id: 623, nome: "Capão da Imbuia" },
    { id: 624, nome: "Capão Raso" },
    { id: 625, nome: "Cascatinha" },
    { id: 626, nome: "Centro" },
    { id: 627, nome: "Centro Cívico" },
    { id: 628, nome: "Cidade Industrial de Curitiba (CIC)" },
    { id: 629, nome: "Cristo Rei" },
    { id: 630, nome: "Fanny" },
    { id: 631, nome: "Fazendinha" },
    { id: 632, nome: "Ganchinho" },
    { id: 633, nome: "Guabirotuba" },
    { id: 634, nome: "Guaíra" },
    { id: 635, nome: "Hauer" },
    { id: 636, nome: "Hugo Lange" },
    { id: 637, nome: "Jardim Botânico" },
    { id: 638, nome: "Jardim das Américas" },
    { id: 639, nome: "Jardim Social" },
    { id: 640, nome: "Juvevê" },
    { id: 641, nome: "LamENHA Pequena" },
    { id: 642, nome: "Lindoia" },
    { id: 643, nome: "Mercês" },
    { id: 644, nome: "Mossunguê" },
    { id: 645, nome: "Novo Mundo" },
    { id: 646, nome: "Orleans" },
    { id: 647, nome: "Parolin" },
    { id: 648, nome: "Pilarzinho" },
    { id: 649, nome: "Pinheirinho" },
    { id: 650, nome: "Portão" },
    { id: 651, nome: "Prado Velho" },
    { id: 652, nome: "Rebouças" },
    { id: 653, nome: "Riviera" },
    { id: 654, nome: "Santa Cândida" },
    { id: 655, nome: "Santa Felicidade" },
    { id: 656, nome: "Santa Quitéria" },
    { id: 657, nome: "Santo Inácio" },
    { id: 658, nome: "São Braz" },
    { id: 659, nome: "São Francisco" },
    { id: 660, nome: "São João" },
    { id: 661, nome: "São Lourenço" },
    { id: 662, nome: "São Miguel" },
    { id: 663, nome: "Seminário" },
    { id: 664, nome: "Sítio Cercado" },
    { id: 665, nome: "Taboão" },
    { id: 666, nome: "Tarumã" },
    { id: 667, nome: "Tatuquara" },
    { id: 668, nome: "Tingui" },
    { id: 669, nome: "Uberaba" },
    { id: 670, nome: "Umbará" },
    { id: 671, nome: "Vila Izabel" },
    { id: 672, nome: "Vista Alegre" },
    { id: 673, nome: "Xaxim" },
].sort((a,b) => a.nome.localeCompare(b.nome));

export async function getStates(): Promise<State[]> {
  // Return the local list of states directly.
  return Promise.resolve(allStates);
}

export async function getCitiesByState(stateAcronym: string): Promise<City[]> {
  if (!stateAcronym) return [];
  try {
    const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${stateAcronym}/municipios`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cities for state ${stateAcronym}`);
    }
    const cities: City[] = await response.json();
    return cities;
  } catch (error) {
    console.error(`Error fetching cities for state ${stateAcronym}:`, error);
    return [];
  }
}

export async function getNeighborhoodsByCity(cityId: number, cityName?: string): Promise<Neighborhood[]> {
    if (!cityId) return [];
    
    if (cityName === 'João Pessoa') {
        return Promise.resolve(joaoPessoaNeighborhoods);
    }
    
    if (cityName === 'Cabedelo') {
        return Promise.resolve(cabedeloNeighborhoods);
    }

    if (cityName === 'Natal') {
        return Promise.resolve(natalNeighborhoods);
    }

    if (cityName === 'Foz do Iguaçu') {
        return Promise.resolve(fozDoIguacuNeighborhoods);
    }

    if (cityName === 'Parnamirim') {
        return Promise.resolve(parnamirimNeighborhoods);
    }

    if (cityName === 'Cascavel') {
        return Promise.resolve(cascavelNeighborhoods);
    }

    if (cityName === 'Recife') {
        return Promise.resolve(recifeNeighborhoods);
    }

    if (cityName === 'Curitiba') {
        return Promise.resolve(curitibaNeighborhoods);
    }
    
    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cityId}/distritos`);
        if(!response.ok) {
            // If the API fails or returns no districts, return an empty array for other cities.
            console.warn(`Could not fetch districts for city ${cityId}, it might have no official districts registered.`);
            return [];
        }
        const neighborhoods: Neighborhood[] = await response.json();
        return neighborhoods.sort((a,b) => a.nome.localeCompare(b.nome)); // Sort alphabetically
    } catch(error) {
        console.error(`Error fetching neighborhoods for city ${cityId}:`, error);
        return [];
    }
}
