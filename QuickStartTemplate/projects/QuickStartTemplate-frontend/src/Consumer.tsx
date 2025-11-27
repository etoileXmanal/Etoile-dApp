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
assetId?: number;
imageUrl?: string;
}

interface ConsumerItem extends StoredDesign {
priceDusd: number;
}

interface AtomicOp {
id: number;
label: string;
}

type PaymentType = "ALGO" | "DUSD" | "BOTH";

interface PurchaseRecord {
wallet: string;
itemId: number;
paymentType: PaymentType;
timestamp: string;
}

interface ConsumerStats {
totalItems: number;
}

const LORA = "https://lora.algokit.io/testnet";
const STATS_KEY = "etoile_consumer_purchases";

const DUSD_ASA_ID = 10458941n;
const DUSD_DECIMALS = 6;

// ---------------------------------------
// Save purchase (always +1 item)
// ---------------------------------------
function recordPurchase(wallet: string, item: ConsumerItem, paymentType: PaymentType) {
try {
const raw = localStorage.getItem(STATS_KEY);
const list: PurchaseRecord[] = raw ? JSON.parse(raw) : [];

list.push({
wallet,
itemId: item.id,
paymentType,
timestamp: new Date().toISOString(),
});

localStorage.setItem(STATS_KEY, JSON.stringify(list));
} catch (e) {
console.error("Failed to record purchase", e);
}
}

