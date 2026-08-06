'use client';

import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, query, where, Timestamp } from "firebase/firestore";
import { useMemo } from "react";

export function useAdminDashboard() {
    const { firestore } = useFirebase();

    const todayStart = useMemo(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return Timestamp.fromDate(d);
    }, []);

    // Consulta isolada para corretores cadastrados
    const brokersQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'users'), where('userType', '==', 'broker')) : null,
        [firestore]
    );
    const { data: brokers, isLoading: isBrokersLoading, error: brokersError } = useCollection(brokersQuery);

    // Consulta isolada para imobiliárias cadastradas
    const realEstatesQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'brokers')) : null,
        [firestore]
    );
    const { data: realEstates, isLoading: isRealEstatesLoading, error: realEstatesError } = useCollection(realEstatesQuery);

    // Consulta isolada para construtoras cadastradas
    const constructorsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'constructors')) : null,
        [firestore]
    );
    const { data: constructors, isLoading: isConstructorsLoading, error: constructorsError } = useCollection(constructorsQuery);

    // Consultas independentes para Plataforma Hoje (com filtro de hoje)
    const todayBrokersQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'users'), where('userType', '==', 'broker'), where('createdAt', '>=', todayStart)) : null,
        [firestore, todayStart]
    );
    const { data: todayBrokers, isLoading: isTodayBrokersLoading, error: todayBrokersError } = useCollection(todayBrokersQuery);

    const todayRealEstatesQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'brokers'), where('createdAt', '>=', todayStart)) : null,
        [firestore, todayStart]
    );
    const { data: todayRealEstates, isLoading: isTodayRealEstatesLoading, error: todayRealEstatesError } = useCollection(todayRealEstatesQuery);

    const todayConstructorsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'constructors'), where('createdAt', '>=', todayStart)) : null,
        [firestore, todayStart]
    );
    const { data: todayConstructors, isLoading: isTodayConstructorsLoading, error: todayConstructorsError } = useCollection(todayConstructorsQuery);

    const todayTicketsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'tickets'), where('createdAt', '>=', todayStart)) : null,
        [firestore, todayStart]
    );
    const { data: todayTickets, isLoading: isTodayTicketsLoading, error: todayTicketsError } = useCollection(todayTicketsQuery);

    const todayAnsweredTicketsQuery = useMemoFirebase(
        () => firestore ? query(collection(firestore, 'tickets'), where('status', 'in', ['answered', 'closed', 'resolved']), where('updatedAt', '>=', todayStart)) : null,
        [firestore, todayStart]
    );
    const { data: todayAnsweredTickets, isLoading: isTodayAnsweredTicketsLoading, error: todayAnsweredTicketsError } = useCollection(todayAnsweredTicketsQuery);

    return {
        brokers,
        isBrokersLoading,
        brokersError,
        realEstates,
        isRealEstatesLoading,
        realEstatesError,
        constructors,
        isConstructorsLoading,
        constructorsError,
        todayBrokers,
        isTodayBrokersLoading,
        todayBrokersError,
        todayRealEstates,
        isTodayRealEstatesLoading,
        todayRealEstatesError,
        todayConstructors,
        isTodayConstructorsLoading,
        todayConstructorsError,
        todayTickets,
        isTodayTicketsLoading,
        todayTicketsError,
        todayAnsweredTickets,
        isTodayAnsweredTicketsLoading,
        todayAnsweredTicketsError,
    };
}
