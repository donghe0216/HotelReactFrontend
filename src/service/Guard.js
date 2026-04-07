import React from "react";
import { useLocation, Navigate } from "react-router-dom";
import ApiService from "./ApiService";



// Guards any authenticated user (CUSTOMER or ADMIN) — intentional: admins can also access customer routes
export const CustomerRoute = ({element: Component}) =>{
    const location = useLocation();
    return ApiService.isAthenticated() ? (
        Component
    ):(
        // Preserve the attempted URL so LoginPage can redirect back after successful login
        <Navigate to="/login" replace state={{from: location}}/>
    )
}


// Guards admin-only routes; non-admin authenticated users are also redirected to login
export const AdminRoute = ({element: Component}) =>{
    const location = useLocation();
    return ApiService.isAdmin() ? (
        Component
    ):(
        <Navigate to="/login" replace state={{from: location}}/>
    )
}