"use client";

import { useAuth } from "@/hooks/useAuth";
import LoginModal from "@/components/auth/LoginModal";
import UsersTable from "@/components/UsersTable";


export default function UsersPage() {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <LoginModal />;


    return <UsersTable />;
}
