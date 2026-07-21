'use client';

/**
 * @fileOverview Barrel file for Firebase services and hooks.
 * Re-exports everything from modularized files.
 */

export * from './provider';
export * from './client-provider';
export * from './auth-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';