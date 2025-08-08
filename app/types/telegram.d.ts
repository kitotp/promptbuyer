export { };

declare global {
    interface Window {
        Telegram: {
            WebApp: {
                initData: string;
                initDataUnsafe: {
                    user?: {
                        id: number;
                        username?: string;
                        first_name?: string;
                        last_name?: string;
                        language_code?: string;
                    };
                };
                ready: () => void;
                expand: () => void;
                close: () => void;
            };
        };
    }
}
