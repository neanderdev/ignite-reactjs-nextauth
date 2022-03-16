import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from 'nookies';
import { signOut } from "../contexts/AuthContext";

let isRefreshing = false;
let failedRequestQueue = [];

export function setupAPICliente(ctx = undefined) {
    let cookies = parseCookies(ctx);

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    });

    api.interceptors.response.use(response => {
        return response;
    }, (error: AxiosError) => {
        if (error.response.status === 401) {
            // refresh token
            if (error.response.data?.code === 'token.expired') {
                cookies = parseCookies(ctx);
    
                const { 'nextauth.refreshToken': refreshToken } = cookies;
    
                let originalConfig = error.config;
    
                if (!isRefreshing) {
                    isRefreshing = true;
    
                    api.post('refresh', {
                        refreshToken
                    }).then(response => {
                        const { token } = response.data;
        
                        setCookie(
                            ctx,
                            'nextauth.token',
                            token,
                            {
                                maxAge: 60 * 60 * 24 * 30, // 30 days
                                path: '/',
                            }
                        );
                        setCookie(
                            ctx,
                            'nextauth.refreshToken',
                            response.data.refreshToken,
                            {
                                maxAge: 60 * 60 * 24 * 30, // 30 days
                                path: '/',
                            }
                        );
        
                        api.defaults.headers['Authorization'] = `Beared ${token}`;
    
                        failedRequestQueue.forEach(request => request.onSuccess(token));
                        failedRequestQueue = [];
                    }).catch(err => {
                        failedRequestQueue.forEach(request => request.onFailure(err));
                        failedRequestQueue = []; 
    
                        if (process.browser) {
                            signOut();
                        }
                    }).finally(() => {
                        isRefreshing = false;
                    });
                }
    
    
                // Fila de Requisição no Axios
                return new Promise((resolve, reject) => {
                    failedRequestQueue.push({
                        onSuccess: (token: string) => {
                            originalConfig.headers['Authorization'] = `Bearer ${token}`;
    
                            resolve(api(originalConfig));
                        },
                        onFailure: (err: AxiosError) => {
                            reject(err);
                        },
                    });
                });
            } else {
                // deslogar o usuário
                if (process.browser) {
                    signOut();
                }
            }
        }
    
        return Promise.reject(error);
    });

    return api;
}