import { NextResponse } from 'next/server'
import { listBuckets } from '@/utils/s3'

export async function GET() {
  try {
    const buckets = await listBuckets()
    
    return NextResponse.json({
      success: true,
      buckets: buckets
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des buckets:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur lors du chargement des collections' },
      { status: 500 }
    )
  }
}