// ---------------------------------------
// Load stats (count only)
// ---------------------------------------
function loadStats(wallet: string | null | undefined): ConsumerStats {
if (!wallet) return { totalItems: 0 };
try {
const raw = localStorage.getItem(STATS_KEY);
const list: PurchaseRecord[] = raw ? JSON.parse(raw) : [];
const mine = list.filter((r) => r.wallet === wallet);
return {
totalItems: mine.length,
};
} catch {
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
const [purchaseComplete, setPurchaseComplete] = useState<string | null>(null);
const [stats, setStats] = useState<ConsumerStats>({ totalItems: 0 });

const [atomicOps, setAtomicOps] = useState<AtomicOp[] | null>(null);
const [sending, setSending] = useState(false);

const algodConfig = getAlgodConfigFromViteEnvironment();
const algorand = AlgorandClient.fromConfig({ algodConfig });


// ---------------------------------------
// Load items from localStorage
// ---------------------------------------
useEffect(() => {
try {
const saved = localStorage.getItem("etoile_recent_designs");
if (saved) {
const parsed: StoredDesign[] = JSON.parse(saved);
const minted = parsed.filter((d) => d.assetId);

if (minted.length) {
const withPrices: ConsumerItem[] = minted.map((d, idx) => ({
...d,
priceDusd: 40 + idx * 5,
}));
setItems(withPrices);
} else {
setItems([
{
id: 1,
garmentName: "Étoile Linen Blazer",
createdAt: "Demo • Not on-chain",
assetId: 123456,
priceDusd: 49,
},
]);
}
} else {
setItems([
{
id: 1,
garmentName: "Étoile Linen Blazer",
createdAt: "Demo • Not on-chain",
assetId: 123456,
priceDusd: 49,
},
]);
}
} catch {}
}, []);

// ---------------------------------------
// Load stats
// ---------------------------------------
useEffect(() => {
setStats(loadStats(activeAddress));
}, [activeAddress]);


// ---------------------------------------
// Checkout modal logic
// ---------------------------------------
const handleOpenCheckout = (item: ConsumerItem, payment: PaymentType) => {
setSelectedItem(item);
setSelectedPayment(payment);
setPurchaseComplete(null);

const ops: AtomicOp[] = [];

if (payment === "ALGO") {
ops.push({ id: 1, label: "Self-payment 1 ALGO" });
} else if (payment === "DUSD") {
ops.push({ id: 1, label: "Self-payment 1 dUSD" });
} else {
ops.push({ id: 1, label: "Self-payment 1 ALGO" });
ops.push({ id: 2, label: "Self-payment 1 dUSD" });
}

ops.push({
id: ops.length + 1,
label: "Self-transfer NFT passport",
});

setAtomicOps(ops);
};

// ---------------------------------------
// Send actual atomic transfer
// ---------------------------------------
const handleConfirmAtomicPurchase = async () => {
if (!selectedItem?.assetId) return;
if (!activeAddress || !transactionSigner) return;

setSending(true);

try {
const wallet = activeAddress;
const group = algorand.newGroup();

if (selectedPayment === "ALGO") {
group.addPayment({
signer: transactionSigner,
sender: wallet,
receiver: wallet,
amount: algo(1),
});
} else if (selectedPayment === "DUSD") {
const oneDusd = 1n * 10n ** BigInt(DUSD_DECIMALS);
group.addAssetTransfer({
signer: transactionSigner,
sender: wallet,
receiver: wallet,
assetId: DUSD_ASA_ID,
amount: oneDusd,
});
} else {
group.addPayment({
signer: transactionSigner,
sender: wallet,
receiver: wallet,
amount: algo(1),
});
const oneDusd = 1n * 10n ** BigInt(DUSD_DECIMALS);
group.addAssetTransfer({
signer: transactionSigner,
sender: wallet,
receiver: wallet,
assetId: DUSD_ASA_ID,
amount: oneDusd,
});
}

group.addAssetTransfer({
signer: transactionSigner,
sender: wallet,
receiver: wallet,
assetId: BigInt(selectedItem.assetId),
amount: 1n,
});

await group.send();

// ---------------------------------------
// SUCCESS → show simple message
// ---------------------------------------
setPurchaseComplete("success");

// Save stats (+1 item)
recordPurchase(activeAddress, selectedItem, selectedPayment);
setStats(loadStats(activeAddress));
} catch (e) {
console.error(e);
alert("Atomic transfer failed.");
}

setSending(false);
};

const paymentLabel =
selectedPayment === "ALGO"
? "1 ALGO"
: selectedPayment === "DUSD"
? "1 dUSD"
: "1 ALGO + 1 dUSD";

return (
<div
style={{
minHeight: "100vh",
padding: "40px 16px 60px",
background: "linear-gradient(135deg, #FECFF1, #BBF0ED, #9B6FE2)",
fontFamily: "Inter",
display: "flex",
justifyContent: "center",
}}
>
<div
style={{
width: "100%",
maxWidth: 1040,
background: "white",
borderRadius: 26,
padding: 32,
}}
>
<BackToHomeButton />

{/* Header */}
<header
style={{
display: "flex",
justifyContent: "space-between",
marginBottom: 24,
}}
>
<div>
<h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>
Consumer Marketplace (POC)
</h1>
</div>

<button
onClick={() => setWalletModalOpen(true)}
style={{
padding: "8px 16px",
borderRadius: 999,
border: "none",
background: connected ? "#9B6FE2" : "#F27BAF",
color: "white",
}}
>
{connected ? "Wallet Connected" : "Connect Wallet"}
</button>
</header>

<ConnectWallet
openModal={walletModalOpen}
closeModal={() => setWalletModalOpen(false)}
/>

{/* Stats */}
<div
style={{
marginBottom: 16,
padding: 12,
borderRadius: 16,
background: "#F9FAFB",
border: "1px solid #E5E7EB",
fontSize: 14,
}}
>
Total items purchased:{" "}
<span style={{ fontWeight: 700 }}>{stats.totalItems}</span>
</div>

{/* Products */}
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
padding: 14,
borderRadius: 16,
border: "1px solid #E5E7EB",
background: "white",
}}
>
<div style={{ fontWeight: 700 }}>{item.garmentName}</div>

<div style={{ marginTop: 10 }}>
<button
style={{
padding: "8px 12px",
borderRadius: 999,
background: "#4F46E5",
color: "white",
width: "100%",
marginBottom: 6,
}}
onClick={() => handleOpenCheckout(item, "ALGO")}
>
Buy with 1 ALGO
</button>

<button
style={{
padding: "8px 12px",
borderRadius: 999,
background: "white",
border: "1px solid #9B6FE2",
color: "#6b21a8",
width: "100%",
marginBottom: 6,
}}
onClick={() => handleOpenCheckout(item, "DUSD")}
>
Buy with 1 dUSD
</button>

<button
style={{
padding: "8px 12px",
borderRadius: 999,
border: "1px dashed #F97316",
background: "#FFFBEB",
width: "100%",
}}
onClick={() => handleOpenCheckout(item, "BOTH")}
>
Atomic: 1 ALGO + 1 dUSD
</button>
</div>
</div>
))}
</div>



{/* Checkout modal */}
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
maxWidth: 600,
background: "white",
padding: 22,
borderRadius: 22,
}}
>
<h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
  {/* Success message */}
{purchaseComplete && (
<div
style={{
marginTop: 24,
padding: 12,
borderRadius: 16,
background: "#ECFDF5",
color: "#047857",
fontSize: 14,
textAlign: "center",
}}
>
success
</div>
)}
Checkout: {paymentLabel}
</h3>

{atomicOps && (
<ul style={{ marginTop: 12, fontSize: 13 }}>
{atomicOps.map((op) => (
<li key={op.id}>• {op.label}</li>
))}
</ul>
)}

<button
style={{
marginTop: 18,
padding: "10px 16px",
borderRadius: 999,
width: "100%",
background: "#9B6FE2",
color: "white",
}}
onClick={handleConfirmAtomicPurchase}
disabled={!connected || sending}
>
{sending ? "Processing..." : "Confirm purchase"}
</button>

<button
style={{
marginTop: 10,
width: "100%",
padding: "10px",
borderRadius: 999,
background: "#F3F4F6",
}}
onClick={() => {
setSelectedItem(null);
setAtomicOps(null);
}}
>
Cancel
</button>
</div>
</div>
)}
</div>
</div>
);
};

export default Consumer;