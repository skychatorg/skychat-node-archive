import {EventEmitter} from "events";
import {SkyChatConfig} from "./SkyChatConfig";
import * as WebSocket from "isomorphic-ws";


/**
 * Client for a SkyChat Server
 */
export class SkyChatClient extends EventEmitter {

    public webSocket: WebSocket | null;

    public readonly config: SkyChatConfig;

    constructor(config: SkyChatConfig) {
        super();

        this.config = config;
    }

    /**
     * Connect to the server
     */
    connect() {
        this.webSocket = new WebSocket((this.config.secure ? 'ws' : 'wss') + '://' + this.config.host);
        this.webSocket.addEventListener('message', this.onWebSocketMessage.bind(this));
        this.webSocket.addEventListener('close', this.onWebSocketClose.bind(this));
    }

    /**
     * When a message is received on the websocket
     * @param message
     */
    onWebSocketMessage(message: any) {
        const data = JSON.parse(message.data);
        this.emit(data.event, data.data);
    }

    /**
     *
     */
    onWebSocketClose(event: CloseEvent) {
        if (event.code === 4403) {
            // send error ?
            return;
        }
        setTimeout(this.connect.bind(this), 1000);
    }

    /**
     * Emit an event to the server
     * @param eventName
     * @param payload
     */
    sendEvent(eventName: string, payload: any) {
        if (!this.webSocket) {
            return;
        }
        this.webSocket.send(JSON.stringify({
            event: eventName,
            data: payload
        }));
    }

    /**
     * Send a message to the server
     * @param message
     */
    sendMessage(message: any) {
        this.sendEvent('message', message);
    }

    /**
     * Send cursor position
     * @param x
     * @param y
     */
    sendCursor(x: number | string, y: number | string) {
        this.sendMessage('/c ' + x + ' ' + y);
    }

    /**
     * Send a PM to the given username
     * @param username
     * @param message
     */
    sendPrivateMessage(username: string, message: string) {
        return this.sendMessage('/mp ' + username + ' ' + message);
    }

    /**
     * Set typing state
     * @param typing
     */
    setTyping(typing: boolean) {
        this.sendMessage('/t ' + (typing ? 'on' : 'off'));
    }

    /**
     * Set this user's avatar
     * @param avatar
     */
    setAvatar(avatar: string) {
        this.sendMessage('/avatar ' + avatar);
    }

    /**
     * Synchronize the youtube player
     */
    ytSync() {
        this.sendMessage('/yt sync');
    }

    /**
     * Set youtube state
     * @param {boolean} state
     */
    ytSetState(state: boolean) {
        this.sendMessage('/yt ' + (state ? 'on' : 'off'));
    }

    /**
     * Set cursor state
     * @param state
     */
    cursorSetState(state: boolean) {
        this.sendMessage('/cursor ' + (state ? 'on' : 'off'));
    }

    /**
     * Login
     * @param username
     * @param password
     */
    login(username: string, password: string) {
        this.sendEvent('login', { username, password });
    }

    /**
     * Send an auth token to login. The auth token is received upon login through the 'auth-token' event.
     * @param token
     */
    loginWithToken(token: any) {
        this.sendEvent('set-token', token);
    }

    /**
     * Logout
     */
    logout() {
        if (this.webSocket) {
            this.webSocket.close();
        }
    }

    /**
     * Register
     * @param username
     * @param password
     */
    register(username: string, password: string) {
        this.sendEvent('register', { username, password });
    }

    /**
     * Register
     * @param pollId
     * @param answer
     */
    vote(pollId: number | string, answer: boolean) {
        this.sendMessage(`/vote ${pollId} ${answer ? 'y' : 'n'}`);
    }
}
