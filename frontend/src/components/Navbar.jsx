import React from "react";
import { Lock, LockOpen } from "lucide-react";

export default function Navbar({ user, pet, petVisible, setPetVisible, isDraggable, setIsDraggable }) {
  const navLinkStyle = {
    color: "#6EE7B7",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "500",
    transition: "all 0.2s ease",
    padding: "4px 8px",
    borderRadius: "6px",
  };

  const handleNavHover = (e, entering) => {
    if (entering) {
      e.currentTarget.style.background = "rgba(110, 231, 183, 0.1)";
      e.currentTarget.style.color = "#A7F3D0";
    } else {
      e.currentTarget.style.background = "transparent";
      e.currentTarget.style.color = "#6EE7B7";
    }
  };

  const navLink = (href, label, opts = {}) => (
    <a
      href={href}
      style={navLinkStyle}
      onMouseEnter={(e) => handleNavHover(e, true)}
      onMouseLeave={(e) => handleNavHover(e, false)}
      {...opts}
    >
      {label}
    </a>
  );

  if (!user) {
    return (
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "55px",
          background: "rgba(21, 29, 40, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          boxSizing: "border-box",
          zIndex: 1001,
          boxShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
          borderBottom: "1px solid rgba(110, 231, 183, 0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {navLink("/", "Home")}
          {navLink("/login", "Login")}
          {navLink("/register", "Sign Up")}
          {navLink("/mira", "Mira")}
        </div>
      </nav>
    );
  }

  if (!pet) {
    return (
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "55px",
          background: "rgba(21, 29, 40, 0.85)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          boxSizing: "border-box",
          zIndex: 1001,
          boxShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
          borderBottom: "1px solid rgba(110, 231, 183, 0.08)",
        }}
      >
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          {navLink("/", "Home")}
          {navLink("/dashboard", "Dashboard")}
          {navLink("/shop", "Pet Shop")}
          {navLink("/focus", "Focus Mode", { target: "_blank", rel: "noopener noreferrer" })}
          {navLink("/activity", "Activity Tracker", { target: "_blank", rel: "noopener noreferrer" })}
          {navLink("/mood", "Mood Journal")}
          {navLink("/mira", "Mira")}
          {navLink("/help", "Distraction Blocker")}
        </div>

        <a
          href="/profile"
          title="Profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#6EE7B7",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: "500",
            padding: "4px 10px",
            borderRadius: "20px",
            border: "1px solid #2D3748",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2D3748";
            e.currentTarget.style.borderColor = "#6EE7B7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#2D3748";
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6EE7B7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          Profile
        </a>
      </nav>
    );
  }

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "55px",
        background: "rgba(21, 29, 40, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxSizing: "border-box",
        zIndex: 1001,
        boxShadow: "0 2px 20px rgba(0, 0, 0, 0.3)",
        borderBottom: "1px solid rgba(110, 231, 183, 0.08)",
      }}
    >
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {navLink("/", "Home")}
        {navLink("/dashboard", "Dashboard")}
        {navLink("/shop", "Pet Shop")}
        {navLink("/focus", "Focus Mode", { target: "_blank", rel: "noopener noreferrer" })}
        {navLink("/activity", "Activity Tracker", { target: "_blank", rel: "noopener noreferrer" })}
        {navLink("/mood", "Mood Journal")}
        {navLink("/mira", "Mira")}
        {navLink("/help", "Distraction Blocker")}
      </div>

      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button
          onClick={() => {
            setPetVisible(!petVisible);
            if (petVisible) setIsDraggable(false);
          }}
          style={{
            background: petVisible ? "rgba(45, 55, 72, 0.6)" : "rgba(45, 55, 72, 0.9)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            padding: "6px 14px",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
          }}
        >
          {petVisible ? "Send Pet Away" : "Bring Pet Back"}
        </button>

        <button
          onClick={() => setIsDraggable(!isDraggable)}
          style={{
            background: isDraggable ? "rgba(45, 55, 72, 0.6)" : "rgba(45, 55, 72, 0.9)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "13px",
            padding: "6px 14px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "all 0.3s ease",
            whiteSpace: "nowrap",
          }}
        >
          {isDraggable ? <><LockOpen size={14} /> Drag Pet</> : <><Lock size={14} /> Pet Locked</>}
        </button>

        <a
          href="/profile"
          title="Profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#6EE7B7",
            textDecoration: "none",
            fontSize: "0.9rem",
            fontWeight: "500",
            padding: "4px 10px",
            borderRadius: "20px",
            border: "1px solid #2D3748",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#2D3748";
            e.currentTarget.style.borderColor = "#6EE7B7";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = "#2D3748";
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6EE7B7"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          Profile
        </a>
      </div>
    </nav>
  );
}
