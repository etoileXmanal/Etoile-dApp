import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Consumer from "./Consumer";
import Designer from "./Designer";
import Home from "./Home";

import AppCalls from "./components/AppCalls";
import ErrorBoundary from "./components/ErrorBoundary";
import NFTmint from "./components/NFTmint";
import Tokenmint from "./components/Tokenmint";
import Transact from "./components/Transact";

import {
  NetworkId,
  WalletId,
  WalletManager,
  WalletProvider,
} from "@txnlab/use-wallet-react";
import { Analytics } from "@vercel/analytics/react";
import { SnackbarProvider } from "notistack";

const walletManager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY, WalletId.EXODUS],
  defaultNetwork: NetworkId.TESTNET,
});

// نبني دوال بسيطة عشان نرضي الـ props المطلوبة من الكومبوننتات
// نستخدم any عشان ما يتضارب مع تعريف الواجهات داخل الملفات الأخرى
const openModal: any = (..._args: any[]) => {
  // تقدرِيين لاحقاً تخليها تفتح Snackbar أو Dialog حقيقي
  console.log("openModal called with:", _args);
};

const setModalState: any = (..._args: any[]) => {
  console.log("setModalState called with:", _args);
};

const App: React.FC = () => {
  return (
    <SnackbarProvider maxSnack={3}>
      <ErrorBoundary>
        <WalletProvider manager={walletManager}>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/designer" element={<Designer />} />
              <Route path="/consumer" element={<Consumer />} />

              {/* شاشات القالب الأصلية مع تمرير openModal و setModalState */}
              <Route
                path="/transact"
                element={
                  <Transact
                    openModal={openModal}
                    setModalState={setModalState}
                  />
                }
              />
              <Route
                path="/tokenmint"
                element={
                  <Tokenmint
                    openModal={openModal}
                    setModalState={setModalState}
                  />
                }
              />
              <Route
                path="/nftmint"
                element={
                  <NFTmint
                    openModal={openModal}
                    setModalState={setModalState}
                  />
                }
              />
              <Route
                path="/appcalls"
                element={
                  <AppCalls
                    openModal={openModal}
                    setModalState={setModalState}
                  />
                }
              />
            </Routes>
          </BrowserRouter>
          <Analytics />
        </WalletProvider>
      </ErrorBoundary>
    </SnackbarProvider>
  );
};

export default App;
