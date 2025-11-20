// app.js
// Shared Express app (no .listen here)

import pinataSDK from '@pinata/sdk'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import multer from 'multer'
import path from 'path'
import { Readable } from 'stream'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// تحميل متغيرات البيئة من .env في نفس المجلد
dotenv.config({ path: path.resolve(__dirname, '.env') })

const app = express()

// CORS بسيط للديف
app.use(
  cors({
    origin: '*',
  }),
)

app.use(express.json())

// Pinata client (JWT أو API Key/Secret)
const pinata = process.env.PINATA_JWT
  ? new pinataSDK({ pinataJWTKey: process.env.PINATA_JWT })
  : new pinataSDK(process.env.PINATA_API_KEY, process.env.PINATA_API_SECRET)

// اختبار الاتصال بـ Pinata (اختياري)
;(async () => {
  try {
    const auth = await pinata.testAuthentication?.()
    console.log('Pinata auth OK:', auth || 'ok')
  } catch (e) {
    console.error('Pinata authentication FAILED. Check env vars.', e)
  }
})()

// Health check
app.get('/health', (_req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ ok: true, ts: Date.now() })
})

// Multer لرفع الملف في الذاكرة
const upload = multer({ storage: multer.memoryStorage() })

// =======================
//  POST /api/pin-image
//  يرفع الصورة + يبني JSON للميتاداتا + يرفعه لـ Pinata
// =======================
app.post('/api/pin-image', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) return res.status(400).json({ error: 'No file uploaded' })

    // بس للتأكد في اللوق إن القيم وصلت من الفورم
    console.log('▶️ Incoming body fields:', req.body)

    // 1) رفع الصورة لـ Pinata
    const stream = Readable.from(file.buffer)
    // @ts-ignore: Pinata تحب يكون فيه path
    stream.path = file.originalname || 'upload'

    const imageResult = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: { name: file.originalname || 'Garment Image' },
    })

    const imageUrl = `ipfs://${imageResult.IpfsHash}`

    // 2) بناء الميتاداتا بشكل قريب من اللي كان يطلع لك (Properties)
    const metadata = {
      name: req.body.garmentName || 'Étoile Fashion Passport',
      description:
        req.body.description ||
        'Digital Passport for a sustainable fashion item on Algorand.',
      image: imageUrl,

      // 👇 هنا Pera يعرضها تحت عنوان "Properties" ككروت
      properties: {
        GARMENTNAME: req.body.garmentName || null,
        MATERIALCOMPOSITION: req.body.materialComposition || null,
        FACTORYCOUNTRY: req.body.factoryCountry || null,
        SUSTAINABILITYSCORE: req.body.sustainabilityScore || null,
        CERTIFICATIONS: req.body.certifications || null,
      },
    }

    // 3) رفع JSON للـ Pinata
    const jsonResult = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: { name: 'Étoile Fashion Passport Metadata' },
    })

    const metadataUrl = `ipfs://${jsonResult.IpfsHash}`

    // نرجّع الـ URL للفرونت
    res.status(200).json({ metadataUrl })
  } catch (error) {
    console.error('❌ Pinata upload failed:', error)
    const msg =
      error?.response?.data?.error ||
      error?.response?.data ||
      error?.message ||
      'Failed to pin to IPFS.'
    res.status(500).json({ error: msg })
  }
})

export default app
