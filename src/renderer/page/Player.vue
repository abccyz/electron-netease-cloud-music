<template>
    <div class="player ncm-page">
        <div class="bkg">
            <canvas ref="cvs"
                width="1000"
                height="600"></canvas>
        </div>
        <div :class="{ phonograph: true, play: !this.ui.paused }">
            <div class="needle"></div>
            <div class="cover"
                :style="albumImgStyle">
                <div class="disc"></div>
            </div>
            <div v-if="playing.id"
                class="action">
                <mu-button flat
                    small
                    color="black"
                    @click="handleCollect">
                    <mu-icon left
                        :size="18"
                        value="bookmark_border"></mu-icon>
                    <span>收藏</span>
                </mu-button>
                <mu-button flat
                    small
                    color="black"
                    :to="{ name: 'comment', params: { type: 'song', id: playing.id } }"
                    replace>
                    <mu-icon left
                        :size="18"
                        value="comment"></mu-icon>
                    <span>{{btnCommentText}}</span>
                </mu-button>
                <mu-button flat
                    small
                    color="black"
                    @click="toggleShare">
                    <mu-icon left
                        :size="18"
                        value="share"></mu-icon>
                    <span>分享</span>
                </mu-button>
            </div>
        </div>
        <div class="info">
            <div class="title">
                <span class="name">{{playing.name}}</span>
                <mu-button v-if="playing.mv"
                    icon
                    small
                    color="primary"
                    class="btn-mv"
                    title="查看 MV"
                    :to="{ name: 'video', params: { id: playing.mv } }"
                    replace>
                    <mu-icon value="music_video"></mu-icon>
                </mu-button>
            </div>
            <p class="source">
                <template v-if="playing.artists">
                    <span>歌手：</span>
                    <template v-for="(ar, index) in playing.artists">
                        <span v-if="index !== 0"
                            :key="'sep' + index"
                            class="sep">/</span>
                        <router-link v-if="ar.id !== 0"
                            :key="ar.id"
                            class="artist link"
                            :to="{ name: 'artist', params: { id: ar.id } }"
                            replace>{{ar.name}}</router-link>
                        <span v-else
                            :key="'ar' + index"
                            class="artist">{{ar.name}}</span>
                    </template>
                </template>
                <span class="sep"></span>
                <template v-if="playing.album">
                    <span>专辑：</span>
                    <router-link class="album link"
                        :to="{ name: 'album', params: { id: playing.album.id } }"
                        replace>{{playing.album.name}}</router-link>
                </template>
            </p>
            <div class="lyric">
                <div v-if="playing.id"
                    class="control">
                    <mu-button flat
                        small
                        color="black"
                        @click="handleLyricRefresh">
                        <mu-icon left
                            value="refresh"></mu-icon>
                        <span>刷新歌词</span>
                    </mu-button>
                </div>
                <div v-if="ui.lyricLoading"
                    class="mask">
                    <p>歌词加载中 ...</p>
                </div>
                <div v-show="!ui.lyricLoading"
                    class="scroller-wrapper">
                    <div class="scroller"
                        :style="lyricScrollerStyle">
                        <template v-if="ui.lyric.mlrc">
                            <p v-for="(line, index) in ui.lyric.mlrc.lyrics"
                                class="line"
                                :key="index"
                                :class="{active: index == currentLyricIndex}"
                                :data-time="line.timestamp">
                                <span>{{line.content}}</span>
                                <br>
                                <span>{{line.trans}}</span>
                            </p>
                        </template>
                        <template v-else-if="ui.lyric.lrc">
                            <p v-for="(line, index) in ui.lyric.lrc.lyrics"
                                :key="index"
                                class="line"
                                :class="{active: index == currentLyricIndex}"
                                :data-time="line.timestamp">
                                <span>{{line.content}}</span>
                            </p>
                        </template>
                        <template v-else-if="ui.lyric.txtLyric">
                            <pre>{{ui.lyric.txtLyric}}</pre>
                            <p><br><br></p>
                        </template>
                        <template v-else>
                            <p>暂无歌词</p>
                        </template>
                        <template v-if="ui.lyric.lyricUser">
                            <p><br></p>
                            <p>
                                <span>歌词贡献者：{{ui.lyric.lyricUser.nickname}}</span>
                                <template v-if="ui.lyric.transUser">
                                    <br>
                                    <span>翻译贡献者：{{ui.lyric.transUser.nickname}}</span>
                                </template>
                            </p>
                        </template>
                    </div>
                </div>
            </div>
        </div>
        <mu-dialog width="400"
            dialog-class="share-dlg"
            :open.sync="dlgShareOpen">
            <div class="share-content">
                <img class="share-img"
                    :src="shareImgSrc">
                <div class="share-text">{{ shareText }}</div>
            </div>
            <mu-button slot="actions"
                flat
                color="primary"
                @click="toggleShare">关闭</mu-button>
        </mu-dialog>
    </div>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex';

