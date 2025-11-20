// src/App.tsx

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

const walletManager = new WalletManager({
  wallets: [WalletId.PERA, WalletId.DEFLY, WalletId.EXODUS],
  defaultNetwork: NetworkId.TESTNET,
});

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <WalletProvider manager={walletManager}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/designer" element={<Designer />} />
            <Route path="/consumer" element={<Consumer />} />

            {/* original templates */}
            <Route path="/transact" element={<Transact />} />
            <Route path="/tokenmint" element={<Tokenmint />} />
            <Route path="/nftmint" element={<NFTmint />} />
            <Route path="/appcalls" element={<AppCalls />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </ErrorBoundary>
  );
};

export default App;
