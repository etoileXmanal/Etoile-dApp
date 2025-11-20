// src/components/DesignerPortal.tsx

import { useWallet } from '@txnlab/use-wallet-react'
import React, { useState } from 'react'
import Account from './Account'
import ConnectWallet from './ConnectWallet'
import NFTmint from './NFTmint'

const DesignerPortal: React.FC = () => {
  // Wallet modal state (uses existing ConnectWallet component)
  const [walletModalOpen, setWalletModalOpen] = useState(false)

  // NFT mint modal state (uses existing NFTmint component)
  const [nftModalOpen, setNftModalOpen] = useState(false)

  // Form state (Étoile passport metadata)
  const [garmentName, setGarmentName] = useState('')
  const [materials, setMaterials] = useState('')
  const [factoryCountry, setFactoryCountry] = useState('')
  const [score, setScore] = useState(80)
  const [certs, setCerts] = useState<string[]>([])

  const { activeAddress } = useWallet()

  const handleCertToggle = (value: string) => {
    setCerts(prev =>
      prev.includes(value)
        ? prev.filter(c => c !== value)
        : [...prev, value]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // بسيط: نتأكد من الحقول الإلزامية، لو ناقصة نوقف
    if (!garmentName || !materials || !factoryCountry || score === null) {
      alert('Please fill in all required fields before continuing.')
      return
    }

    // هنا ممكن في المستقبل تخزين الميتاداتا في state أعلى / backend
    // حالياً: نفتح مودال NFTmint ليكمل خطوة رفع الصورة + mint
    setNftModalOpen(true)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: `radial-gradient(circle at top left, #FECFF1 0, #BBF0ED 35%, #ffffff 70%)`,
      }}
    >
      {/* صفحة كاملة بركّز فيها على الهدوء والفخامة */}
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-10">
        {/* Header / Top bar */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900">
              Étoile — Designer Portal
            </h1>
            <p className="text-sm md:text-base text-slate-600 mt-1">
              Create a Digital Fashion Passport for your garment, then mint it as an NFT on Algorand.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            {activeAddress ? (
              <div className="text-xs md:text-sm text-slate-700 text-right">
                <div className="font-medium mb-1">Connected wallet</div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-[#D0CFCF] shadow-sm">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: '#9B6FE2' }}
                  />
                  <Account />
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setWalletModalOpen(true)}
                className="px-4 py-2 rounded-full text-sm font-medium shadow-md border border-transparent"
                style={{
                  background: 'linear-gradient(135deg, #F27BAF, #9B6FE2)',
                  color: '#ffffff',
                }}
              >
                Connect Wallet
              </button>
            )}
          </div>
        </header>

        {/* Small stats strip (optional) */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div
            className="rounded-2xl px-4 py-3 shadow-sm border"
            style={{ borderColor: '#D0CFCF', backgroundColor: '#ffffff' }}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">Passports Created</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">12</p>
          </div>
          <div
            className="rounded-2xl px-4 py-3 shadow-sm border"
            style={{ borderColor: '#D0CFCF', backgroundColor: '#ffffff' }}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">Listed for Sale</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">4</p>
          </div>
          <div
            className="rounded-2xl px-4 py-3 shadow-sm border"
            style={{ borderColor: '#D0CFCF', backgroundColor: '#ffffff' }}
          >
            <p className="text-xs uppercase tracking-wide text-slate-500">Average Sustainability</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">82 / 100</p>
          </div>
        </section>

        {/* Main content: Form card */}
        <section
          className="rounded-3xl shadow-lg border px-6 py-6 md:px-8 md:py-7"
          style={{ borderColor: '#D0CFCF', backgroundColor: '#ffffff' }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-slate-900">
                Create a Digital Fashion Passport
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-1">
                Fill in the sustainability and supply chain data. In the next step, you&apos;ll upload the garment image and mint the NFT.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs md:text-sm"
              style={{ backgroundColor: '#BBF0ED' }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: '#9B6FE2' }}
              />
              EU Digital Product Passport inspired
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Garment Name */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Garment Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={garmentName}
                onChange={e => setGarmentName(e.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2.5 text-sm md:text-base shadow-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#D0CFCF',
                  backgroundColor: '#ffffff',
                  caretColor: '#9B6FE2',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
                }}
                placeholder="e.g., Organic Cotton Oversized Shirt"
              />
            </div>

            {/* Material Composition */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Material Composition <span className="text-rose-500">*</span>
              </label>
              <p className="text-xs text-slate-500 mb-1">
                List main materials and their percentages (e.g., Organic Cotton 85%, Recycled Polyester 15%).
              </p>
              <textarea
                value={materials}
                onChange={e => setMaterials(e.target.value)}
                required
                rows={3}
                className="w-full rounded-xl border px-3 py-2.5 text-sm md:text-base shadow-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#D0CFCF',
                  backgroundColor: '#ffffff',
                  caretColor: '#9B6FE2',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
                }}
              />
            </div>

            {/* Factory Country */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Factory Country <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={factoryCountry}
                onChange={e => setFactoryCountry(e.target.value)}
                required
                className="w-full rounded-xl border px-3 py-2.5 text-sm md:text-base shadow-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: '#D0CFCF',
                  backgroundColor: '#ffffff',
                  caretColor: '#9B6FE2',
                }}
                placeholder="e.g., Portugal, Italy, Turkey…"
              />
            </div>

            {/* Sustainability Score */}
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-slate-800 mb-1">
                  Sustainability Score (0–100) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={e => setScore(Number(e.target.value))}
                  required
                  className="w-full rounded-xl border px-3 py-2.5 text-sm md:text-base shadow-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: '#D0CFCF',
                    backgroundColor: '#ffffff',
                    caretColor: '#9B6FE2',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-700 mb-1">
                  Visual indicator
                </label>
                <div className="w-full h-3 rounded-full bg-[#D0CFCF] overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.min(Math.max(score, 0), 100)}%`,
                      background: 'linear-gradient(90deg, #F27BAF, #9B6FE2)',
                    }}
                  />
                </div>
                <span className="text-xs text-slate-500 mt-1">
                  Higher score = more sustainable and transparent.
                </span>
              </div>
            </div>

            {/* Certifications (optional) */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1">
                Certifications <span className="text-slate-400 text-xs ml-1">(optional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {['ISO 14001', 'OEKO-TEX', 'Fair-Trade'].map(option => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => handleCertToggle(option)}
                    className="px-3 py-1.5 rounded-full text-xs md:text-sm border transition"
                    style={{
                      borderColor: certs.includes(option) ? '#9B6FE2' : '#D0CFCF',
                      backgroundColor: certs.includes(option) ? '#FECFF1' : '#ffffff',
                      color: certs.includes(option) ? '#9B6FE2' : '#374151',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer – CTA */}
            <div className="pt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-xs md:text-sm text-slate-500">
                Step 1: Save your sustainability and supply chain data.<br />
                Step 2: Upload the garment image & mint the NFT passport.
              </p>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-full text-sm md:text-base font-semibold shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #9B6FE2, #F27BAF)',
                  color: '#ffffff',
                }}
              >
                Continue to Mint & Upload Image
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Wallet modal (existing logic, untouched) */}
      <ConnectWallet
        openModal={walletModalOpen}
        closeModal={() => setWalletModalOpen(false)}
      />

      {/* NFT mint modal (existing logic, untouched). 
          هنا المستخدم يرفع الصورة ويعمل Mint فعلياً باستخدام NFTmint.tsx */}
      <NFTmint openModal={nftModalOpen} setModalState={setNftModalOpen} />
    </div>
  )
}

export default DesignerPortal