import Api from '@/util/api';
import {
    SET_CURRENT_INDEX,
    SET_RADIO_INDEX,
    SET_ACTIVE_LYRIC
} from '@/vuex/mutation-types';
import { bkgImg, sizeImg, HiDpiPx } from '@/util/image';
import defaultCoverImg from 'assets/img/cover_default.webp';

export default {
    name: 'page-player',
    data() {
        return {
            isActive: false,
            canvasImageId: -1,
            threadInfoId: -1,
            commentCount: '...',
            /** @type {HTMLAudioElement} */
            audioEl: null,
            lyricElemMap: [],
            currentLyricIndex: -1,
            dlgShareOpen: false
        };
    },
    computed: {
        ...mapState(['ui', 'user']),
        ...mapGetters(['playing']),
        albumImgStyle() {
            if (this.playing.album && this.playing.album.picUrl) {
                return bkgImg(sizeImg(this.playing.album.picUrl, HiDpiPx(220)));
            }
            return '';
        },
        btnCommentText() {
            return `评论 (${this.commentCount})`;
        },
        shareImgSrc() {
            if (!this.playing.id) return '';
            return sizeImg(this.playing.picUrl, 352);
        },
        shareText() {
            if (!this.playing.id) return '';
            const { id, name, artistName } = this.playing;
            return `分享 ${artistName} 的单曲 《${name}》：https://music.163.com/song/${id}`;
        },
        lyricScrollerStyle() {
            if (typeof this.ui.lyric.txtLyric === 'string') {
                // non-scrollable lyric
                return 'height: 100%; overflow: auto;';
            }
            if (this.lyricElemMap.length === 0 || this.currentLyricIndex === -1) {
                // initial state
                return 'transform: translateY(164px)';
            }
            const currentLyricElem = this.lyricElemMap[this.currentLyricIndex];
            const offset = 150 - currentLyricElem.offsetTop - currentLyricElem.clientHeight;
            return `transform: translateY(${offset}px);`;
        }
    },
    methods: {
        ...mapActions([
            'updateUiLyric',
            'toggleCollectPopup'
        ]),
        listenAudioUpdate() {
            this.audioEl = document.getElementById('playerbar-audio');
            this.audioEl.addEventListener('timeupdate', ev => {
                // do nothing if element map is empty or compo not acitve
                // it's empty in case:
                // 1. no lyric for this track
                // 2. the component is mounted but not active yet e.g. it's in <keep-alive/> background
                if (!this.isActive || !this.lyricElemMap.length) return;
                // do not loop from 0 every time
                // loop form current index. if current index equals -1, loop from 0
                let loopStart = this.currentLyricIndex === -1 ? 0 : this.currentLyricIndex;
                // the process was darged backword, loop from 0
                if (ev.target.currentTime < +this.lyricElemMap[loopStart].dataset.time) {
                    loopStart = 0;
                }
                // loop and find the smallest whose time larger than currentTime
                for (let i = loopStart; i < this.lyricElemMap.length; i++) {
                    if (ev.target.currentTime < +this.lyricElemMap[i].dataset.time) {
                        this.currentLyricIndex = i - 1;
                        return;
                    }
                }
                // not found any, point to the last element
                this.currentLyricIndex = this.lyricElemMap.length - 1;
            });
        },
        createLyricElemMap() {
            if (this.ui.lyric.lrc) {
                this.lyricElemMap = Array.from(document.getElementsByClassName('line'));
            }
        },
        paintBkgCanvas() {
            this.canvasImageId = this.playing.id;
            const img = new Image();
            const size = HiDpiPx(64);
            if (this.playing.album && this.playing.album.picUrl) {
                img.src = sizeImg(this.playing.album.picUrl, size);
            } else {
                img.src = defaultCoverImg;
            }
            const w = 1000;
            const h = 600;
            /** @type {CanvasRenderingContext2D} */
            const ctx = this.$refs.cvs.getContext('2d');
            ctx.globalAlpha = 0.9;
            ctx.filter = 'blur(60px) brightness(0.75)';
            const handler = () => {
                img.removeEventListener('load', handler);
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(img, 0, 0, size, size, -30, -30, w + 60, h + 60);
            };
            img.addEventListener('load', handler);
        },
        async refreshThreadInfo() {
            this.threadInfoId = this.playing.id;
            if (!this.playing.id) return;
            this.commentCount = '...';
            const thread = `R_SO_4_${this.playing.id}`;
            const resp = await Api.getCommentThreadInfoE(thread);
            if (resp.code === 200) {
                this.commentCount = resp.commentCount;
            } else {
                this.commentCount = '...';
            }
        },
        handleLyricRefresh() {
            this.updateUiLyric({ ignoreCache: true });
        },
        handleCollect() {
            if (!this.user.loginValid) {
                this.$toast.message('汝还没有登录呀      (눈‸눈)');
                return;
            }
            if (!this.playing.id) {
                this.$toast.message('究竟想收藏什么呢    (｡ŏ_ŏ)');
                return;
            }
            this.toggleCollectPopup(this.playing.id);
        },
        toggleShare() {
            this.dlgShareOpen = !this.dlgShareOpen;
            if (this.dlgShareOpen) this.$nextTick(() => {
                const node = document.querySelector('.share-text');
                if (!node) return;
                const selection = window.getSelection();
                const range = document.createRange();
                range.selectNodeContents(node);
                selection.removeAllRanges();
                selection.addRange(range);
                document.execCommand('copy');
                selection.removeAllRanges();
                this.$toast.message('已复制分享内容到粘贴版');
            });
        }
    },
    mounted() {
        this.paintBkgCanvas();
        this.refreshThreadInfo();
        this.listenAudioUpdate();
        this.createLyricElemMap();
        this.$store.subscribe(mutation => {
            if (mutation.type === SET_CURRENT_INDEX || mutation.type === SET_RADIO_INDEX) {
                if (!this.isActive) return;
                this.paintBkgCanvas();
                this.refreshThreadInfo();
            } else if (mutation.type === SET_ACTIVE_LYRIC) {
                // reset lyric position
                this.currentLyricIndex = -1;
                // query lyric elements after they are created
                this.$nextTick(() => this.createLyricElemMap());
            }
        });
    },
    activated() {
        this.isActive = true;
        if (this.canvasImageId !== this.playing.id) {
            this.paintBkgCanvas();
        }
        if (this.threadInfoId !== this.playing.id) {
            this.refreshThreadInfo();
        }
        if (!this.lyricElemMap.length) {
            this.createLyricElemMap();
        }
    },
    deactivated() {
        this.isActive = false;
    }
};
</script>

