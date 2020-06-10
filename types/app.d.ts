////////////////////////////////////////////////////////////////////////////
//
// Copyright 2020 Realm Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
////////////////////////////////////////////////////////////////////////////

// As we're writing this declarations file manually, it's okay to use triple slash references
/* eslint-disable @typescript-eslint/triple-slash-reference */

/// <reference path="services.d.ts" />
/// <reference path="auth-providers.d.ts" />

declare namespace Realm {
    namespace Credentials {
        /**
         * Payload sent when authenticating using the [Email/Password Provider](https://docs.mongodb.com/stitch/authentication/userpass/).
         */
        type EmailPasswordPayload = {
            /**
             * The end-users username.
             * Note: This currently has to be an email.
             */
            username: string;

            /**
             * The end-users password.
             */
            password: string;
        };

        /**
         * Payload sent when authenticating using the [API Key Provider](https://docs.mongodb.com/stitch/authentication/api-key/).
         */
        type ApiKeyPayload = {
            /**
             * The secret content of the API key.
             */
            key: string;
        };

        /**
         * Payload sent when authenticating using the [Anonymous Provider](https://docs.mongodb.com/stitch/authentication/anonymous/).
         */
        type AnonymousPayload = {};
    }

    /**
     * End-users enter credentials to authenticate toward your MongoDB Realm App.
     */
    class Credentials<PayloadType extends object = object> {
        /**
         * Name of the authentication provider.
         */
        readonly providerName: string;

        /**
         * Type of the authentication provider.
         */
        readonly providerType: string;

        /**
         * A simple object which can be passed to the server as the body of a request to authenticate.
         */
        readonly payload: PayloadType;

        /**
         * Creates credentials that logs in using the [Anonymous Provider](https://docs.mongodb.com/stitch/authentication/anonymous/).
         *
         * @returns The credentials instance, which can be passed to `app.logIn`.
         */
        static anonymous(): Credentials<Credentials.AnonymousPayload>;

        /**
         * Creates credentials that logs in using the [API Key Provider](https://docs.mongodb.com/stitch/authentication/api-key/).
         *
         * @param key The secret content of the API key.
         * @returns The credentials instance, which can be passed to `app.logIn`.
         */
        static apiKey(key: string): Credentials<Credentials.ApiKeyPayload>;

        /**
         * Creates credentials that logs in using the [Email/Password Provider](https://docs.mongodb.com/stitch/authentication/userpass/).
         * Note: This was formerly known as the "Username/Password" provider.
         *
         * @param email The end-users email address.
         * @param password The end-users password.
         * @returns The credentials instance, which can be passed to `app.logIn`.
         */
        static emailPassword(
            email: string,
            password: string,
        ): Credentials<Credentials.EmailPasswordPayload>;

        // TODO: Add providerCapabilities?
    }

    /**
     * The constructor of MongoDB Realm App.
     */
    type AppConstructor = new <
        FunctionsFactoryType extends object = DefaultFunctionsFactory
    >(
        idOrConfiguration: string | AppConfiguration,
    ) => App<FunctionsFactoryType>;

    /**
     * A MongoDB Realm App.
     */
    class App<FunctionsFactoryType extends object = DefaultFunctionsFactory> {

        /**
         *
         */
        static readonly Credentials: typeof Credentials;

        /**
         * The id of this Realm app.
         */
        readonly id: string;

        /**
         * Use this to call functions defined by the MongoDB Realm app.
         */
        readonly functions: FunctionsFactoryType & BaseFunctionsFactory;

        /**
         * Use this to call services within by the MongoDB Realm app.
         */
        services: Realm.Services;

        /**
         * Perform operations on an app's authentication providers.
         */
        auth: Realm.AuthProviders;

        /**
         * The last user to log in or being switched to.
         */
        readonly currentUser: Realm.User | null;

        /**
         * All authenticated users.
         */
        readonly allUsers: Readonly<Realm.User[]>;

        /**
         * Log in a user using a specific credential
         *
         * @param credentials the credentials to use when logging in
         */
        logIn(credentials: Credentials): Promise<Realm.User>;

        /**
         * Log out the currently authenticated user and clear any persisted authentication information.
         */
        logOut(): Promise<void>;

        /**
         * Switch current user, from an instance of `Realm.User` or the string id of the user.
         */
        switchUser(user: User | string): void;
    }

    /**
     * Pass an object implementing this interface to the app constructor.
     */
    interface AppConfiguration {
        /**
         * The Realm App ID
         */
        id: string;

        /**
         * An optional URL to use as a prefix when requesting the MongoDB Realm services.
         */
        baseUrl?: string;
    }

