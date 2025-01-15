declare namespace PerPlexed {
    interface RecommendationShelf {
        title: string;
        libraryID: string;
        dir: string;
        link: string;
    }

    interface Status {
        ready: boolean;
        error: boolean;
        message: string;
    }

    interface Config {
        PLEX_SERVERS: string[];
        DEPLOYMENTID: string;
        CONFIG: {
            DISABLE_PROXY: boolean;
            FRONTEND_SERVER_CHECK_TIMEOUT: number;
        }
    }
}