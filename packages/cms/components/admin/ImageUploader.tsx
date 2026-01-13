'use client'

import { useState, useCallback } from 'react'

export interface ProcessedImage {
  original: File
  thumb: Blob
  full: Blob
}

interface ImageUploaderProps {
  artworkId: string
  currentImage?: string
  onImageProcessed: (processed: ProcessedImage) => void
  onError?: (message: string) => void
}

// Resize image using canvas
async function resizeImage(file: File, maxWidth: number, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Could not create blob'))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = URL.createObjectURL(file)
  })
}

export function ImageUploader({ artworkId, currentImage, onImageProcessed, onError }: ImageUploaderProps) {
  const [preview, setPreview] = useState(currentImage)
  const [dragOver, setDragOver] = useState(false)
  const [processing, setProcessing] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file')
      return
    }

    // Show preview immediately
    setPreview(URL.createObjectURL(file))
    setProcessing(true)

    try {
      // Resize in background while user fills form
      const [thumb, full] = await Promise.all([
        resizeImage(file, 400, 0.85),
        resizeImage(file, 1600, 0.90)
      ])

      // Pass processed images to parent (will upload on Save)
      onImageProcessed({ original: file, thumb, full })
    } catch (err) {
      console.error('Resize error:', err)
      onError?.('Failed to process image')
      setPreview(currentImage)
    } finally {
      setProcessing(false)
    }
  }, [currentImage, onImageProcessed, onError])

  return (
    <div
      className={`upload-zone ${dragOver ? 'upload-zone-active' : ''}`}
      style={{
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
      }}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      {preview ? (
        <img
          src={preview}
          alt="Preview"
          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
        />
      ) : (
        <p className="text-secondary">
          Drop image here or click to upload
        </p>
      )}

      {processing && (
        <p style={{ marginTop: '8px', color: '#2d4a3d', fontSize: '14px' }}>
          Resizing...
        </p>
      )}

      <input
        id="file-input"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
    </div>
  )
}
