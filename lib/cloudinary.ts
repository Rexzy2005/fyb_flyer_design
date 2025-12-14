import { v2 as cloudinary } from 'cloudinary'
import { Readable } from 'stream'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  secure_url: string
  public_id: string
  width: number
  height: number
}

export async function uploadImage(
  imageBuffer: Buffer | string,
  folder: string,
  options?: {
    width?: number
    height?: number
    quality?: number
  }
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const uploadOptions: any = {
      folder: `fyb/${folder}`,
      resource_type: 'image',
      format: 'png',
      ...options,
    }

    if (Buffer.isBuffer(imageBuffer)) {
      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
            })
          } else {
            reject(new Error('Upload failed'))
          }
        }
      )

      const readable = new Readable()
      readable.push(imageBuffer)
      readable.push(null)
      readable.pipe(stream)
    } else {
      // Base64 string
      cloudinary.uploader.upload(
        imageBuffer,
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(error)
          } else if (result) {
            resolve({
              secure_url: result.secure_url,
              public_id: result.public_id,
              width: result.width,
              height: result.height,
            })
          } else {
            reject(new Error('Upload failed'))
          }
        }
      )
    }
  })
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export { cloudinary }

