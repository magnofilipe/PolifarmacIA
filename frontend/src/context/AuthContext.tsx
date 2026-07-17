import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

type Doctor = {
  id: string;
  nome: string;
  email: string;
};

type AuthContextType = {
  doctor: Doctor | null;
  setDoctor: (doc: Doctor | null) => void;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [doctor, setDoctorState] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionStr = sessionStorage.getItem("doctor_session");
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        setDoctorState(session);
      } catch (e) {
        console.error("Erro ao fazer parse da sessão", e);
      }
    }
    setIsLoading(false);
  }, []);

  const setDoctor = (doc: Doctor | null) => {
    setDoctorState(doc);
    if (doc) {
      sessionStorage.setItem("doctor_session", JSON.stringify(doc));
    } else {
      sessionStorage.removeItem("doctor_session");
    }
  };

  const logout = () => {
    setDoctor(null);
  };

  return (
    <AuthContext.Provider value={{ doctor, setDoctor, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
