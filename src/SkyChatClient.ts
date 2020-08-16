import {EventEmitter} from "events";
import {SkyChatConfig} from "./SkyChatConfig";
import * as WebSocket from "isomorphic-ws";


/**
 * Client for a SkyChat Server
 */
export class SkyChatClient extends EventEmitter {

    public webSocket: WebSocket | null;

    public readonly config: SkyChatConfig;

    public currentRoomId: number | null;

    /**
     * @TODO to be typed with the correct schema
     */
    public currentUser: any | null;

    /**
     * @TODO to be typed with the correct schema
     */
    public connectedList: any[];

    /**
     * @TODO to be typed with the correct schema (List of users)
     */
    public typingList: any[];

    /**
     * @TODO to be typed with the correct schema
     */
    public playerState: any | null;

    constructor(config: SkyChatConfig) {
        super();

        this.config = config;
        this.currentRoomId = null;
        this.currentUser = null;
        this.connectedList = [];
        this.typingList = [];
        this.playerState = null;
        this.bind();
    }

    /**
     * Connect to the server
     */
    connect() {
        this.webSocket = new WebSocket((this.config.secure ? 'wss' : 'ws') + '://' + this.config.host);
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

    /**
     * Send a last message seen notification
     * @param {number} messageId
     */
    notifySeenMessage(messageId: number) {
        this.sendMessage(`/lastseen ${messageId}`);
    }

    /**
     * Bind own event listeners
     */
    bind() {
        this.on('join-room', this.onJoinRoom.bind(this));
        this.on('message', this.onMessage.bind(this));
        this.on('messages', this.onMessages.bind(this));
        this.on('private-message', this.onPrivateMessage.bind(this));
        this.on('message-edit', this.onMessageEdit.bind(this));
        this.on('message-seen', this.onMessageSeen.bind(this));
        this.on('set-user', this.onSetUser.bind(this));
        this.on('connected-list', this.onConnectedList.bind(this));
        this.on('yt-sync', this.onYtSync.bind(this));
        this.on('poll', this.onPoll.bind(this));
        this.on('poll-result', this.onPollResult.bind(this));
        this.on('auth-token', this.onAuthToken.bind(this));
        this.on('typing-list', this.onTypingList.bind(this));
        this.on('cursor', this.onCursor.bind(this));
        this.on('roll', this.onRoll.bind(this));
        this.on('ytapi:search', this.onYtApiSearchResults.bind(this));
        //this.on('error', this.onError.bind(this));
    }


    /**
     *
     * @param token auth token
     */
    onAuthToken(token: any) {
        if (token) {

        } else {

        }
    }

    /**
     * Update the current room id
     * @param {number} roomId
     */
    onJoinRoom(roomId: number) {
        this.currentRoomId = roomId;
    }

    /**
     *
     * @param message
     */
    onMessage(message: any) {

    }

    /**
     *
     * @param messages
     */
    onMessages(messages: any[]) {

    }

    /**
     *
     * @param privateMessage
     */
    onPrivateMessage(privateMessage: any) {

    }

    /**
     *
     * @param message
     */
    onMessageEdit(message: any) {

    }

    /**
     * Information about a message seen by another user
     * @param data
     */
    onMessageSeen(data: any) {

    }

    /**
     *
     * @param user
     */
    onSetUser(user: any) {
        this.currentUser = user;
    }

    /**
     *
     * @param connectedList
     */
    onConnectedList(connectedList: any[]) {
        this.connectedList = connectedList;
    }

    /**
     *
     * @param playerState
     */
    onYtSync(playerState: any) {
        this.playerState = playerState;
    }

    /**
     *
     * @param polls
     */
    onPoll(polls: any[]) {

    }

    /**
     *
     * @param pollResult
     */
    onPollResult(pollResult: any) {

    }

    /**
     *
     * @param users
     */
    onTypingList(users: any[]) {
        this.typingList = users;
    }

    /**
     *
     */
    onCursor(cursor: any) {

    }

    /**
     *
     */
    onRoll(roll: any) {

    }

    /**
     *
     */
    onYtApiSearchResults(items: any[]) {

    }
}
