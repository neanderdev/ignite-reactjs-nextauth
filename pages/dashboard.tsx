import { useEffect, useContext } from "react";

import { AuthContext } from "../contexts/AuthContext";
import { useCan } from "../hooks/useCan";

import { setupAPICliente } from "../services/api";
import { api } from '../services/apiClient';

import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard() {
    const { user } = useContext(AuthContext);

    const userCanSeeMetries = useCan({
        permissions: ['metrics.list']
    });

    useEffect(() => {
        api.get('me')
            .then(response => console.log(response))
            .catch(err => console.log(err));
    }, []);

    return (
        <>
            <div>
                <h1>Dashboard</h1>
                <p>{user?.email}</p>
            </div>

            {userCanSeeMetries && <h3>Métricas</h3>}
        </>
    );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPICliente(ctx);
    const response = await apiClient.get('/me');
    console.log(response.data);

    return {
        props: {}
    };
})