    /**
     * Representation of an authenticated user of an app.
     */
    class User<
        FunctionsFactoryType extends object = DefaultFunctionsFactory,
        CustomDataType extends object = any
    > {
        /**
         * The automatically-generated internal ID of the user.
         */
        readonly id: string;

        /**
         * The state of the user.
         */
        readonly state: UserState;

        // TODO: Populate the list of identities
        // readonly identities: UserIdentity[];

        /**
         * The access token used when requesting a new access token.
         */
        readonly accessToken: string | null;

        /**
         * The refresh token used when requesting a new access token.
         */
        readonly refreshToken: string | null;

        /**
         * You can store arbitrary data about your application users in a MongoDB collection and configure Stitch to automatically expose each user’s data in a field of their user object.
         * For example, you might store a user’s preferred language, date of birth, or their local timezone.
         *
         * If this value has not been configured, it will be empty.
         */
        readonly customData: CustomDataType;

        /**
         * A profile containing additional information about the user.
         */
        readonly profile: UserProfile;

        /**
         * Use this to call functions defined by the MongoDB Realm app, as this user.
         */
        readonly functions: FunctionsFactoryType & BaseFunctionsFactory;

        /**
         * This object allows API keys associated with the user to be retrieved, created, enabled and disabled.
         */
        readonly apiKeys: Realm.Auth.ApiKeyProvider;

        /**
         * Log out the user.
         */
        logOut(): Promise<void>;

        /**
         * Link the user with a new identity represented by another set of credentials.
         * 
         * @param credentials The credentials to use when linking.
         */
        linkCredentials(credentials: Credentials): Promise<void>;

        /**
         * Call a remote MongoDB Realm function by it's name.
         * Note: Consider using `functions[name]()` instead of calling this method.
         *
         * @example
         * // These are all equivalent:
         * await user.callFunction("doThing", [a1, a2, a3]);
         * await user.functions.doThing(a1, a2, a3);
         * await user.functions["doThing"](a1, a2, a3);
         *
         * @example
         * // The methods returned from the functions object are bound, which is why it's okay to store the function in a variable before calling it:
         * const doThing = user.functions.doThing;
         * await doThing(a1);
         * await doThing(a2);
         *
         * @param name Name of the function
         * @param args Arguments passed to the function
         */
        callFunction(name: string, ...args: any[]): Promise<any>;

        /**
         * Refresh the access token and derive custom data from it.
         * 
         * @returns The newly fetched custom data.
         */
        refreshCustomData(): Promise<CustomDataType>;

        /** 
         * Use the Push service to enable sending push messages to this user via Firebase Cloud Messaging (FCM).
         * 
         * @returns An service client with methods to register and deregister the device on the user.
         */
        push(serviceName: string): {
            /**
             * Register this device with the user.
             * 
             * @param token A Firebase Cloud Messaging (FCM) token, retrieved via the firebase SDK.
             */
            register(token: string): Promise<void>,

            /**
             * Deregister this device with the user, to disable sending messages to this device.
             */
            deregister(): Promise<void>,
        };
    }

    /**
     * The state of a user.
     */
    enum UserState {
        /** Authenticated and available to communicate with services. */
        Active = "active",
        /** Logged out, but ready to be logged in. */
        LoggedOut = "logged-out",
        /** Removed from the app entirely. */
        Removed = "removed",
    }

    /**
     * The type of a user.
     */
    enum UserType {
        /** A normal end-user created this user */
        Normal = "normal",
        /** The user was created by the server */
        Server = "server",
    }

    // TODO: Implement storing these identities on the user
    interface UserIdentity {
        userId: string;
        providerType: string;
    }

    /**
     * An extended profile with detailed information about the user.
     */
    interface UserProfile {
        /**
         * The commonly displayed name of the user.
         */
        name?: string;

        /**
         * The users email address.
         */
        email?: string;

        /**
         * A URL referencing a picture associated with the user.
         */
        pictureURL?: string;

        /**
         * The users first name.
         */
        firstName?: string;

        /**
         * The users last name.
         */
        lastName?: string;

        /**
         * The users gender.
         * // TODO: Determine if this is free-text or actually an enum type.
         */
        gender?: string;

        /**
         * The users birthday.
         * // TODO: Determine the format.
         */
        birthday?: string;

        /**
         * The minimal age of the user.
         */
        minAge?: string;

        /**
         * The maximal age of the user.
         */
        maxAge?: string;

        /**
         * The type of user
         * // TODO: Determine the meaning of the different possibilities.
         */
        type: UserType;
    }

    /**
     * A function which executes on the MongoDB Realm platform.
     */
    type RealmFunction<R, A extends any[]> = (...args: A) => Promise<R>;

    /**
     * A collection of functions as defined on the MongoDB Server.
     */
    interface BaseFunctionsFactory {
        /**
         * Call a remote MongoDB Realm function by it's name.
         * Consider using `functions[name]()` instead of calling this method.
         *
         * @param name Name of the function
         * @param args Arguments passed to the function
         */
        callFunction(name: string, ...args: any[]): Promise<any>;
    }

    /**
     * A collection of functions as defined on the MongoDB Server.
     */
    interface DefaultFunctionsFactory extends BaseFunctionsFactory {
        /**
         * All the functions are accessable as members on this instance.
         */
        [name: string]: RealmFunction<any, any[]>;
    }
}
