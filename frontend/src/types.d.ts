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
        PLEX_SERVER: string;
        DEPLOYMENTID: string;
        CONFIG: {
            DISABLE_PROXY: boolean;
            DISABLE_PERPLEXED_SYNC: boolean;
        }
    }
}