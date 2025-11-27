// src/Consumer.tsx
// POC version: buyer and seller are the same wallet (self-atomic transfer on TestNet)

import { useWallet } from "@txnlab/use-wallet-react";
import React, { useEffect, useState } from "react";
import BackToHomeButton from "./components/BTH";
import ConnectWallet from "./components/ConnectWallet";

import { algo, AlgorandClient } from "@algorandfoundation/algokit-utils";
import { getAlgodConfigFromViteEnvironment } from "./utils/network/getAlgoClientConfigs";

interface StoredDesign {
  id: number;
  garmentName: string;
  createdAt?: string;
  assetId?: number;       // موجود فقط للـ NFTs الحقيقية من صفحة المصمم
  imageUrl?: string;      // صورة المنتج (ثابتة أو جاية من المصمم لاحقاً)
}

interface ConsumerItem extends StoredDesign {
  priceDusd: number;      // demo label
}

interface AtomicOp {
  id: number;
  label: string;
}

type PaymentType = "ALGO" | "DUSD" | "BOTH";

interface ConsumerStats {
  totalItems: number;     // عدد القطع المشتراة (كم عملية شراء)
}

interface PurchaseRecord {
  wallet: string;
  itemId: number;
  paymentType: PaymentType;
  algoAmount: number;
  dusdAmount: number;
  txId?: string;
  timestamp: string;
}

const LORA = "https://lora.algokit.io/testnet";
const STATS_KEY = "etoile_consumer_purchases";

// USDC TestNet ASA (نستخدمه كـ dUSD في الديمو)
const DUSD_ASA_ID = 10458941n;
const DUSD_DECIMALS = 6;

// -------------- helpers: stats --------------
function recordPurchase(
  wallet: string,
  item: ConsumerItem,
  paymentType: PaymentType,
  txId?: string
) {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const list: PurchaseRecord[] = raw ? JSON.parse(raw) : [];

    let algoAmount = 0;
    let dusdAmount = 0;

    if (paymentType === "ALGO") algoAmount = 1;
    else if (paymentType === "DUSD") dusdAmount = 1;
    else if (paymentType === "BOTH") {
      algoAmount = 1;
      dusdAmount = 1;
    }

    list.push({
      wallet,
      itemId: item.id,
      paymentType,
      algoAmount,
      dusdAmount,
      txId,
      timestamp: new Date().toISOString(),
    });

    localStorage.setItem(STATS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Failed to record purchase", e);
  }
}

function loadStats(wallet: string | null | undefined): ConsumerStats {
  if (!wallet) return { totalItems: 0 };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    const list: PurchaseRecord[] = raw ? JSON.parse(raw) : [];
    const mine = list.filter((r) => r.wallet === wallet);

    return {
      totalItems: mine.length,
    };
  } catch (e) {
    console.error("Failed to load stats", e);
    return { totalItems: 0 };
  }
}

