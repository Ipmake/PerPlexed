export namespace PerPlexed {
    export interface Status {
        ready: boolean;
        error: boolean;
        message: string;
    }

    export namespace Sync {
        export interface SocketError {
            type: string;
            message: string;
        }

        export interface Ready {
            room: string;
            host: boolean;
        }

        export interface PlayBackState {
            key?: string;
            state: string;
            time?: number;
        }

        export interface Member {
            uid: string;
            socket: string;
            name: string;
            avatar: string;
        }
    }

    export namespace PlexTV {
        export interface User {
            id: number;
            uuid: string;
            username: string;
            title: string;
            email: string;
            friendlyName: string;
            locale: string | null;
            confirmed: boolean;
            joinedAt: number;
            emailOnlyAuth: boolean;
            hasPassword: boolean;
            protected: boolean;
            thumb: string;
            authToken: string;
            mailingListStatus: string | null;
            mailingListActive: boolean;
            scrobbleTypes: string;
            country: string;
            pin: string;
            subscription: {
                active: boolean;
                subscribedAt: number | null;
                status: string;
                paymentService: string | null;
                plan: string | null;
                features: string[];
            };
            subscriptionDescription: string | null;
            restricted: boolean;
            anonymous: boolean | null;
            restrictionProfile: string | null;
            mappedRestrictionProfile: string | null;
            customRestrictions: {
                all: string | null;
                movies: string | null;
                music: string | null;
                photos: string | null;
                television: string | null;
            };
            home: boolean;
            guest: boolean;
            homeSize: number;
            homeAdmin: boolean;
            maxHomeSize: number;
            rememberExpiresAt: number | null;
            profile: {
                autoSelectAudio: boolean;
                defaultAudioAccessibility: number;
                defaultAudioLanguage: string | null;
                defaultAudioLanguages: string[] | null;
                defaultSubtitleLanguage: string | null;
                defaultSubtitleLanguages: string[] | null;
                autoSelectSubtitle: number;
                defaultSubtitleAccessibility: number;
                defaultSubtitleForced: number;
                watchedIndicator: number;
                mediaReviewsVisibility: number;
                mediaReviewsLanguages: string[] | null;
            };
            entitlements: string[];
            services: {
                identifier: string;
                endpoint: string;
                token: string | null;
                secret: string | null;
                status: string;
            }[];
            adsConsent: string | null;
            adsConsentSetAt: number | null;
            adsConsentReminderAt: number | null;
            experimentalFeatures: boolean;
            twoFactorEnabled: boolean;
            backupCodesCreated: boolean;
            attributionPartner: string | null;
        }
    }
}