import * as types from '../mutation-types';
import { User, PlayList, Artist, Album, Video } from '@/util/models';

const state = {
    loginValid: false,
    loginPending: false,
    signPending: false,
    signStatus: {
        timestamp: -1,
        pcSign: false,
        mobileSign: false
    },
    playlist: [],
    info: {},
    artists: [],
    videos: [],
    albums: []
};

const mutations = {
    [types.SET_LOGIN_VALID](state, payload) {
        state.loginValid = payload;
    },
    [types.SET_LOGIN_PENDING](state, payload) {
        state.loginPending = payload;
    },
    [types.SET_USER_INFO](state, payload) {
        state.info = new User(payload);
    },
    [types.UPDATE_USER_INFO](state, payload) {
        Object.assign(state.info, new User(payload));
    },
    [types.SET_USER_SIGN_PENDING](state, payload) {
        state.signPending = payload;
    },
    [types.SET_USER_SIGN_STATUS](state, payload) {
        if (!payload) {
            state.signStatus = {
                timestamp: -1,
                pcSign: false,
                mobileSign: false
            };
            return;
        }
        Object.entries(payload).forEach(([key, val]) => state.signStatus[key] = val);
    },
    [types.SET_USER_PLAYLISTS](state, payload) {
        state.playlist = payload.map(l => new PlayList(l));
    },
    [types.UPDATE_USER_PLAYLIST](state, payload) {
        const i = state.playlist.findIndex(p => p.id === payload.id);
        if (i >= 0) {
            state.playlist.splice(i, 1, new PlayList(payload));
        }
    },
    [types.SUBSCRIBE_PLAYLIST](state, payload) {
        const start = state.playlist.findIndex(p => p.creator.id !== state.info.id);
        state.playlist.splice(start, 0, new PlayList(payload));
    },
    [types.UNSUBSCRIBE_PLAYLIST](state, { id }) {
        const index = state.playlist.findIndex(l => l.id === id);
        if (index !== -1) {
            state.playlist.splice(index, 1);
        }
    },
    [types.SET_USER_ALBUMS](state, payload) {
        state.albums = payload.map(al => new Album(al));
    },
    [types.SUBSCRIBE_ALBUM](state, payload) {
        state.albums.splice(0, 0, new Album(payload));
    },
    [types.UNSUBSCRIBE_ALBUM](state, { id }) {
        const index = state.albums.findIndex(a => a.id === id);
        if (index !== -1) {
            state.albums.splice(index, 1);
        }
    },
    [types.SET_USER_ARTISTS](state, payload) {
        state.artists = payload.map(al => new Artist(al));
    },
    [types.SUBSCRIBE_ARTIST](state, payload) {
        state.artists.splice(0, 0, new Artist(payload));
    },
    [types.UNSUBSCRIBE_ARTIST](state, { id }) {
        const index = state.artists.findIndex(a => a.id === id);
        if (index !== -1) {
            state.artists.splice(index, 1);
        }
    },
    [types.SET_USER_VIDEOS](state, payload) {
        state.videos = payload.map(al => new Video(al));
    },
    [types.SUBSCRIBE_VIDEO](state, payload) {
        const v = payload instanceof Video ? payload : new Video(payload);
        state.videos.splice(0, 0, v);
    },
    [types.UNSUBSCRIBE_VIDEO](state, { id }) {
        const index = state.videos.findIndex(v => v.id === id);
        if (index !== -1) {
            state.videos.splice(index, 1);
        }
    }
};

export default {
    state,
    mutations
};