const Consumer: React.FC = () => {
  const { activeAddress, transactionSigner } = useWallet();
  const connected = Boolean(activeAddress && transactionSigner);

  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [items, setItems] = useState<ConsumerItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ConsumerItem | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentType>("ALGO");
  const [atomicOps, setAtomicOps] = useState<AtomicOp[] | null>(null);
  const [sending, setSending] = useState(false);

  const [stats, setStats] = useState<ConsumerStats>({ totalItems: 0 });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Algorand client
  const algodConfig = getAlgodConfigFromViteEnvironment();
  const algorand = AlgorandClient.fromConfig({ algodConfig });

  // --------- Load designs (real + demo) ----------
  useEffect(() => {
    try {
      const saved = localStorage.getItem("etoile_recent_designs");
      let dynamic: ConsumerItem[] = [];

      if (saved) {
        const parsed: StoredDesign[] = JSON.parse(saved);
        const mintedWithAssetId = parsed.filter((d) => d.assetId);
        dynamic = mintedWithAssetId.map((d, idx) => ({
          ...d,
          priceDusd: 40 + idx * 5,
        }));
      }

      // عناصر ثابتة بضمان إنها تظهر للجنة حتى لو ما فيه مصمم اشتغل
      const demo: ConsumerItem[] = [
        {
          id: 1001,
          garmentName: "Fuchsia Statement Heels",
          createdAt: "Curated demo item",
          // مافيه assetId → دفع فقط بدون NFT
          priceDusd: 49,
          imageUrl: "/demo-heel.png",
        },
        {
          id: 1002,
          garmentName: "Champagne Midi Skirt",
          createdAt: "Curated demo item",
          priceDusd: 59,
          imageUrl: "/demo-skirt.png",
        },
        {
          id: 1003,
          garmentName: "Gradient Sports Jersey",
          createdAt: "Curated demo item",
          priceDusd: 69,
          imageUrl: "/demo-jersey.png",
        },
      ];

      setItems([...dynamic, ...demo]);
    } catch (e) {
      console.error("Failed to load designs for consumer view", e);
    }
  }, []);

  // --------- stats for current wallet ----------
  useEffect(() => {
    const s = loadStats(activeAddress);
    setStats(s);
  }, [activeAddress]);

  const handleOpenCheckout = (item: ConsumerItem, paymentType: PaymentType) => {
    setSelectedItem(item);
    setSelectedPayment(paymentType);
    setSuccessMessage(null); // نرجع نخفي رسالة النجاح عند شراء جديد

    const ops: AtomicOp[] = [];

    const isRealNFT = typeof item.assetId === "number" && item.assetId > 0;

    if (paymentType === "ALGO") {
      ops.push({ id: 1, label: "Pay 1 ALGO (TestNet, POC)" });
    } else if (paymentType === "DUSD") {
      ops.push({ id: 1, label: "Pay 1 dUSD (USDC ASA 10458941)" });
    } else if (paymentType === "BOTH") {
      ops.push({ id: 1, label: "Pay 1 ALGO" });
      ops.push({ id: 2, label: "Pay 1 dUSD (USDC ASA 10458941)" });
    }

    if (isRealNFT) {
      ops.push({
        id: 99,
        label: "Transfer NFT passport in the same atomic group",
      });
    } else {
      ops.push({
        id: 99,
        label: "Demo item: payment only, no NFT on-chain",
      });
    }

    setAtomicOps(ops);
  };

  // --------- Atomic Transfer (POC) ----------
  const handleConfirmAtomicPurchase = async () => {
    if (!selectedItem) {
      alert("No item selected.");
      return;
    }
    if (!activeAddress || !transactionSigner) {
      alert("Please connect your wallet first.");
      return;
    }

    setSending(true);
    try {
      const wallet = activeAddress;
      const group = algorand.newGroup();

      // الدفع حسب نوعه
      if (selectedPayment === "ALGO" || selectedPayment === "BOTH") {
        group.addPayment({
          signer: transactionSigner,
          sender: wallet,
          receiver: wallet, // POC: self-payment
          amount: algo(1),
        });
      }

      if (selectedPayment === "DUSD" || selectedPayment === "BOTH") {
        const oneDusd = 1n * 10n ** BigInt(DUSD_DECIMALS);
        group.addAssetTransfer({
          signer: transactionSigner,
          sender: wallet,
          receiver: wallet, // self-transfer
          assetId: DUSD_ASA_ID,
          amount: oneDusd,
        });
      }

      // لو المنتج له assetId حقيقي من صفحة المصمم → ننقل NFT في نفس الجروب
      const hasRealAssetId =
        typeof selectedItem.assetId === "number" && selectedItem.assetId > 0;

      if (hasRealAssetId) {
        group.addAssetTransfer({
          signer: transactionSigner,
          sender: wallet,
          receiver: wallet,
          assetId: BigInt(selectedItem.assetId as number),
          amount: 1n,
        });
      }

      const result = await group.send();
      const firstTx = result?.txIds?.[0];

      let label = "";
      if (selectedPayment === "ALGO") label = "1 ALGO";
      else if (selectedPayment === "DUSD") label = "1 dUSD";
      else label = "1 ALGO + 1 dUSD";

      const extra = hasRealAssetId ? " + NFT passport" : "";
      setSuccessMessage(
        `Success: Atomic transfer completed for "${selectedItem.garmentName}" (${label}${extra}). TxID: ${firstTx}`
      );

      // سجّل الشراء وحدّث الإحصائية
      recordPurchase(activeAddress, selectedItem, selectedPayment, firstTx);
      const s = loadStats(activeAddress);
      setStats(s);

      // غلق مودال الـ checkout
      setSelectedItem(null);
      setAtomicOps(null);
    } catch (e) {
      console.error(e);
      alert(
        "Atomic transfer failed. Make sure your wallet has enough ALGO for fees and is opted in to USDC (ASA 10458941) if you are using dUSD."
      );
    } finally {
      setSending(false);
    }
  };

  const paymentLabel =
    selectedPayment === "ALGO"
      ? "1 ALGO"
      : selectedPayment === "DUSD"
      ? "1 dUSD"
      : "1 ALGO + 1 dUSD";

  const qrUrl = selectedItem
    ? `https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(
        `Etoile dApp | POC | asset=${selectedItem.assetId ?? "demo"} | payment=${paymentLabel}`
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
        {/* Back to landing */}
        <BackToHomeButton />

        {/* Header */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
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
              Consumer Marketplace (POC)
            </h1>
            <p style={{ fontSize: 14, color: "#6b6a6a", marginTop: 4 }}>
              Buyer and seller use the same wallet on Algorand TestNet. We
              showcase atomic grouping and wallet-side purchase tracking.
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
              onClick={() => {
                window.open("https://faucet.circle.com/", "_blank");
              }}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                border: "1px solid #E5E7EB",
                cursor: "pointer",
                background: "#ffffff",
                color: "#4b5563",
                fontWeight: 500,
                fontSize: 11,
                marginBottom: 4,
              }}
            >
              Get Test USDC & ALGO ↗️
            </button>

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
                  maxWidth: 220,
                  textAlign: "right",
                  wordBreak: "break-all",
                }}
              >
                {activeAddress}
              </span>
            )}
          </div>
        </header>

        {/* Success banner (فوق الإحصائيات عشان يبان مباشرة) */}
        {successMessage && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 18,
              border: "1px solid rgba(16,185,129,0.3)",
              background:
                "linear-gradient(135deg, rgba(187,240,237,0.5), rgba(16,185,129,0.08))",
              fontSize: 13,
              color: "#065f46",
            }}
          >
            {successMessage}
          </div>
        )}

        <ConnectWallet
          openModal={walletModalOpen}
          closeModal={() => setWalletModalOpen(false)}
        />

        {/* Stats */}
        <section
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              flex: "0 0 180px",
              padding: "10px 12px",
              borderRadius: 16,
              background: "rgba(249,250,251,0.95)",
              border: "1px solid #E5E7EB",
              fontSize: 12,
            }}
          >
            <div style={{ color: "#6b7280" }}>
              Total items purchased (POC)
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>
              {stats.totalItems}
            </div>
          </div>
        </section>

        {/* Banner */}
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
          Demo mode: static curated items are always visible for the judging
          panel. Real designer-minted passports (with asset IDs) appear at the
          top of the grid and use full Atomic Transfers (payment + NFT).
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
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
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
                    background: "linear-gradient(145deg, #ffffff, #F9FAFB)",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    minHeight: 220,
                  }}
                >
                  <div>
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt={item.garmentName}
                        style={{
                          width: "100%",
                          height: 150,
                          objectFit: "cover",
                          borderRadius: 14,
                          marginBottom: 8,
                        }}
                      />
                    )}

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
                      Demo price label:{" "}
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        1 ALGO / 1 dUSD
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                      marginTop: 10,
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
                        View Passport on Lora ↗️
                      </a>
                    ) : (
                      <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                        Demo item (no on-chain passport)
                      </span>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        onClick={() => handleOpenCheckout(item, "ALGO")}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: "none",
                          cursor: "pointer",
                          background:
                            "linear-gradient(135deg, #4F46E5, #7C3AED)",
                          color: "#fff",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        Buy with 1 ALGO
                      </button>
                      <button
                        onClick={() => handleOpenCheckout(item, "DUSD")}
                        style={{
                          flex: 1,
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: "1px solid #9B6FE2",
                          cursor: "pointer",
                          background: "#ffffff",
                          color: "#6b21a8",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        Buy with 1 dUSD
                      </button>
                      <button
                        onClick={() => handleOpenCheckout(item, "BOTH")}
                        style={{
                          flexBasis: "100%",
                          padding: "8px 10px",
                          borderRadius: 999,
                          border: "1px dashed #F97316",
                          cursor: "pointer",
                          background: "#FFFBEB",
                          color: "#C2410C",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        Atomic: 1 ALGO + 1 dUSD
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

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
                    Checkout (Atomic Transfer POC)
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      marginTop: 4,
                      fontSize: 13,
                      color: "#6b7280",
                    }}
                  >
                    Your wallet will sign a grouped transaction simulating{" "}
                    <strong>{paymentLabel}</strong>{" "}
                    {selectedItem.assetId
                      ? "+ NFT passport in the same atomic group."
                      : "(demo: payment only, no NFT on-chain)."}
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
                {/* Details + Atomic steps */}
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

                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      lineHeight: 1.5,
                    }}
                  >
                    In this proof-of-concept, the same TestNet wallet plays both
                    the consumer and designer roles. Atomic Transfers let us
                    bundle payment and NFT operations together, or just payment
                    for curated demo items.
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
                      Inspect Digital Passport on Lora ↗️
                    </a>
                  )}

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
                        Atomic group steps
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
                            {op.label}
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
                        On Algorand, atomic groups are all-or-nothing: all
                        transactions in the group must be valid for the overall
                        operation to succeed.
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14 }}>
                    <button
                      onClick={handleConfirmAtomicPurchase}
                      disabled={!connected || sending}
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
                        ? sending
                          ? "Processing atomic transfer..."
                          : `Confirm ${paymentLabel} purchase`
                        : "Connect wallet to continue"}
                    </button>
                  </div>
                </div>

                {/* QR */}
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
                        QR encodes the asset ID (or demo tag) and payment type (
                        {paymentLabel}) for POC reference.
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>
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
