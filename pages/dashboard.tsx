import { useEffect } from "react";
import { useContext } from "react";

import { AuthContext } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function Dashboard() {
    const { user } = useContext(AuthContext);

    useEffect(() => {
        api.get('me').then(response => console.log(response));
    }, []);

    return (
        <div>
            <h1>Dashboard</h1>
            <p>{user?.email}</p>
        </div>
    );
}