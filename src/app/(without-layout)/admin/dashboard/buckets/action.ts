'use server'

import { createBucket as createS3Bucket, removeBucket, listBuckets } from '@/utils/s3';

export async function createBucket(bucketName: string) {
  try {
    // Vérifier que le bucket n'existe pas déjà
    const existingBuckets = await listBuckets();
    if (existingBuckets.some(bucket => bucket.name === bucketName)) {
      return {
        success: false,
        error: 'Une collection avec ce nom existe déjà'
      };
    }

    await createS3Bucket(bucketName);

    return {
      success: true,
      message: 'Collection créée avec succès'
    };
  } catch (error) {
    console.error('Erreur lors de la création du bucket:', error);
    return {
      success: false,
      error: 'Erreur lors de la création de la collection'
    };
  }
}

export async function deleteBucket(bucketName: string) {
  try {
    await removeBucket(bucketName);

    return {
      success: true,
      message: 'Collection supprimée avec succès'
    };
  } catch (error) {
    console.error('Erreur lors de la suppression du bucket:', error);
    return {
      success: false,
      error: 'Erreur lors de la suppression de la collection. Assurez-vous que la collection est vide.'
    };
  }
}
