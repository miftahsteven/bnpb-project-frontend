"use client";

import { useUI } from "@/hooks/useUI";
import LoginModal from "@/components/auth/LoginModal";

export default function LoginModalLayer() {
    const { loginModalOpen, setLoginModalOpen } = useUI();

    if (!loginModalOpen) return null;

    return <LoginModal open={loginModalOpen} onClose={() => setLoginModalOpen(false)} />;
}