<style lang="less">
.ellipsis-text(@width: 175px) {
    display: inline-block;
    max-width: @width;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: bottom;
}

.player {
    color: black;
    display: flex;
    flex-direction: row;
    .bkg {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
        canvas {
            width: 100%;
            height: 100%;
        }
    }
    .phonograph,
    .info {
        z-index: 1;
    }
    .phonograph {
        flex: 1;
        transition: transform 25s;
        display: flex;
        flex-direction: column;
        align-items: center;
        .needle {
            z-index: 2;
            width: 100px;
            height: 200px;
            margin: -6px 0 -132px 74px;
            background-image: url('~assets/img/needle.webp');
            background-repeat: no-repeat;
            background-size: contain;
            transition: transform 0.5s;
            transform-origin: 15px 0;
            transform: rotate(-25deg);
        }
        .cover {
            will-change: transform;
            width: 220px;
            height: 220px;
            margin: 65px;
            // fallback album cover image
            background-image: url('~assets/img/disc_default.webp');
            background-size: cover;
            animation: disk-playing 25s linear infinite;
            animation-play-state: paused;
            .disc {
                width: 350px;
                height: 350px;
                margin: -65px;
                background-image: url('~assets/img/disc.webp');
                background-size: contain;
            }
        }
        .action {
            margin-top: 16px;
            display: flex;
        }
        &.play {
            .needle {
                transform: rotate(0deg);
            }
            .cover {
                animation-play-state: running;
            }
        }
    }
    .info {
        flex: 1;
        .title,
        .source,
        .scroller-wrapper {
            // lyric needs padding, or its text-shadow would be cut off
            padding-left: 6px;
        }
        .title {
            margin-top: 16px;
            display: flex;
            align-items: center;
            .name {
                .ellipsis-text(calc(~'50vw - 48px'));
                font-size: 26px;
            }
            .btn-mv {
                margin-left: 4px;
            }
        }
        .source {
            user-select: none;
            margin: 16px 0 24px;
            .sep {
                margin: 0 6px;
            }
            .artist,
            .album {
                .ellipsis-text;
                color: unset;
            }
            .link:hover {
                text-decoration: underline;
            }
        }
        .lyric {
            height: 340px;
            position: relative;
            .control {
                position: absolute;
                bottom: 0;
                z-index: 0;
                opacity: 0;
                transition: 0.5s opacity;
            }
            .mask {
                height: 100%;
                display: flex;
                align-items: center;
            }
            .scroller-wrapper {
                height: 100%;
                overflow: hidden;
                // transition: 0.5s mask-image;
                .scroller {
                    transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                    .line {
                        margin: 14px 0;
                    }
                    .active {
                        color: white;
                        text-shadow: 0 0 4px black, 0 2px 4px rgba(0, 0, 0, 0.7);
                    }
                }
            }
            &:hover {
                .scroller-wrapper {
                    mask-image: linear-gradient(to top, transparent 32px, #000 82px),
                        linear-gradient(to left, #000 10px, transparent 10px, transparent);
                    -webkit-mask-image: linear-gradient(to top, transparent 32px, #000 82px),
                        linear-gradient(to left, #000 10px, transparent 10px, transparent);
                }
                .control {
                    z-index: 1;
                    opacity: 1;
                }
            }
        }
    }
}

@keyframes disk-playing {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}

.share-content {
    .share-img {
        width: 100%;
        height: 352px;
        object-fit: contain;
    }
}
</style>
