import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { writeFile } from 'fs/promises'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)

    // Extract user ID from token
    const tokenParts = token.split('_')
    if (tokenParts.length < 2 || tokenParts[0] !== 'token') {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = tokenParts[1]

    const formData = await request.formData()
    const driverData = JSON.parse(formData.get('driverData') as string)
    const documents = JSON.parse(formData.get('documents') as string)

    // Check if user already has a driver profile
    const existingDriver = await db.driver.findUnique({
      where: { userId }
    })

    if (existingDriver) {
      return NextResponse.json(
        { message: 'Driver profile already exists for this user' },
        { status: 409 }
      )
    }

    // Check if license number or vehicle number already exists
    const conflictingDriver = await db.driver.findFirst({
      where: {
        OR: [
          { licenseNumber: driverData.licenseNumber },
          { vehicleNumber: driverData.vehicleNumber }
        ]
      }
    })

    if (conflictingDriver) {
      return NextResponse.json(
        { message: 'Driver with this license or vehicle number already exists' },
        { status: 409 }
      )
    }

    // Create driver profile
    const newDriver = await db.driver.create({
      data: {
        userId,
        licenseNumber: driverData.licenseNumber,
        vehicleNumber: driverData.vehicleNumber,
        vehicleType: driverData.vehicleType,
        vehicleModel: driverData.vehicleModel,
        vehicleColor: driverData.vehicleColor,
        isAvailable: false, // Start as unavailable until verified
        isVerified: false,
        rating: 0,
        totalRides: 0,
        currentLocationLat: 12.9716, // Default Bangalore coordinates
        currentLocationLng: 77.5946
      }
    })

    // Process document uploads
    const processedDocuments: any[] = []
    const uploadsDir = path.join(process.cwd(), 'uploads', 'documents', newDriver.id)

    try {
      // Create uploads directory if it doesn't exist
      await fs.mkdirSync(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    for (const doc of JSON.parse(documents)) {
      if (doc.file) {
        const fileBuffer = Buffer.from(doc.file.split(',')[1], 'base64') // Extract base64 data
        const fileName = `${doc.type}_${Date.now()}.${doc.fileType.split('/')[1]}`
        const filePath = path.join(uploadsDir, fileName)

        await writeFile(filePath, fileBuffer)

        const document = await db.document.create({
          data: {
            driverId: newDriver.id,
            type: doc.type,
            fileUrl: `/uploads/documents/${newDriver.id}/${fileName}`,
            status: 'PENDING'
          }
        })

        processedDocuments.push(document)
      }
    }

    return NextResponse.json({
      success: true,
      driver: newDriver,
      documents: processedDocuments,
      message: 'Driver registration submitted successfully. Please wait for verification.'
    })

  } catch (error) {
    console.error('Driver registration error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to register driver',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}