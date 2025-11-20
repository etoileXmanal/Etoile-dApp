// src/Consumer.tsx

import { useWallet } from "@txnlab/use-wallet-react";
import React, { useEffect, useState } from "react";
import ConnectWallet from "./components/ConnectWallet";

interface StoredDesign {
  id: number;
  garmentName: string;
  createdAt?: string;
  assetId?: number;
}

interface ConsumerItem extends StoredDesign {
  priceDusd: number;
}

interface AtomicOp {
  id: number;
  label: string;
  from: string;
  to: string;
  asset?: number;
  amountDusd?: number;
}

const LORA = "https://lora.algokit.io/testnet";

const Consumer: React.FC = () => {
  const { activeAddress } = useWallet();
  const connected = Boolean(activeAddress);

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [items, setItems] = useState<ConsumerItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ConsumerItem | null>(null);
  const [purchaseComplete, setPurchaseComplete] = useState<string | null>(null);

  const [atomicOps, setAtomicOps] = useState<AtomicOp[] | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("etoile_recent_designs");
      if (saved) {
        const parsed: StoredDesign[] = JSON.parse(saved);

        const minted = parsed.filter((d) => d.assetId);

        const withPrices: ConsumerItem[] =
          minted.length > 0
            ? minted.map((d, idx) => ({
                ...d,
                priceDusd: 40 + idx * 5,
              }))
            : [];

        if (withPrices.length === 0) {
          const demo: ConsumerItem[] = [
            {
              id: 1,
              garmentName: "Étoile Linen Blazer",
              createdAt: "Demo • Not on-chain",
              assetId: 123456,
              priceDusd: 49,
            },
            {
              id: 2,
              garmentName: "Recycled Denim Jacket",
              createdAt: "Demo • Not on-chain",
              assetId: 789012,
              priceDusd: 59,
            },
          ];
          setItems(demo);
        } else {
          setItems(withPrices);
        }
      } else {
        const demo: ConsumerItem[] = [
          {
            id: 1,
            garmentName: "Étoile Linen Blazer",
            createdAt: "Demo • Not on-chain",
            assetId: 123456,
            priceDusd: 49,
          },
          {
            id: 2,
            garmentName: "Recycled Denim Jacket",
            createdAt: "Demo • Not on-chain",
            assetId: 789012,
            priceDusd: 59,
          },
        ];
        setItems(demo);
      }
    } catch (e) {
      console.error("Failed to load designs for consumer view", e);
    }
  }, []);

  const handleOpenCheckout = (item: ConsumerItem) => {
    setSelectedItem(item);
    setPurchaseComplete(null);

    const buyer = activeAddress || "BuyerWallet";
    const seller = "Designer / Escrow Wallet";

    const ops: AtomicOp[] = [
      {
        id: 1,
        label: "Pay dUSD for the garment",
        from: buyer,
        to: seller,
        amountDusd: item.priceDusd,
      },
      {
        id: 2,
        label: "Transfer NFT passport to buyer",
        from: seller,
        to: buyer,
        asset: item.assetId,
      },
    ];

    setAtomicOps(ops);
  };

  const handleSimulatePurchase = () => {
    if (!selectedItem) return;

    setPurchaseComplete(
      `Atomic transfer completed (demo): dUSD payment + NFT passport transfer for "${selectedItem.garmentName}".`
    );
  };

  const qrUrl = selectedItem
    ? `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(
        `Etoile dApp | asset=${selectedItem.assetId} | price=${selectedItem.priceDusd} dUSD`
      )}`
    : "";

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 16px 60px",
        background: "linear-gradient(135deg, #FECFF1, #BBF0ED, #9B6FE2)",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1040,
          background: "rgba(255,255,255,0.96)",
          borderRadius: 26,
          padding: "32px",
          border: "1px solid #D0CFCF",
          boxShadow: "0 12px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
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
                fontSize: 26,
                fontWeight: 800,
                color: "#4c3e6d",
              }}
            >
              Consumer Marketplace
            </h1>
            <p style={{ fontSize: 14, color: "#6b6a6a", marginTop: 4 }}>
              Browse verified fashion pieces with Algorand-powered Digital
              Product Passports.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: 8,
            }}
          >
            <button
              onClick={() => setWalletModalOpen(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                background: connected
                  ? "linear-gradient(135deg, #9B6FE2, #BBF0ED)"
                  : "linear-gradient(135deg, #BBF0ED, #F27BAF)",
                color: "#fff",
                fontWeight: 600,
                fontSize: 13,
                boxShadow: "0 6px 18px rgba(155,111,226,0.35)",
              }}
            >
              {connected ? "Wallet Connected" : "Connect Wallet"}
            </button>
            {activeAddress && (
              <span
                style={{
                  fontSize: 11,
                  color: "#777",
                  maxWidth: 200,
                  textAlign: "right",
                  wordBreak: "break-all",
                }}
              >
                {activeAddress}
              </span>
            )}
          </div>
        </header>

        <ConnectWallet
          openModal={walletModalOpen}
          closeModal={() => setWalletModalOpen(false)}
        />

        {/* Info banner */}
        <section
          style={{
            marginBottom: 20,
            padding: "10px 14px",
            borderRadius: 16,
            background:
              "linear-gradient(120deg, rgba(254,207,241,0.5), rgba(187,240,237,0.5))",
            border: "1px solid rgba(208,207,207,0.6)",
            fontSize: 13,
            color: "#4c3e6d",
          }}
        >
          Each item includes a Digital Product Passport on Algorand. You can
          inspect the NFT on-chain and then complete a test purchase using a
          dUSD-style flow and an Atomic Transfer demo (Session 6).
        </section>

        {/* Product grid */}
        <section>
          {items.length === 0 ? (
            <p style={{ fontSize: 14, color: "#777" }}>
              No designs available yet. Once designers mint their passports,
              they will appear here.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(260px, 1fr))",
                gap: 18,
              }}
            >
              {items.map((item) => (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 18,
                    border: "1px solid #E5E7EB",
                    padding: 14,
                    background:
                      "linear-gradient(145deg, #ffffff, #F9FAFB)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 170,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#4c3e6d",
                        marginBottom: 4,
                      }}
                    >
                      {item.garmentName}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#6b7280",
                        marginBottom: 6,
                      }}
                    >
                      {item.createdAt || "Minted on-chain"}
                    </div>

                    {item.assetId && (
                      <div
                        style={{
                          fontSize: 12,
                          color: "#9B6FE2",
                          marginBottom: 6,
                        }}
                      >
                        Passport ID:{" "}
                        <span style={{ fontWeight: 600 }}>
                          #{item.assetId}
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: 13,
                        color: "#374151",
                        marginTop: 4,
                      }}
                    >
                      Price:{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {item.priceDusd.toFixed(2)} dUSD
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: 10,
                      gap: 8,
                    }}
                  >
                    {item.assetId ? (
                      <a
                        href={`${LORA}/asset/${item.assetId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          textDecoration: "underline",
                          color: "#6b21a8",
                        }}
                      >
                        View Passport on Lora ↗
                      </a>
                    ) : (
                      <span
                        style={{ fontSize: 11, color: "#9CA3AF" }}
                      >
                        Demo item (no on-chain link)
                      </span>
                    )}

                    <button
                      onClick={() => handleOpenCheckout(item)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 999,
                        border: "none",
                        cursor: "pointer",
                        background:
                          "linear-gradient(135deg, #F27BAF, #9B6FE2)",
                        color: "#fff",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      Buy with dUSD
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Purchase success note (global) */}
        {purchaseComplete && (
          <div
            style={{
              marginTop: 24,
              padding: "10px 14px",
              borderRadius: 16,
              border: "1px solid rgba(37,99,235,0.2)",
              background: "rgba(239,246,255,0.9)",
              fontSize: 13,
              color: "#1d4ed8",
            }}
          >
            {purchaseComplete}
          </div>
        )}

        {/* Checkout Modal */}
        {selectedItem && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
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
                background: "#ffffff",
                padding: 22,
                borderRadius: 22,
                boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 10,
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
                    Checkout
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      marginTop: 4,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Complete a test purchase using dUSD-style flow and an
                    Atomic Transfer demo (Session 6).
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    setAtomicOps(null);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    fontSize: 20,
                    cursor: "pointer",
                    color: "#6b7280",
                  }}
                >
                  ×
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: 16,
                  marginTop: 8,
                }}
              >
                {/* Details + Atomic demo */}
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#111827",
                      marginBottom: 4,
                    }}
                  >
                    {selectedItem.garmentName}
                  </div>
                  {selectedItem.assetId && (
                    <div
                      style={{
                        fontSize: 13,
                        color: "#6b21a8",
                        marginBottom: 6,
                      }}
                    >
                      Passport ID: #{selectedItem.assetId}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 13,
                      color: "#4b5563",
                      marginBottom: 8,
                    }}
                  >
                    Price:{" "}
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#111827",
                      }}
                    >
                      {selectedItem.priceDusd.toFixed(2)} dUSD
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      lineHeight: 1.5,
                    }}
                  >
                    For the hackathon demo, the dUSD payment is simulated.
                    In a full version, this step would use Algorand{" "}
                    <strong>Atomic Transfers</strong> to bundle the
                    payment and NFT transfer in one secure operation.
                  </p>

                  {selectedItem.assetId && (
                    <a
                      href={`${LORA}/asset/${selectedItem.assetId}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 6,
                        fontSize: 12,
                        color: "#2563eb",
                        textDecoration: "underline",
                      }}
                    >
                      Inspect Digital Passport on Lora ↗
                    </a>
                  )}

                  {/* Atomic Transfer Demo */}
                  {atomicOps && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: "rgba(243,244,246,0.9)",
                        border: "1px dashed #D1D5DB",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#4b5563",
                          marginBottom: 6,
                        }}
                      >
                        Atomic Transfer (Session 6 demo)
                      </div>
                      <ul
                        style={{
                          listStyle: "disc",
                          paddingLeft: 16,
                          margin: 0,
                        }}
                      >
                        {atomicOps.map((op) => (
                          <li
                            key={op.id}
                            style={{
                              fontSize: 12,
                              color: "#4b5563",
                              marginBottom: 3,
                            }}
                          >
                            {op.label}{" "}
                            {op.amountDusd !== undefined && (
                              <span>
                                – <strong>{op.amountDusd} dUSD</strong>
                              </span>
                            )}
                            {op.asset && (
                              <span> – NFT #{op.asset}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          marginTop: 4,
                        }}
                      >
                        In a real implementation, both operations are
                        grouped and either both succeed or both fail
                        together (Algorand Atomic Transfer).
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <button
                      onClick={handleSimulatePurchase}
                      disabled={!connected}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 999,
                        border: "none",
                        background: !connected
                          ? "#e5e7eb"
                          : "linear-gradient(135deg, #F27BAF, #9B6FE2)",
                        color: !connected ? "#6b7280" : "#ffffff",
                        fontWeight: 600,
                        fontSize: 13,
                        cursor: !connected ? "not-allowed" : "pointer",
                      }}
                    >
                      {connected
                        ? "Confirm dUSD Purchase (Atomic demo)"
                        : "Connect wallet to continue"}
                    </button>
                  </div>
                </div>

                {/* QR / Barcode */}
                <div
                  style={{
                    borderRadius: 18,
                    border: "1px dashed #D0CFCF",
                    padding: 12,
                    background: "#F9FAFB",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {qrUrl ? (
                    <>
                      <img
                        src={qrUrl}
                        alt="Purchase QR"
                        style={{
                          width: 160,
                          height: 160,
                          borderRadius: 16,
                          background: "#ffffff",
                        }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          textAlign: "center",
                        }}
                      >
                        Scan for purchase reference – the QR encodes asset
                        ID and price (demo only).
                      </div>
                    </>
                  ) : (
                    <span
                      style={{ fontSize: 12, color: "#9CA3AF" }}
                    >
                      QR will appear here
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Consumer;
