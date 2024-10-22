import { App, getApps, initializeApp, cert } from "firebase-admin/app";
import serviceAccount from '../../../config/firebase/serviceAccountKey.json';

export class FirebaseCore {
    private _app: App;

    constructor() {
        this._initializeApp();
    }

    get app(): App {
        return this._app;
    }

    private _initializeApp() {
        console.log('Initializing Firebase app...');

        let alreadyInitialized = false;
        for (const app of getApps()) {
            if (app.name === '[DEFAULT]') {
                this._app = app;
                alreadyInitialized = true;
                break;
            }
        }
        if (alreadyInitialized) {
            return;
        }

        this._app = initializeApp({
            credential: cert({
                projectId: serviceAccount.project_id,
                clientEmail: serviceAccount.client_email,
                privateKey: serviceAccount.private_key,
            }),
        });
    }
}