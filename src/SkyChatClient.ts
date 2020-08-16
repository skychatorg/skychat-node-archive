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
    public token: any | null;

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

    /**
     * List of messages
     * @TODO to be typed with the correct schema
     */
    public messages: any[];

    /**
     * List of private messages
     * @TODO to be typed with the correct schema
     */
    public privateMessages: {[username: string]: any[]};

    /**
     * User cursor's
     * @TODO to be typed with the correct schema
     */
    public cursors: {[username: string]: {date: Date, x: number, y: number, user: any}};

    /**
     * Polls in progress
     * @TODO to be typed with the correct schema
     */
    public polls: any[];

    /**
     * Results of yt api search
     * @TODO to be typed with the correct schema
     */
    public ytApiSearchResult: any[];

    /**
     * Last poll's result
     * @TODO to be typed with the correct schema
     */
    public pollResult: any | null;

    constructor(config: SkyChatConfig) {
        super();

        this.config = config;
        this.currentRoomId = null;
        this.token = null;
        this.currentUser = null;
        this.connectedList = [];
        this.typingList = [];
        this.playerState = null;
        this.messages = [];
        this.privateMessages = {};
        this.polls = [];
        this.pollResult = null;
        this.ytApiSearchResult = [];
        this.bind();
    }

    /**
     * Connect to the server
     */
    connect() {
        // Build path to websocket server
        const protocol = this.config.secure ? 'wss://' : 'ws://';
        const port = this.config.port ? ':' + this.config.port : '';
        const path = protocol + this.config.host + port;
        // Create websocket
        this.webSocket = new WebSocket(path);
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
        console.log(event);
        if ([4403, 4499].indexOf(event.code) !== -1) {
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
     * Join the given room
     * @param roomId
     */
    joinRoom(roomId: number) {
        this.sendEvent('join-room', {roomId});
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
     * Disconnect
     */
    disconnect() {
        if (this.webSocket) {
            this.webSocket.close(4499);
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
     * When the server updates the user's token.
     * @param token auth token
     */
    onAuthToken(token: any) {
        this.token = token;
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
        this.messages.push(message);
    }

    /**
     *
     * @param messages
     */
    onMessages(messages: any[]) {
        this.messages.push(...messages);
    }

    /**
     *
     * @param privateMessage
     */
    onPrivateMessage(privateMessage: any) {
        if (typeof this.privateMessages[privateMessage.user.username] === 'undefined') {
            this.privateMessages[privateMessage.user.username] = [];
        }
        this.privateMessages[privateMessage.user.username].push(privateMessage);
    }

    /**
     *
     * @param message
     */
    onMessageEdit(message: any) {
        const messageIndex =  this.messages.findIndex(m => m.id === message.id);
        if (messageIndex === -1) {
            return;
        }
        this.messages[messageIndex] = message;
    }

    /**
     * Information about a message seen by another user
     * @param data
     */
    onMessageSeen(data: any) {
        const entry = this.connectedList.find(e => e.user.id === data.user);
        if (! entry) {
            return;
        }
        entry.user.data.plugins.lastseen = data.message;
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
        this.polls = polls;
    }

    /**
     *
     * @param pollResult
     */
    onPollResult(pollResult: any) {
        this.pollResult = pollResult;
    }

    /**
     *
     * @param users
     */
    onTypingList(users: any[]) {
        this.typingList = users;
    }

    /**
     * Update the cursor position of an user
     */
    onCursor({x, y, user}: {x: number, y: number, user: any}) {
        this.cursors[user.username] = {
            x, y, user, date: new Date()
        }
    }

    /**
     *
     */
    onRoll(roll: any) {
        // No logic here. It's up to implementations to override this method, or clients to listen
    }

    /**
     *
     */
    onYtApiSearchResults(items: any[]) {
        this.ytApiSearchResult = items;
    }
}
