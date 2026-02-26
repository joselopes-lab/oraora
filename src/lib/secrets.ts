
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

/**
 * Utility to fetch secrets from environment variables or Google Cloud Secret Manager.
 * This should only be called in Server Components or Server Actions.
 */
export async function getSecret(secretName: string): Promise<string | undefined> {
  // 1. Try to get from local environment variables first
  const localValue = process.env[secretName];
  if (localValue) {
    return localValue;
  }

  // 2. If not found and in a server environment, try Google Cloud Secret Manager
  if (typeof window === 'undefined') {
    try {
      const client = new SecretManagerServiceClient();
      const projectId = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
      
      if (!projectId) {
        console.warn(`getSecret: Project ID not found. Skipping Secret Manager for ${secretName}.`);
        return undefined;
      }

      const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
      const [version] = await client.accessSecretVersion({ name });
      
      const payload = version.payload?.data?.toString();
      return payload;
    } catch (error) {
      // Don't throw, just log and return undefined to allow fallbacks
      console.warn(`getSecret: Could not retrieve ${secretName} from Secret Manager.`, error);
      return undefined;
    }
  }

  return undefined;
}
