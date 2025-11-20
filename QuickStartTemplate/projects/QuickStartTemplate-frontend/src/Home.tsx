// src/Home.tsx
import React from "react";
import { Link } from "react-router-dom";

const Home: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "60px 16px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          "linear-gradient(135deg, #FECFF1 0%, #F27BAF 30%, #9B6FE2 100%)",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 880,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(14px)",
          borderRadius: 26,
          padding: "40px",
          border: "1px solid #D0CFCF",
          boxShadow: "0 16px 48px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* Branding */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              background: "#BBF0ED",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 22px rgba(187,240,237,0.75)",
            }}
          >
            <span
              style={{
                fontSize: 34,
                fontWeight: 900,
                color: "#F27BAF",
              }}
            >
              ★
            </span>
          </div>

          <div>
            <div
              style={{
                fontSize: 30,
                fontWeight: 800,
                color: "#9B6FE2",
                letterSpacing: "0.05em",
              }}
            >
              ÉTOILE
            </div>
            <div style={{ fontSize: 14, opacity: 0.7 }}>
              Digital Product Passport · Algorand dApp
            </div>
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 30 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 32,
              fontWeight: 800,
              color: "#4c3e6d",
              letterSpacing: "-0.3px",
            }}
          >
            Digital Product Passport for Fashion
          </h1>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: 16,
              maxWidth: 580,
              lineHeight: 1.7,
              color: "#5e5b5b",
            }}
          >
            A sustainability-driven Web3 experience on Algorand, enabling fashion brands and consumers to create transparent, secure, and eco-friendly Digital Product Passports.
          </p>
        </div>

        {/* Web3 / Algorand-style cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 20,
            marginTop: 20,
          }}
        >
          {/* DESIGNER PORTAL */}
          <Link to="/designer" style={{ textDecoration: "none" }}>
            <div
              style={{
                background:
                  "linear-gradient(135deg, #FECFF1 0%, #F27BAF 45%, #9B6FE2 100%)",
                padding: "18px",
                borderRadius: 18,
                height: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "#ffffff",
                boxShadow: "0 6px 18px rgba(155,111,226,0.22)",
                border: "1px solid rgba(255,255,255,0.22)",
                transition: "0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 8px 26px rgba(155,111,226,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(0px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 6px 18px rgba(155,111,226,0.22)";
              }}
            >
              <div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>For Designers</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  Designer Portal
                </div>
              </div>

              <p
                style={{
                  fontSize: 13,
                  margin: 0,
                  opacity: 0.95,
                  lineHeight: 1.4,
                }}
              >
                Design your unique fashion piece and create a Digital Product Passport
      that verifies its origin, materials, and sustainability.
              </p>
            </div>
          </Link>

          {/* CONSUMER PORTAL */}
          <Link to="/consumer" style={{ textDecoration: "none" }}>
            <div
              style={{
                background:
                  "linear-gradient(135deg, #BBF0ED 0%, #9B6FE2 45%, #F27BAF 100%)",
                padding: "18px",
                borderRadius: 18,
                height: 150,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                color: "#ffffff",
                boxShadow: "0 6px 18px rgba(155,111,226,0.22)",
                border: "1px solid rgba(255,255,255,0.22)",
                transition: "0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(-3px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 8px 26px rgba(155,111,226,0.35)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  "translateY(0px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 6px 18px rgba(155,111,226,0.22)";
              }}
            >
              <div>
                <div style={{ fontSize: 13, opacity: 0.85 }}>For Consumers</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  Consumer Portal
                </div>
              </div>

              <p
                style={{
                  fontSize: 13,
                  margin: 0,
                  opacity: 0.95,
                  lineHeight: 1.4,
                }}
              >
                Discover products with verified Digital Passports ensuring transparency,
      sustainability, fair labor practices, and secure ownership history on
      Algorand.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
