// src/Designer.tsx

import { useWallet } from "@txnlab/use-wallet-react";
import React, { ChangeEvent, FormEvent, useState } from "react";
import ConnectWallet from "./components/ConnectWallet";

const Designer: React.FC = () => {
  const { activeAddress } = useWallet();
  const connected = Boolean(activeAddress);

  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    garmentName: "",
    materialComposition: "",
    factoryCountry: "",
    sustainabilityScore: "",
    certifications: "",
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!connected || !activeAddress) {
      alert("Please connect your Algorand wallet first.");
      return;
    }

    if (!imageFile) {
      alert("Please upload a garment image.");
      return;
    }

    console.log("Designer wallet:", activeAddress);
    console.log("Passport form:", formData);
    console.log("Garment image file:", imageFile);

    alert(
      "Digital Passport data captured (UI only for now). Later we plug in the minting flow."
    );
    setShowModal(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 16px 60px",
        background: "linear-gradient(135deg, #FECFF1, #F27BAF, #9B6FE2)",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 960,
          background: "rgba(255,255,255,0.96)",
          borderRadius: 26,
          padding: "32px",
          border: "1px solid #D0CFCF",
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* ===== Header ===== */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 28,
                fontWeight: 800,
                color: "#4c3e6d",
              }}
            >
              Designer Portal
            </h1>
            <p style={{ fontSize: 14, color: "#6b6a6a", marginTop: 4 }}>
              Design your unique piece and prepare its Digital Product Passport.
            </p>
          </div>

          {/* Stats (ثابتة كـ UI فقط) */}
          <div style={{ display: "flex", gap: 12 }}>
            <div
              style={{
                padding: "10px 14px",
                background: "#FECFF1",
                borderRadius: 14,
                color: "#4c3e6d",
                minWidth: 120,
              }}
            >
              <div style={{ opacity: 0.7 }}>Total Designs</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>12</div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                background: "#BBF0ED",
                borderRadius: 14,
                color: "#3b5660",
                minWidth: 120,
              }}
            >
              <div style={{ opacity: 0.7 }}>Mint-ready Passports</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>7</div>
            </div>
          </div>
        </header>

        {/* ===== Wallet Section ===== */}
        <section
          style={{
            padding: 20,
            background: "#F7F5FF",
            borderRadius: 18,
            border: "1px dashed #D0CFCF",
            marginBottom: 24,
            display: "flex",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#6a5aa8",
                textTransform: "uppercase",
              }}
            >
              Wallet Connection
            </div>
            <p style={{ fontSize: 14, color: "#646262" }}>
              Connect your Algorand wallet to start creating Digital Passports.
            </p>
            {activeAddress && (
              <p style={{ fontSize: 12, color: "#777", marginTop: 6 }}>
                Connected as:{" "}
                <span style={{ fontWeight: 600 }}>{activeAddress}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => setWalletModalOpen(true)}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: connected
                ? "linear-gradient(135deg, #9B6FE2, #BBF0ED)"
                : "linear-gradient(135deg, #BBF0ED, #9B6FE2, #F27BAF)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 6px 18px rgba(155,111,226,0.35)",
            }}
          >
            {connected ? "Wallet Connected" : "Connect Wallet"}
          </button>
        </section>

        {/* Wallet modal from template */}
        <ConnectWallet
          openModal={walletModalOpen}
          closeModal={() => setWalletModalOpen(false)}
        />

        {/* ===== Create Passport Section ===== */}
        <section>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#4c3e6d" }}>
            What do you want to design today?
          </h2>

          <button
            onClick={() => setShowModal(true)}
            style={{
              marginTop: 12,
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, #F27BAF, #9B6FE2)",
              color: "#fff",
              fontWeight: 600,
              fontSize: 14,
              boxShadow: "0 8px 20px rgba(155,111,226,0.35)",
            }}
          >
            Create New Digital Passport
          </button>
        </section>

        {/* ===== Popup Modal for Form ===== */}
        {showModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 100,
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: 720,
                background: "#fff",
                padding: 22,
                borderRadius: 22,
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <h3 style={{ margin: 0 }}>Digital Passport</h3>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Image Upload + Preview */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 14,
                  }}
                >
                  <div>
                    <label>Garment Image *</label>
                    <input type="file" onChange={handleImageChange} required />
                  </div>

                  <div
                    style={{
                      border: "1px dashed #ccc",
                      borderRadius: 14,
                      minHeight: 120,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "#F7F5FF",
                    }}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        style={{ maxWidth: "100%", maxHeight: 160 }}
                      />
                    ) : (
                      "Preview"
                    )}
                  </div>
                </div>

                {/* Text Fields */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: 14,
                    marginTop: 14,
                  }}
                >
                  <div>
                    <label>Garment Name *</label>
                    <input
                      name="garmentName"
                      value={formData.garmentName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label>Factory Country *</label>
                    <input
                      name="factoryCountry"
                      value={formData.factoryCountry}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label>Sustainability Score *</label>
                    <input
                      type="number"
                      name="sustainabilityScore"
                      value={formData.sustainabilityScore}
                      onChange={handleChange}
                      min={0}
                      max={100}
                      required
                    />
                  </div>

                  <div>
                    <label>Certifications (optional)</label>
                    <input
                      name="certifications"
                      value={formData.certifications}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ marginTop: 14 }}>
                  <label>Material Composition *</label>
                  <textarea
                    name="materialComposition"
                    value={formData.materialComposition}
                    onChange={handleChange}
                    rows={3}
                    required
                  />
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 16,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "1px solid #ccc",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!connected}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "none",
                      background: connected
                        ? "linear-gradient(135deg, #F27BAF, #9B6FE2)"
                        : "#ccc",
                      color: connected ? "#fff" : "#777",
                      cursor: connected ? "pointer" : "not-allowed",
                      fontWeight: 600,
                    }}
                  >
                    Save (UI only)
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Designer;
