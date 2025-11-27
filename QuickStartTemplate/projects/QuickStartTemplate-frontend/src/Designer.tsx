// src/Designer.tsx

import { useWallet } from "@txnlab/use-wallet-react";
import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import ConnectWallet from "./components/ConnectWallet";
import BackToHomeButton from "./components/BTH";

import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { sha512_256 } from "js-sha512";
import { getAlgodConfigFromViteEnvironment } from "./utils/network/getAlgoClientConfigs";

interface DesignSummary {
  id: number;
  garmentName: string;
  createdAt: string;
  assetId?: number;
  imageUrl?: string; // ✅ نحفظ رابط الصورة عشان Consumer يقدر يعرضها
}

function resolveBackendBase(): string {
  const env = import.meta.env.VITE_API_URL?.trim();
  if (env) return env.replace(/\/$/, "");

  const host = window.location.host;
  if (host.endsWith(".app.github.dev")) {
    const base = host.replace(/-\d+\.app\.github\.dev$/, "-3001.app.github.dev");
    return `https://${base}`;
  }

  return "http://localhost:3001";
}

const Designer: React.FC = () => {
  const { activeAddress, transactionSigner } = useWallet();
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

  const [recentDesigns, setRecentDesigns] = useState<DesignSummary[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ رسالة نجاح احترافية بعد المِنْت
  const [successInfo, setSuccessInfo] = useState<{
    assetId: number;
    url: string;
  } | null>(null);

  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });
  const LORA = "https://lora.algokit.io/testnet";

  // 🔄 تحميل التصاميم السابقة من localStorage عند فتح الصفحة
  useEffect(() => {
    try {
      const saved = localStorage.getItem("etoile_recent_designs");
      if (saved) {
        const parsed: DesignSummary[] = JSON.parse(saved);
        setRecentDesigns(parsed);
      }
    } catch (e) {
      console.error("Failed to load recent designs from localStorage", e);
    }
  }, []);

  const totalDesigns = recentDesigns.length;
  const mintedPassports = recentDesigns.filter((d) => d.assetId).length;

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!connected || !activeAddress || !transactionSigner) {
      alert("Please connect your Algorand wallet first.");
      return;
    }

    if (!imageFile) {
      alert("Please upload a garment image.");
      return;
    }

    if (!formData.garmentName) {
      alert("Please enter a garment name.");
      return;
    }

    setIsSubmitting(true);
    setSuccessInfo(null);

    try {
      // 1) رفع الصورة والميتا داتا للـ backend (Pinata/IPFS)
      const backendBase = resolveBackendBase();
      const backendApiUrl = `${backendBase.replace(/\/$/, "")}/api/pin-image`;

      const uploadForm = new FormData();
      uploadForm.append("file", imageFile);
      uploadForm.append("garmentName", formData.garmentName);
      uploadForm.append("materialComposition", formData.materialComposition);
      uploadForm.append("factoryCountry", formData.factoryCountry);
      uploadForm.append("sustainabilityScore", formData.sustainabilityScore);
      uploadForm.append("certifications", formData.certifications);

      console.log("Uploading to backend:", backendApiUrl);

      const response = await fetch(backendApiUrl, {
        method: "POST",
        body: uploadForm,
        mode: "cors",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Backend request failed: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      const metadataUrl = data.metadataUrl as string | undefined;

      // نحاول نلقط أي حقل يمثل رابط الصورة
      const imageUrlFromApi: string | undefined =
        data.imageUrl ??
        data.image ??
        data.imageIpfsUrl ??
        data.image_url ??
        undefined;

      if (!metadataUrl) {
        throw new Error("Backend did not return a valid metadata URL");
      }

      console.log("Metadata URL:", metadataUrl);
      console.log("Image URL from API:", imageUrlFromApi);

      // 2) Mint NFT على Algorand
      const metadataHex = sha512_256(metadataUrl);
      const bytes = metadataHex.match(/.{1,2}/g) || [];
      const metadataHash = new Uint8Array(bytes.map((b) => parseInt(b, 16)));

      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        signer: transactionSigner,
        total: 1n, // ✅ لازم bigint
        decimals: 0,
        assetName: formData.garmentName || "Etoile Passport",
        unitName: "ETPASS",
        url: metadataUrl,
        metadataHash,
        defaultFrozen: false,
      });

      const assetId = Number(result.assetId ?? result.confirmation?.assetIndex);
      console.log("Minted asset:", assetId);

      const loraUrl = `${LORA}/asset/${assetId}`;

      // ✅ رسالة نجاح داخل الصفحة
      setSuccessInfo({
        assetId,
        url: loraUrl,
      });

      // 3) تحديث قائمة التصاميم + حفظها في localStorage
      setRecentDesigns((prev) => {
        const newDesign: DesignSummary = {
          id: Date.now(),
          garmentName: formData.garmentName,
          createdAt: new Date().toLocaleString(),
          assetId,
          imageUrl: imageUrlFromApi, // ✅ نخزن الصورة لو موجودة
        };

        const updated: DesignSummary[] = [newDesign, ...prev];

        try {
          localStorage.setItem(
            "etoile_recent_designs",
            JSON.stringify(updated)
          );
        } catch (e) {
          console.error("Failed to save recent designs", e);
        }

        return updated;
      });

      // 4) Reset الفورم
      setShowModal(false);
      setImageFile(null);
      setPreviewImage(null);
      setFormData({
        garmentName: "",
        materialComposition: "",
        factoryCountry: "",
        sustainabilityScore: "",
        certifications: "",
      });
    } catch (err: any) {
      console.error(err);
      alert(
        `❌ Failed to mint NFT: ${
          err?.message || "Unknown error (check backend / wallet / network)"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
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
        {/* زر الرجوع للهوم مثل صفحة الكستمر */}
        <BackToHomeButton />

        {/* ===== Success Banner ===== */}
        {successInfo && (
          <div
            style={{
              marginBottom: 18,
              padding: "12px 16px",
              borderRadius: 18,
              border: "1px solid rgba(16, 185, 129, 0.25)",
              background:
                "linear-gradient(135deg, rgba(187,240,237,0.4), rgba(16,185,129,0.08))",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#047857",
                }}
              >
                NFT minted successfully 🎉
              </div>
              <div style={{ fontSize: 13, color: "#065f46", marginTop: 2 }}>
                Asset ID:{" "}
                <span style={{ fontWeight: 600 }}>#{successInfo.assetId}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <a
                href={successInfo.url}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: 13,
                  padding: "6px 10px",
                  borderRadius: 999,
                  border: "1px solid #047857",
                  color: "#047857",
                  textDecoration: "none",
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.9)",
                }}
              >
                View on Lora ↗
              </a>
              <button
                onClick={() => setSuccessInfo(null)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 16,
                  cursor: "pointer",
                  color: "#065f46",
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* ===== Header ===== */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 24,
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

          {/* Stats */}
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
              <div style={{ opacity: 0.7, fontSize: 12 }}>Total Designs</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {totalDesigns}
              </div>
            </div>

            <div
              style={{
                padding: "10px 14px",
                background: "#BBF0ED",
                borderRadius: 14,
                color: "#3b5660",
                minWidth: 150,
              }}
            >
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                Minted Passports
              </div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>
                {mintedPassports}
              </div>
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

        {/* ===== Recent Designs List ===== */}
        {recentDesigns.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#4c3e6d",
                marginBottom: 8,
              }}
            >
              Recent Designs
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {recentDesigns.map((design) => (
                <li
                  key={design.id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 12,
                    border: "1px solid #D0CFCF",
                    marginBottom: 6,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 14,
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {design.imageUrl && (
                      <img
                        src={design.imageUrl}
                        alt={design.garmentName}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          objectFit: "cover",
                        }}
                      />
                    )}
                    <span>
                      {design.garmentName}
                      {design.assetId && (
                        <span style={{ color: "#9B6FE2", marginLeft: 8 }}>
                          #{design.assetId}
                        </span>
                      )}
                    </span>
                  </div>
                  <span style={{ color: "#777", fontSize: 12 }}>
                    {design.createdAt}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

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
                padding: 24,
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
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#4c3e6d",
                    }}
                  >
                    Digital Passport Details
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      marginTop: 4,
                      fontSize: 13,
                      color: "#7a7a7a",
                    }}
                  >
                    Upload the garment image and fill in the sustainability and
                    production fields.
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 22,
                    cursor: "pointer",
                    color: "#777",
                  }}
                  disabled={isSubmitting}
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
                    gridTemplateColumns: "1.2fr 1fr",
                    gap: 16,
                    alignItems: "stretch",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#555",
                        marginBottom: 6,
                      }}
                    >
                      Garment Image <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    <div
                      style={{
                        border: "1px dashed #D0CFCF",
                        borderRadius: 14,
                        padding: 12,
                        background: "#F9FAFB",
                      }}
                    >
                      <input
                        type="file"
                        onChange={handleImageChange}
                        required
                        style={{ fontSize: 13 }}
                      />
                      <p
                        style={{
                          fontSize: 11,
                          color: "#888",
                          marginTop: 4,
                        }}
                      >
                        PNG / JPG up to 10MB
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      border: "1px dashed #ccc",
                      borderRadius: 14,
                      minHeight: 140,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      background: "#F7F5FF",
                      padding: 8,
                    }}
                  >
                    {previewImage ? (
                      <img
                        src={previewImage}
                        style={{
                          maxWidth: "100%",
                          maxHeight: 160,
                          borderRadius: 12,
                          boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 13,
                          color: "#999",
                        }}
                      >
                        Image preview will appear here
                      </span>
                    )}
                  </div>
                </div>

                {/* Section: Garment Info */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 14,
                    borderTop: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#4c3e6d",
                      marginBottom: 10,
                    }}
                  >
                    Garment Information
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#555",
                          marginBottom: 4,
                        }}
                      >
                        Garment Name{" "}
                        <span style={{ color: "#e11d48" }}>*</span>
                      </label>
                      <input
                        name="garmentName"
                        value={formData.garmentName}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Étoile Linen Blazer"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #D0CFCF",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#555",
                          marginBottom: 4,
                        }}
                      >
                        Factory Country{" "}
                        <span style={{ color: "#e11d48" }}>*</span>
                      </label>
                      <input
                        name="factoryCountry"
                        value={formData.factoryCountry}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Portugal"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #D0CFCF",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Sustainability */}
                <div
                  style={{
                    marginTop: 18,
                    paddingTop: 14,
                    borderTop: "1px solid #eee",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#4c3e6d",
                      marginBottom: 10,
                    }}
                  >
                    Sustainability & Compliance
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#555",
                          marginBottom: 4,
                        }}
                      >
                        Sustainability Score (0–100){" "}
                        <span style={{ color: "#e11d48" }}>*</span>
                      </label>
                      <input
                        type="number"
                        name="sustainabilityScore"
                        value={formData.sustainabilityScore}
                        onChange={handleChange}
                        min={0}
                        max={100}
                        required
                        placeholder="e.g. 85"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #D0CFCF",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#555",
                          marginBottom: 4,
                        }}
                      >
                        Certifications (optional)
                      </label>
                      <input
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleChange}
                        placeholder="e.g. GOTS, Fair Trade"
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 10,
                          border: "1px solid #D0CFCF",
                          fontSize: 13,
                          outline: "none",
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: 14 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      Material Composition{" "}
                      <span style={{ color: "#e11d48" }}>*</span>
                    </label>
                    <textarea
                      name="materialComposition"
                      value={formData.materialComposition}
                      onChange={handleChange}
                      rows={3}
                      required
                      placeholder="e.g. 80% organic cotton, 20% recycled polyester"
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 10,
                        border: "1px solid #D0CFCF",
                        fontSize: 13,
                        outline: "none",
                        resize: "vertical",
                      }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 10,
                    marginTop: 18,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 999,
                      border: "1px solid #ccc",
                      background: "#F9FAFB",
                      fontSize: 13,
                    }}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!connected || isSubmitting}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 999,
                      border: "none",
                      background:
                        !connected || isSubmitting
                          ? "#ccc"
                          : "linear-gradient(135deg, #F27BAF, #9B6FE2)",
                      color:
                        !connected || isSubmitting ? "#777" : "#fff",
                      cursor:
                        !connected || isSubmitting
                          ? "not-allowed"
                          : "pointer",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    {isSubmitting ? "Minting..." : "Mint NFT"}
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
